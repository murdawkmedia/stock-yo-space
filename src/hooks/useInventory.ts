import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNDK } from '@/contexts/NDKContext';
import { useInventoryKey } from './useInventoryKey';
import { InventoryItem } from '@/lib/inventoryTypes';
import { NDKEvent, NDKKind } from '@nostr-dev-kit/ndk';
import { v4 as uuidv4 } from 'uuid';
import { encryptInventoryData, decryptInventoryData } from '@/lib/encryption';
import { useCallback } from 'react';

const INVENTORY_KIND = 35871 as NDKKind;

import { useSharing } from './useSharing';

export function useInventory() {
  const { ndk, activeUser } = useNDK();
  const { keys, myKey } = useInventoryKey();
  const queryClient = useQueryClient();
  const { allAuthorPubkeys } = useSharing();

  const { data: items = [], isLoading: loading } = useQuery({
    queryKey: ['inventory', activeUser?.pubkey, keys.size],
    queryFn: async () => {
      if (!ndk || !activeUser) return [];

      const events = await ndk.fetchEvents({
        kinds: [INVENTORY_KIND],
        authors: allAuthorPubkeys,
        limit: 200
      });

      const loadedItems: InventoryItem[] = [];
      for (const event of events) {
        try {
          const item = await eventToInventoryItem(event, keys);
          if (item) loadedItems.push(item);
        } catch (e) {
          console.warn('Failed to parse item:', e);
        }
      }
      return loadedItems;
    },
    enabled: !!ndk && !!activeUser
  });

  const publishItem = async (item: InventoryItem) => {
    if (!ndk || !activeUser) throw new Error('Not logged in');

    const event = new NDKEvent(ndk);
    event.kind = INVENTORY_KIND;
    event.created_at = Math.floor(Date.now() / 1000);

    const contentObj = { ...item };
    // Clean up fields that might be redundant if we want

    const dTag = item.id;

    if (myKey) {
      const encrypted = await encryptInventoryData(JSON.stringify(contentObj), myKey);
      event.content = encrypted;
      event.tags = [['d', dTag], ['s', 'encrypted']];
    } else {
      event.content = JSON.stringify(contentObj);
      event.tags = [['d', dTag]];
    }

    await event.publish();
    return item;
  };

  const addItem = useMutation({
    mutationFn: async (item: Omit<InventoryItem, 'id' | 'lastUpdated' | 'updatedBy' | 'created_at'>) => {
      const uuid = uuidv4();
      const newItem: InventoryItem = {
        ...item,
        id: uuid,
        created_at: Math.floor(Date.now() / 1000),
        author_pubkey: activeUser!.pubkey
      };
      return publishItem(newItem);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['inventory'] })
  });

  const updateItem = useMutation({
    mutationFn: async (item: InventoryItem) => publishItem(item),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['inventory'] })
  });

  const deleteItem = useMutation({
    mutationFn: async (itemId: string) => {
      if (!ndk || !activeUser) throw new Error('Not logged in');
      const event = await ndk.fetchEvent({
        kinds: [INVENTORY_KIND],
        '#d': [itemId],
        authors: [activeUser.pubkey]
      });
      if (event) await event.delete();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['inventory'] })
  });

  // Helpers
  const updateQuantity = useMutation({
    mutationFn: async ({ item, newQuantity }: { item: InventoryItem, newQuantity: number }) => {
      let on_shopping_list = item.on_shopping_list;
      if (newQuantity <= item.min_threshold) {
        on_shopping_list = true;
      }
      const updated = { ...item, quantity: newQuantity, on_shopping_list };
      return publishItem(updated);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['inventory'] })
  });

  const updateShoppingList = useMutation({
    mutationFn: async ({ item, onShoppingList, purchased }: { item: InventoryItem, onShoppingList: boolean, purchased?: number }) => {
      const updated = {
        ...item,
        on_shopping_list: onShoppingList,
        quantity: purchased !== undefined ? purchased : item.quantity
      };
      return publishItem(updated);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['inventory'] })
  });

  const getItemsByCategory = useCallback((category: string) => {
    return items.filter(item => item.category === category);
  }, [items]);

  const shoppingListItems = items.filter(item => item.on_shopping_list);
  const lowStockItems = items.filter(i => i.quantity <= i.min_threshold && !i.on_shopping_list);

  return {
    items,
    shoppingListItems,
    lowStockItems,
    loading,
    addItem: addItem.mutateAsync,
    updateItem: updateItem.mutateAsync,
    deleteItem: deleteItem.mutateAsync,
    updateQuantity: updateQuantity.mutateAsync,
    updateShoppingList: updateShoppingList.mutateAsync,
    getItemsByCategory
  };
}

async function eventToInventoryItem(event: NDKEvent, keys: Map<string, Uint8Array>): Promise<InventoryItem | null> {
  try {
    let content = event.content;
    let parsed;
    if (content.startsWith('ivt1-')) {
      const key = keys.get(event.pubkey);
      if (!key) return null; // Can't decrypt

      const decrypted = await decryptInventoryData(content, key);
      if (!decrypted) return null;
      parsed = JSON.parse(decrypted);
    } else {
      try {
        parsed = JSON.parse(content);
      } catch { return null; }
    }
    return { ...parsed, id: getDTag(event) || parsed.id };
  } catch {
    return null;
  }
}

function getDTag(event: NDKEvent): string | undefined {
  return event.tags.find(t => t[0] === 'd')?.[1];
}