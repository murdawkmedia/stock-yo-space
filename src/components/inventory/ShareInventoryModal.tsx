import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useSharing } from '@/hooks/useSharing';
import { Share2, UserPlus, Trash2, Users, Copy, Check } from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';

interface ShareInventoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShareInventoryModal({ open, onOpenChange }: ShareInventoryModalProps) {
  const { user } = useCurrentUser();
  const {
    sharedUsers,
    sharedWithMe,
    addSharedUser,
    removeSharedUser,
    isAddingUser,
    isRemovingUser
  } = useSharing();

  const [npubInput, setNpubInput] = useState('');
  const [copied, setCopied] = useState(false);

  const handleAddUser = async () => {
    if (!npubInput.trim()) return;

    try {
      await addSharedUser(npubInput.trim());
      setNpubInput('');
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleCopyNpub = async () => {
    if (!user) return;

    // Convert user's hex pubkey to npub for sharing
    try {
      const { nip19 } = await import('nostr-tools');
      const npub = nip19.npubEncode(user.pubkey);
      await navigator.clipboard.writeText(npub);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy npub:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Inventory
          </DialogTitle>
          <DialogDescription>
            Share your inventory with family members or roommates. They'll see your items when they log in.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Your NPUB for others to use */}
          <div className="rounded-lg border bg-muted/50 p-4">
            <Label className="text-sm font-medium">Your Nostr ID (share this)</Label>
            <p className="text-xs text-muted-foreground mt-1 mb-2">
              Give this to others so they can share their inventory with you
            </p>
            <Button
              variant="outline"
              onClick={handleCopyNpub}
              className="w-full justify-between"
            >
              <span className="truncate text-xs font-mono">
                {user?.pubkey ? `npub1${user.pubkey.slice(0, 8)}...` : 'Loading...'}
              </span>
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Add new share */}
          <div className="space-y-2">
            <Label htmlFor="npub">Share with someone</Label>
            <div className="flex gap-2">
              <Input
                id="npub"
                placeholder="Enter npub1... or hex pubkey"
                value={npubInput}
                onChange={(e) => setNpubInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddUser()}
              />
              <Button
                onClick={handleAddUser}
                disabled={isAddingUser || !npubInput.trim()}
                size="icon"
              >
                <UserPlus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* People you're sharing with */}
          {sharedUsers.length > 0 && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                People who can see your inventory ({sharedUsers.length})
              </Label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {sharedUsers.map((share) => (
                  <div
                    key={share.pubkey}
                    className="flex items-center justify-between rounded-lg border px-3 py-2"
                  >
                    <span className="text-sm font-mono truncate">
                      {share.npub?.slice(0, 16)}...
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeSharedUser(share.pubkey)}
                      disabled={isRemovingUser}
                      className="h-8 w-8 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* People sharing with you */}
          {sharedWithMe.length > 0 && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Share2 className="h-4 w-4" />
                People sharing with you ({sharedWithMe.length})
              </Label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {sharedWithMe.map((share) => (
                  <div
                    key={share.pubkey}
                    className="flex items-center rounded-lg border bg-muted/30 px-3 py-2"
                  >
                    <span className="text-sm font-mono truncate">
                      {share.npub?.slice(0, 16)}...
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {sharedUsers.length === 0 && sharedWithMe.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-4">
              No shares yet. Add someone's npub above to share your inventory with them.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
