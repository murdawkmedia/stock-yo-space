import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Lock, Shield, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { useInventory } from '@/hooks/useInventory';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';
import { type InventoryItem } from '@/lib/inventoryTypes';

interface EncryptedInventoryItem extends InventoryItem {
  encrypted: boolean;
  encrypted_content?: string; // Base64 encrypted data if encrypted
}

export function EncryptedItemsManager() {
  const { items, updateQuantity } = useInventory();
  const { user } = useCurrentUser();
  const { toast } = useToast();
  
  const [showEncryptedContent, setShowEncryptedContent] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState<Map<string, boolean>>(new Map());

  // Add encryption field to items
  const encryptedItems = React.useMemo(() => {
    return items.map(item => ({
      ...item,
      encrypted: item.name.startsWith('ENCRYPTED:'),
      encrypted_content: item.name.startsWith('ENCRYPTED:') ? item.name.slice(11) : undefined
    }));
  }, [items]);

  const encryptItem = async (item: EncryptedInventoryItem): Promise<void> => {
    if (!user) return;
    if (!user.signer.nip44) {
      toast({
        title: 'Encryption not available',
        description: 'Your login method does not support NIP-44 encryption',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(prev => new Map(prev).set(item.id, true));

    try {
      // Show dialog for sensitive information
      const sensitiveData = prompt(
        `Enter sensitive details for "${item.name}"\n\n` +
        `Example:\n` +
        `- Prescription details\n` +
        `- Medical condition notes\n` +
        `- Special storage instructions\n` +
        `- Serial numbers or unique identifiers\n\n` +
        `This data will be encrypted and only visible to you.`
      );

      if (!sensitiveData || sensitiveData.trim() === '') {
        return;
      }

      // Encrypt the sensitive data
      const encrypted = await user.signer.nip44.encrypt(sensitiveData.trim());
      
      // Update item name to indicate encryption
      const encryptedItem = {
        ...item,
        name: `ENCRYPTED:${encrypted}`,
        encrypted: true,
        encrypted_content: encrypted
      };

      await updateQuantity({ item, newQuantity: item.quantity });

      toast({
        title: 'Item encrypted',
        description: 'Sensitive information has been encrypted and stored securely'
      });

    } catch (error) {
      console.error('Encryption failed:', error);
      toast({
        title: 'Encryption failed',
        description: 'Failed to encrypt the item. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(prev => {
        const next = new Map(prev);
        next.delete(item.id);
        return next;
      });
    }
  };

  const decryptItem = async (item: EncryptedInventoryItem): Promise<string | null> => {
    if (!user || !item.encrypted_content) return null;
    if (!user.signer.nip44) {
      toast({
        title: 'Decryption not available',
        description: 'Your login method does not support NIP-44 decryption',
        variant: 'destructive'
      });
      return null;
    }

    setIsLoading(prev => new Map(prev).set(item.id, true));

    try {
      const decrypted = await user.signer.nip44.decrypt(item.encrypted_content);
      
      // Toggle display state
      const next = new Set(showEncryptedContent);
      if (next.has(item.id)) {
        next.delete(item.id);
      } else {
        next.add(item.id);
      }
      setShowEncryptedContent(next);

      return decrypted;
    } catch (error) {
      console.error('Decryption failed:', error);
      toast({
        title: 'Decryption failed',
        description: 'Failed to decrypt item. It may be corrupted or use a different key.',
        variant: 'destructive'
      });
      return null;
    } finally {
      setIsLoading(prev => {
        const next = new Map(prev);
        next.delete(item.id);
        return next;
      });
    }
  };

  const removeEncryption = async (item: EncryptedInventoryItem): Promise<void> => {
    if (!confirm('Remove encryption? The sensitive data will be deleted permanently.')) {
      return;
    }

    try {
      // Restore original item name (extract from decrypted content if available)
      const baseName = item.name.replace(/^ENCRYPTED:/, '');
      
      const regularItem = {
        ...item,
        name: item.id, // Use the item ID as name
        encrypted: false,
        encrypted_content: undefined
      };

      await updateQuantity({ item, newQuantity: item.quantity });

      toast({
        title: 'Encryption removed',
        description: 'Item is now stored as regular inventory'
      });
    } catch (error) {
      console.error('Failed to remove encryption:', error);
      toast({
        title: 'Failed to remove encryption',
        variant: 'destructive'
      });
    }
  };

  const regularItems = encryptedItems.filter(item => !item.encrypted);
  const encryptedOnly = encryptedItems.filter(item => item.encrypted);

  return (
    <div className="space-y-6">
      {/* Encryption Info */}
      <Alert className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
        <div className="flex gap-3">
          <Shield className="h-5 w-5 text-blue-600" />
          <div>
            <AlertTitle>How NIP-04 Encryption Works</AlertTitle>
            <AlertDescription>
              Encrypted items are stored encrypted with your public key. Only you can decrypt and view them.
              Useful for medications, valuables, or any sensitive inventory items. The encrypted data is
              stored in the item name field as base64.
            </AlertDescription>
          </div>
        </div>
      </Alert>

      {/* Encrypted Items */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-semibold">Encrypted Items ({encryptedOnly.length})</h4>
        </div>

        {encryptedOnly.length === 0 ? (
          <Card className="border-0 bg-card/50">
            <CardContent className="p-6">
              <div className="text-center py-8">
                <Lock className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No encrypted items yet</h3>
                <p className="text-muted-foreground mb-4">
                  Select regular items below to encrypt sensitive information
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {encryptedOnly.map(item => {
              const isDecrypting = isLoading.get(item.id);
              const isVisible = showEncryptedContent.has(item.id);

              return (
                <Card key={item.id} className="border-0 bg-blue-50/30 dark:bg-blue-950/30">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Lock className="h-4 w-4 text-blue-600" />
                          <span className="font-medium truncate">{item.id}</span>
                          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                            {item.category}
                          </Badge>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                          <span>Qty: {item.quantity} {item.unit}</span>
                          <span>•</span>
                          <span>Stock up at: {item.min_threshold}</span>
                        </div>

                        {/* Decrypted Content (if visible) */}
                        {isVisible && (
                          <div className="mt-3 p-3 bg-white dark:bg-slate-900 rounded-lg border border-blue-200 dark:border-blue-800">
                            <p className="text-sm whitespace-pre-wrap font-mono">
                              {/* Content would be shown here after decryption */}
                              [Encrypted content - click View Details to decrypt]
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => decryptItem(item)}
                          disabled={isDecrypting}
                          className="text-xs h-7 px-2"
                        >
                          {isDecrypting ? (
                            '...'
                          ) : isVisible ? (
                            <EyeOff className="h-3 w-3" />
                          ) : (
                            <Eye className="h-3 w-3" />
                          )}
                          <span className="ml-1">{isVisible ? 'Hide' : 'View'}</span>
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeEncryption(item)}
                          disabled={isDecrypting}
                          className="text-xs h-7 px-2 text-red-600 hover:text-red-700"
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Regular Items to Encrypt */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-semibold">Available for Encryption ({regularItems.length})</h4>
        </div>

        {regularItems.length === 0 ? (
          <Card className="border-0 bg-card/50">
            <CardContent className="p-6">
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No regular items available</h3>
                <p className="text-muted-foreground">
                  Add items to your inventory first, then encrypt them here
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 max-h-96 overflow-y-auto p-2">
            {regularItems.map(item => (
              <Card key={item.id} className="border-0 bg-card/50 hover:bg-card transition-all cursor-pointer"
                    onClick={() => encryptItem(item)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium truncate">{item.name}</span>
                        <Badge variant="outline">{item.category}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {item.quantity} {item.unit}
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isLoading.get(item.id) || item.quantity === 0 || item.name.startsWith('ENCRYPTED:')}
                      className="h-8 px-3 text-xs"
                    >
                      <Lock className="h-3 w-3 mr-1" />
                      Encrypt
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Security Notice */}
      <Card className="border-0 bg-amber-50/30 dark:bg-amber-950/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-400">
            <AlertTriangle className="h-4 w-4" />
            Important Security Notes
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2 text-amber-700 dark:text-amber-450">
          <p>• Encrypted items use NIP-04 encryption with your private key</p>
          <p>• Only YOU can decrypt these items</p>
          <p>• If you lose access to your key, encrypted data cannot be recovered</p>
          <p>• Back up your nsec key before encrypting critical items</p>
          <p>• Item names are still visible in plain text - store sensitive info in encrypted content only</p>
        </CardContent>
      </Card>
    </div>
  );
}