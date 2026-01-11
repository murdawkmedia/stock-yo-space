import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useMemo, useRef } from 'react';
import NDK, { NDKRelaySet, NDKSigner, NDKUser, NDKNip07Signer, NDKPrivateKeySigner, NDKNip46Signer } from '@nostr-dev-kit/ndk';

interface NDKContextType {
  ndk: NDK | undefined;
  isLoading: boolean;
  activeUser: NDKUser | undefined;
  loginWithExtension: () => Promise<void>;
  loginWithPrivateKey: (key: string) => Promise<void>;
  loginWithNip46: (connectionString: string) => Promise<void>;
  logout: () => void;
}

const NDKContext = createContext<NDKContextType>({
  ndk: undefined,
  isLoading: true,
  activeUser: undefined,
  loginWithExtension: async () => { },
  loginWithPrivateKey: async () => { },
  loginWithNip46: async () => { },
  logout: () => { },
});

export const useNDK = () => useContext(NDKContext);

interface NDKProviderProps {
  children: ReactNode;
  relays: string[];
}

export function NDKProvider({ children, relays }: NDKProviderProps) {
  // Create NDK instance once and keep it stable
  const ndkInstance = useRef(new NDK({ explicitRelayUrls: relays })).current;
  const [ndk, setNdk] = useState<NDK>(ndkInstance); // State wrapper for context consumers
  const [isLoading, setIsLoading] = useState(true);
  const [activeUser, setActiveUser] = useState<NDKUser | undefined>(undefined);

  // Sync relays when prop changes, without destroying NDK instance
  useEffect(() => {
    const updateRelays = async () => {
      // Logic to update relays could go here, but NDK handles explicitRelayUrls mostly on init.
      // For now, we just ensure we connect.
      // If we really need dynamic relay updates without re-init, we'd use ndk.pool.addRelay/removeRelay
      // But re-connecting is safer than re-instantiating.

      try {
        await ndkInstance.connect();
      } catch (err) {
        console.error('Failed to connect to NDK relays:', err);
      } finally {
        setIsLoading(false);
      }
    };

    updateRelays();
  }, [ndkInstance]); // Only run once on mount (since ndkInstance is ref), or depend on relays if we implement dynamic sync.

  // Handle explicit login with a signer
  const loginWithSigner = useCallback(async (signer: NDKSigner) => {
    if (!ndk) return;

    // Assign signer to NDK
    ndk.signer = signer;

    // Get user from signer
    const user = await signer.user();
    if (user) {
      user.ndk = ndk; // Ensure user has access to NDK instance

      // Optimistically set active user so UI updates immediately
      setActiveUser(user);

      // Fetch profile in background
      user.fetchProfile().then(() => {
        // Force update if needed, but usually NDKUser internal state updates are enough
        // We might need to trigger a re-render if the profile wasn't there initially
        setActiveUser(new NDKUser({ pubkey: user.pubkey })); // Hack to force re-render with new profile? 
        // Better: let the components subscribe to the user object or just rely on the reference update if we clone it.
        // Actually, just setting it again with the same object might not trigger effect if using strict equality.
        // Let's just create a shallow copy or rely on the initial set being enough for "Log in" state.
        setActiveUser(Object.assign(new NDKUser({ pubkey: user.pubkey }), user));
      }).catch(e => {
        console.warn('Failed to fetch profile:', e);
      });
    }
  }, [ndk]);

  const loginWithExtension = useCallback(async () => {
    const signer = new NDKNip07Signer();
    await loginWithSigner(signer);
  }, [loginWithSigner]);

  const loginWithPrivateKey = useCallback(async (key: string) => {
    const signer = new NDKPrivateKeySigner(key);
    await loginWithSigner(signer);
  }, [loginWithSigner]);

  const loginWithNip46 = useCallback(async (connectionString: string) => {
    if (!ndk) return;
    const signer = new NDKNip46Signer(ndk, connectionString);
    await loginWithSigner(signer);
  }, [ndk, loginWithSigner]);

  const logout = useCallback(() => {
    if (ndk) {
      ndk.signer = undefined;
    }
    setActiveUser(undefined);
  }, [ndk]);

  const contextValue = useMemo(() => ({
    ndk,
    isLoading,
    activeUser,
    loginWithExtension,
    loginWithPrivateKey,
    loginWithNip46,
    logout
  }), [ndk, isLoading, activeUser, loginWithExtension, loginWithPrivateKey, loginWithNip46, logout]);

  return (
    <NDKContext.Provider value={contextValue}>
      {children}
    </NDKContext.Provider>
  );
}
