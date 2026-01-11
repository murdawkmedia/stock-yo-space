import { useNDK } from '@/contexts/NDKContext';
import { NDKUser } from '@nostr-dev-kit/ndk';

// Keeping the interface compatible with consumers if possible, 
// or simplifying it if consumers are easily updated.
export interface Account {
  id: string; // pubkey
  pubkey: string;
  metadata: Record<string, any>;
  signer?: any; // NDKSigner or similar, strictly NDKSigner but consumers might expect other.
  // We'll pass ndk.signer here

  // event?: NostrEvent; // Removed raw event dependency for now
}

export function useLoggedInAccounts() {
  const { activeUser, loginWithExtension, loginWithPrivateKey, logout } = useNDK();

  // Compat for LoginDialog
  // LoginDialog sends: { type: 'nsec' | 'extension' | 'bunker', sk?: string, uri?: string }
  const setLogin = async (login: any) => {
    try {
      if (login.type === 'extension') {
        await loginWithExtension();
      } else if (login.type === 'nsec' && login.sk) {
        await loginWithPrivateKey(login.sk);
      } else {
        console.error('Unsupported NDK login type:', login.type);
      }
    } catch (e) {
      console.error('Login failed:', e);
      throw e;
    }
  };

  const removeLogin = () => {
    logout();
  };

  // Convert NDKUser to "Account" shape
  let currentUser: Account | undefined = undefined;
  if (activeUser) {
    currentUser = {
      id: activeUser.pubkey,
      pubkey: activeUser.pubkey,
      metadata: activeUser.profile || {},
      signer: activeUser.ndk?.signer
    };
    // Trigger profile fetch if empty? NDKContext does this nicely.
  }

  return {
    authors: currentUser ? [currentUser] : [],
    currentUser,
    otherUsers: [] as Account[],
    setLogin,
    removeLogin,
  };
}