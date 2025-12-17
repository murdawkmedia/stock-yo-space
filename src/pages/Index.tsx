import { useState, useEffect } from 'react';
import { useSeoMeta } from '@unhead/react';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Package, ShoppingCart, TrendingDown, Zap, Sparkles } from 'lucide-react';
import { useInventory } from '@/hooks/useInventory';
import { LoginArea } from '@/components/auth/LoginArea';
import { useCurrentUser } from '@/hooks/useCurrentUser';

const Index = () => {
  useSeoMeta({
    title: 'Baby Stock - Smart Inventory & Shopping List',
    description: 'Track baby supplies, manage freezer inventory, and never run out again with real-time sync.',
  });

  const { user } = useCurrentUser();
  const { items, shoppingListItems, lowStockItems } = useInventory();

  // If user is logged in, redirect to inventory
  if (user) {
    return <Navigate to="/inventory" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-blue-950 dark:via-gray-900 dark:to-purple-950">
      <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <ShoppingCart className="h-8 w-8 text-primary" />
            </div>
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent mb-4">
            Baby Stock
          </h1>

          <p className="text-xl sm:text-2xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Smart inventory tracking for busy parents. Never run out of diapers, formula, or freezer staples again.
          </p>

          {/* Most Important Action */}
          <div className="mb-12">
            <LoginArea className="mx-auto" />
            <p className="text-sm text-muted-foreground mt-4">
              Login or sign up to start tracking your inventory
            </p>
          </div>
        </div>

        {/* App Preview */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                🧸 The Baby Station
              </CardTitle>
              <CardDescription>
                Quick-tap inventory for diapers, wipes, formula, and rash cream
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>✓ Quick + and - buttons for fast logging</p>
                <p>✓ Automatic shopping list when items run low</p>
                <p>✓ Track multiple diaper sizes</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-amber-600" />
                🧊 The Deep Freeze
              </CardTitle>
              <CardDescription>
                Manage your quarter cow, frozen goods, and freezer inventory
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>✓ Track steak cuts, ground beef, roasts separately</p>
                <p>✓ Organize by freezer section</p>
                <p>✓ Know what you have at a glance</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-red-600" />
                🛒 The Grocery Run
              </CardTitle>
              <CardDescription>
                Real-time shopping list that syncs across all devices instantly
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>✓ Automatic alerts when items run low</p>
                <p>✓ Live sync between devices</p>
                <p>✓ Check off items in-store</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-green-600" />
                ⚡️ Real-time Sync
              </CardTitle>
              <CardDescription>
                Powered by Nostr for instant updates across all your devices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>✓ Changes appear instantly on partner's device</p>
                <p>✓ Decentralized and secure</p>
                <p>✓ No central server required</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sample Data Section */}
        <div className="mb-12">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-center mb-2">
                <Sparkles className="h-5 w-5 inline mr-2 text-primary" />
                How It Works
              </CardTitle>
              <CardDescription className="text-center">
                Simple inventory tracking with automatic shopping list management
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <div className="text-center">
                  <Badge variant="outline" className="mb-2">Step 1</Badge>
                  <h3 className="font-medium mb-1">Add Your Items</h3>
                  <p className="text-sm text-muted-foreground">
                    Set up inventory for diapers, formula, meats, frozen goods
                  </p>
                </div>

                <div className="text-center">
                  <Badge variant="outline" className="mb-2">Step 2</Badge>
                  <h3 className="font-medium mb-1">Use And Tap</h3>
                  <p className="text-sm text-muted-foreground">
                    Tap minus button when you take something. Tap plus when you restock.
                  </p>
                </div>

                <div className="text-center">
                  <Badge variant="outline" className="mb-2">Step 3</Badge>
                  <h3 className="font-medium mb-1">Shop Smart</h3>
                  <p className="text-sm text-muted-foreground">
                    Items automatically appear on your shopping list when running low.
                  </p>
                </div>
              </div>

              <div className="mt-8 text-center">
                <LoginArea className="mx-auto" />
              </div>

              <div className="mt-6 text-xs text-muted-foreground text-center opacity-75">
                Privacy-first design using Nostr protocol. Your data is yours alone.
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mb-4">
          <p className="text-sm text-muted-foreground">
            Made with ❤️ for busy parents
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
