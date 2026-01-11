import React from 'react';
import { Button } from '@/components/ui/button';
import { PackageOpen, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface EmptyInventoryStateProps {
  onAddItem: () => void;
}

export function EmptyInventoryState({ onAddItem }: EmptyInventoryStateProps) {
  return (
    <Card className="border-2 border-dashed border-muted bg-muted/10 mx-auto max-w-2xl py-12">
      <CardContent className="flex flex-col items-center text-center space-y-4 pt-6">
        <div className="p-4 bg-primary/10 rounded-full mb-2">
          <PackageOpen className="h-12 w-12 text-primary" />
        </div>

        <div className="space-y-2 max-w-md">
          <h3 className="text-2xl font-bold bg-gradient-to-r from-slate-900 via-primary to-indigo-600 bg-clip-text text-transparent">
            Welcome to Stock Your Space!
          </h3>
          <p className="text-muted-foreground">
            Your inventory is currently empty. Start by adding your first item to keep track of your household essentials.
          </p>
        </div>

        <div className="pt-4">
          <Button onClick={onAddItem} size="lg" className="gap-2 shadow-md hover:shadow-lg transition-shadow">
            <Plus className="h-5 w-5" />
            Add Your First Item
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
