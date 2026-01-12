import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, TrendingUp, TrendingDown, Plus, Minus, Edit, Trash2, PackageCheck, History } from 'lucide-react';
import { useNDK } from '@/contexts/NDKContext';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { type InventoryItem } from '@/lib/inventoryTypes';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface InventoryEvent extends InventoryItem {
  event_id: string;
  created_at: number;
  action?: 'created' | 'updated' | 'deleted';
}

interface HistoryGroup {
  date: string;
  items: InventoryEvent[];
}

export function InventoryHistory() {
  const { ndk } = useNDK();
  const { user } = useCurrentUser();
  const [timeFilter, setTimeFilter] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Calculate time threshold based on filter
  const getTimeThreshold = () => {
    const now = Math.floor(Date.now() / 1000);
    switch (timeFilter) {
      case '7d': return now - (7 * 24 * 60 * 60);
      case '30d': return now - (30 * 24 * 60 * 60);
      case '90d': return now - (90 * 24 * 60 * 60);
      default: return 0;
    }
  };

  // Query inventory history
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['inventory-history', user?.pubkey, timeFilter],
    queryFn: async (c) => {
      if (!user) return [];

      if (!ndk) return [];

      const timeThreshold = getTimeThreshold();

      const inventoryEvents = await ndk.fetchEvents({
        kinds: [35871 as number],
        authors: [user.pubkey],
        since: timeThreshold,
        limit: 500
      });

      // Convert Set to Array
      return Array.from(inventoryEvents).map(event => {
        const tags = event.tags.reduce((acc: any, tag: string[]) => {
          acc[tag[0]] = tag[1];
          return acc;
        }, {});

        return {
          id: tags.d,
          name: tags.name,
          category: tags.category || 'pantry',
          quantity: parseInt(tags.quantity || '0'),
          min_threshold: parseInt(tags.min_threshold || '1'),
          unit: tags.unit || 'units',
          on_shopping_list: tags.on_shopping_list === 'true',
          priority: (tags.priority as 'low' | 'medium' | 'high') || 'medium',
          event_id: event.id,
          created_at: event.created_at
        } as InventoryEvent;
      });
    },
    enabled: !!user
  });

  // Group events by item and detect changes
  const changes = useMemo(() => {
    if (!events.length) return [];

    // Group by item id
    const itemsMap = new Map<string, InventoryEvent[]>();
    events.forEach(event => {
      if (!itemsMap.has(event.id)) {
        itemsMap.set(event.id, []);
      }
      itemsMap.get(event.id)!.push(event);
    });

    // Detect changes
    const changes: InventoryEvent[] = [];
    itemsMap.forEach((itemEvents, itemId) => {
      // Sort by date
      const sorted = itemEvents.sort((a, b) => b.created_at - a.created_at);

      // Mark first event as created
      sorted[sorted.length - 1].action = 'created';

      // Compare sequential events for changes
      for (let i = 0; i < sorted.length - 1; i++) {
        const current = sorted[i];
        const previous = sorted[i + 1];

        // Check if quantity changed
        if (current.quantity !== previous.quantity) {
          changes.push({ ...current, action: 'updated' });
        }
        // Check if shopping list status changed
        else if (current.on_shopping_list !== previous.on_shopping_list) {
          changes.push({ ...current, action: 'updated' });
        }
      }

      // If item was marked deleted (quantity 0, name DELETED)
      if (sorted[0].name === 'DELETED' || sorted[0].quantity === 0) {
        changes.push({ ...sorted[0], action: 'deleted' });
      }
    });

    // Sort by date and return
    return changes.sort((a, b) => b.created_at - a.created_at)
      .filter(e => categoryFilter === 'all' || e.category === categoryFilter);

  }, [events, categoryFilter]);

  // Group by date
  const groupedHistory = useMemo(() => {
    const groups: HistoryGroup[] = [];

    changes.forEach(change => {
      const date = new Date(change.created_at * 1000);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let dateLabel: string;
      if (date.toDateString() === today.toDateString()) {
        dateLabel = 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        dateLabel = 'Yesterday';
      } else {
        dateLabel = date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      }

      const group = groups.find(g => g.date === dateLabel);
      if (group) {
        group.items.push(change);
      } else {
        groups.push({ date: dateLabel, items: [change] });
      }
    });

    return groups;
  }, [changes]);

  const getActionIcon = (event: InventoryEvent) => {
    switch (event.action) {
      case 'created':
        return <Plus className="h-3 w-3 text-green-600" />;
      case 'updated':
        return event.quantity > event.min_threshold ?
          <TrendingUp className="h-3 w-3 text-blue-600" /> :
          <TrendingDown className="h-3 w-3 text-amber-600" />;
      case 'deleted':
        return <Trash2 className="h-3 w-3 text-red-600" />;
      default:
        return <Edit className="h-3 w-3 text-gray-600" />;
    }
  };

  const getActionText = (event: InventoryEvent) => {
    switch (event.action) {
      case 'created':
        return 'Item added';
      case 'updated':
        if (event.on_shopping_list) {
          return 'Added to shopping list';
        } else if (event.quantity === 0) {
          return 'Used up';
        } else {
          return event.quantity > event.min_threshold ? 'Restocked' : 'Quantity updated';
        }
      case 'deleted':
        return 'Item deleted';
      default:
        return 'Updated';
    }
  };

  const getChangeDisplay = (event: InventoryEvent) => {
    if (event.action === 'created') {
      return `${event.quantity} ${event.unit}`;
    }

    // Find previous value for context
    const previous = events.find(e => e.event_id === event.event_id);
    if (previous) {
      return `${event.quantity} ${event.unit}`;
    }

    return 'Updated';
  };

  if (isLoading) {
    return (
      <Card className="border-0 bg-card/50">
        <CardContent className="p-6">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading history...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (changes.length === 0) {
    return (
      <Card className="border-0 bg-card/50">
        <CardContent className="p-6">
          <div className="text-center py-12">
            <History className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No history yet</h3>
            <p className="text-muted-foreground">
              As you update your inventory, your changes will appear here
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="text-sm font-medium mb-2 block">Time Period</label>
          <Select value={timeFilter} onValueChange={(v: any) => setTimeFilter(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1">
          <label className="text-sm font-medium mb-2 block">Category</label>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              <SelectItem value="nursery">Nursery</SelectItem>
              <SelectItem value="freezer">Freezer</SelectItem>
              <SelectItem value="fridge">Fridge</SelectItem>
              <SelectItem value="pantry">Pantry</SelectItem>
              <SelectItem value="household">Household</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* History List */}
      <div className="space-y-6">
        {groupedHistory.map(group => (
          <div key={group.date}>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">
              {group.date}
            </h3>

            <div className="space-y-3">
              {group.items.map(event => (
                <Card key={event.event_id} className="border-0 bg-card/50 transition-all hover:shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="mt-1">
                        {getActionIcon(event)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium truncate">{event.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {event.category}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="font-medium text-slate-600 dark:text-slate-400">
                            {getActionText(event)}
                          </span>
                          <span>•</span>
                          <span>{getChangeDisplay(event)}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDistanceToNow(event.created_at * 1000, { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}