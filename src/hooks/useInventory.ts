import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useToast } from '@/hooks/useToast';
import { useSharing } from '@/hooks/useSharing';
import { useState, useCallback } from 'react';
import type { InventoryItem, QuantityUpdate } from '@/lib/inventoryTypes';

const INVENTORY_KIND = 35871;

// Helper to convert Nostr event to InventoryItem
function eventToInventoryItem(event: any): InventoryItem {
  const tags = event.tags.reduce((acc: any, tag: any[]) => {
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
    created_at: event.created_at,
    event_id: event.id,
    author_pubkey: event.pubkey
  };
}

// Helper to convert InventoryItem to Nostr event
function inventoryItemToEvent(item: Partial<InventoryItem>, pubkey: string) {
  return {
    kind: INVENTORY_KIND,
    content: '',
    tags: [
      ['d', item.id!],
      ['name', item.name!],
      ['category', item.category || 'pantry'],
      ['quantity', String(item.quantity || 0)],
      ['min_threshold', String(item.min_threshold || 1)],
      ['unit', item.unit || 'units'],
      ['on_shopping_list', item.on_shopping_list ? 'true' : 'false'],
      ['priority', item.priority || 'medium']
    ],
    created_at: Math.floor(Date.now() / 1000),
    pubkey
  };
}

export function useInventory() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { sharedWithMe } = useSharing();

  // Get all author pubkeys to query (user's own items + items from people sharing with user)
  const authorPubkeys = user
    ? [user.pubkey, ...sharedWithMe.map(s => s.pubkey)]
    : [];

  // Query: Get all inventory items (own + shared with me)
  const { data: items = [], isLoading: loading, error } = useQuery({
    queryKey: ['inventory', user?.pubkey, sharedWithMe.length],
    queryFn: async (c) => {
      if (!user) return [];

      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(3000)]);

      // Query for my own items + items from people who shared with me
      const events = await nostr.query([
        {
          kinds: [INVENTORY_KIND],
          authors: authorPubkeys,
          limit: 200
        }
      ], { signal });

      return events.map(eventToInventoryItem);
    },
    enabled: !!user
  });

  // Mutation: Add or update inventory item
  const addItemMutation = useMutation({
    mutationFn: async (item: Partial<InventoryItem>) => {
      if (!user) throw new Error('Must be logged in');

      const event = await user.signer.signEvent(inventoryItemToEvent(item, user.pubkey));
      await nostr.event(event);

      return item as InventoryItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast({
        title: 'Item saved',
        description: 'Your inventory item has been updated'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error saving item',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Mutation: Update quantity (with shopping list logic)
  const updateQuantity = useMutation({
    mutationFn: async (update: QuantityUpdate) => {
      if (!user) throw new Error('Must be logged in');

      const { item, newQuantity } = update;

      // Only allow editing own items
      if (item.author_pubkey !== user.pubkey) {
        throw new Error('You can only edit your own items');
      }

      let on_shopping_list = item.on_shopping_list;

      // Auto-add to shopping list if quantity drops below threshold
      if (newQuantity <= item.min_threshold) {
        on_shopping_list = true;
      }

      const updatedItem = {
        ...item,
        quantity: newQuantity,
        on_shopping_list
      };

      const event = await user.signer.signEvent(inventoryItemToEvent(updatedItem, user.pubkey));
      await nostr.event(event);

      return { updatedItem, update };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });

      const { updatedItem, update } = data;

      if (updatedItem.on_shopping_list && update.newQuantity <= updatedItem.min_threshold) {
        toast({
          title: 'Added to shopping list',
          description: `${updatedItem.name} is running low and has been added to your shopping list`
        });
      } else {
        toast({
          title: 'Quantity updated',
          description: `${updatedItem.name} updated to ${updatedItem.quantity} ${updatedItem.unit}`
        });
      }
    }
  });

  // Mutation: Update shopping list status
  const updateShoppingList = useMutation({
    mutationFn: async ({ item, onShoppingList, purchased }: {
      item: InventoryItem;
      onShoppingList: boolean;
      purchased?: number;
    }) => {
      if (!user) throw new Error('Must be logged in');

      // Only allow editing own items
      if (item.author_pubkey !== user.pubkey) {
        throw new Error('You can only edit your own items');
      }

      const updatedItem = {
        ...item,
        on_shopping_list: onShoppingList,
        quantity: purchased !== undefined ? purchased : item.quantity
      };

      const event = await user.signer.signEvent(inventoryItemToEvent(updatedItem, user.pubkey));
      await nostr.event(event);

      return updatedItem;
    },
    onSuccess: (updatedItem) => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });

      if (!updatedItem.on_shopping_list && updatedItem.quantity > updatedItem.min_threshold) {
        toast({
          title: 'Restocked',
          description: `${updatedItem.name} has been restocked to ${updatedItem.quantity} ${updatedItem.unit}`
        });
      }
    }
  });

  // Mutation: Delete item
  const deleteItem = useMutation({
    mutationFn: async (itemId: string) => {
      if (!user) throw new Error('Must be logged in');

      // Find the item to check ownership
      const item = items.find(i => i.id === itemId);
      if (item && item.author_pubkey !== user.pubkey) {
        throw new Error('You can only delete your own items');
      }

      // Delete by setting quantity to 0 and on_shopping_list to false
      // Nostr doesn't support deletion, so we mark as inactive
      const deletionEvent = {
        kind: INVENTORY_KIND,
        content: '',
        tags: [
          ['d', itemId],
          ['name', 'DELETED'],
          ['quantity', '0'],
          ['on_shopping_list', 'false']
        ],
        created_at: Math.floor(Date.now() / 1000),
        pubkey: user.pubkey
      };

      const event = await user.signer.signEvent(deletionEvent as any);
      await nostr.event(event);

      return itemId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast({
        title: 'Item deleted',
        description: 'The item has been removed from your inventory'
      });
    }
  });

  // Helper: Get items by category
  const getItemsByCategory = useCallback((category: string) => {
    return items.filter(item => item.category === category);
  }, [items]);

  // Helper: Get shopping list items
  const shoppingListItems = items.filter(item => item.on_shopping_list);

  // Helper: Get low stock items
  const lowStockItems = items.filter(item =>
    item.quantity <= item.min_threshold && !item.on_shopping_list
  );

  return {
    items,
    shoppingListItems,
    lowStockItems,
    loading,
    error,
    addItem: addItemMutation.mutateAsync,
    updateQuantity: updateQuantity.mutateAsync,
    updateShoppingList: updateShoppingList.mutateAsync,
    deleteItem: deleteItem.mutateAsync,
    getItemsByCategory
  };
}