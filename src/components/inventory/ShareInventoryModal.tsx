import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useSharing } from '@/hooks/useSharing';
import { useAuthor } from '@/hooks/useAuthor';
import { Share2, UserPlus, Trash2, Users, Copy, Check } from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';

interface ShareInventoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface UserShareRowProps {
  pubkey: string;
  onRemove?: (pubkey: string) => void;
  isRemoving?: boolean;
  canRemove?: boolean;
}

function UserShareRow({ pubkey, onRemove, isRemoving, canRemove }: UserShareRowProps) {
  const author = useAuthor(pubkey);
  const metadata = author.data?.metadata;
  const isLoading = author.isLoading;
  const displayName = metadata?.name || `${pubkey.slice(0, 8)}...${pubkey.slice(-4)}`;
  const shortPubkey = `${pubkey.slice(0, 8)}...${pubkey.slice(-4)}`;

  return (
    <div className="flex items-center justify-between rounded-lg border px-3 py-2">
      <div className="flex items-center gap-3">
        {isLoading ? (
          <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
        ) : (
          <Avatar className="h-8 w-8">
            <AvatarImage src={metadata?.picture} alt={displayName} />
            <AvatarFallback>{displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
        )}
        <div className="flex flex-col">
          {isLoading ? (
            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
          ) : (
            <>
              <span className="text-sm font-medium">{displayName}</span>
              {metadata?.name && (
                <span className="text-xs text-muted-foreground">{shortPubkey}</span>
              )}
            </>
          )}
        </div>
      </div>
      {canRemove && onRemove && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onRemove(pubkey)}
          disabled={isRemoving}
          className="h-8 w-8 text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
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

  const handleAddUser = async (e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();
    if (!npubInput.trim()) return;

    console.log('Adding shared user:', npubInput);

    try {
      await addSharedUser(npubInput.trim());
      setNpubInput('');
    } catch (error) {
      // Error handled by mutation
      console.error('Share failed:', error);
    }
  };

  const handleCopyNpub = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) return;
    // ... logic
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
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                handleAddUser(e as unknown as React.MouseEvent);
              }}
            >
              <Input
                id="npub"
                placeholder="Enter npub1... or hex pubkey"
                value={npubInput}
                onChange={(e) => setNpubInput(e.target.value)}
              // Removed onKeyDown, rely on form submission
              />
              <Button
                type="submit"
                disabled={isAddingUser || !npubInput.trim()}
                size="icon"
              >
                <UserPlus className="h-4 w-4" />
              </Button>
            </form>
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
                  <UserShareRow
                    key={share.pubkey}
                    pubkey={share.pubkey}
                    onRemove={removeSharedUser}
                    isRemoving={isRemovingUser}
                    canRemove
                  />
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
                  <UserShareRow key={share.pubkey} pubkey={share.pubkey} />
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
    </Dialog >
  );
}
