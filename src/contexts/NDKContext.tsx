import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useMemo, useRef } from 'react';
import NDK, { NDKSigner, NDKUser, NDKNip07Signer, NDKPrivateKeySigner, NDKNip46Signer } from '@nostr-dev-kit/ndk';

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
  const [ndk, _setNdk] = useState<NDK>(ndkInstance); // State wrapper for context consumers
  const [isLoading, setIsLoading] = useState(true);
  const [activeUser, setActiveUser] = useState<NDKUser | undefined>(undefined);

  // Session persistence
  const [session, setSession] = useState<{ type: 'extension' | 'nsec' | 'nip46', payload?: string } | null>(() => {
    try {
      const saved = localStorage.getItem('nostr-session');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const saveSession = (sess: { type: 'extension' | 'nsec' | 'nip46', payload?: string } | null) => {
    setSession(sess);
    if (sess) {
      localStorage.setItem('nostr-session', JSON.stringify(sess));
    } else {
      localStorage.removeItem('nostr-session');
    }
  };

  // Sync relays when prop changes, without destroying NDK instance
  useEffect(() => {
    const updateRelays = async () => {
      try {
        console.log('🔌 NDK Connecting to relays:', relays);
        await ndkInstance.connect(2500); // 2.5s timeout
        console.log('✅ NDK Connected. Active pool size:', ndkInstance.pool.connectedRelays().length);

        // Log individual relay statuses
        ndkInstance.pool.relays.forEach(r => {
          console.debug(`Relay ${r.url}: Status ${r.status}, Connection: ${r.connectivity}`);
        });

      } catch (err) {
        console.warn('⚠️ NDK Connection timeout or partial failure:', err);
        // We still proceed, as some relays might be connected or we can work offline/later
      } finally {
        setIsLoading(false);
      }
    };

    updateRelays();
  }, [ndkInstance]);

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
        setActiveUser(Object.assign(new NDKUser({ pubkey: user.pubkey }), user));
      }).catch(e => {
        console.warn('Failed to fetch profile:', e);
      });
    }
  }, [ndk]);

  const loginWithExtension = useCallback(async () => {
    const signer = new NDKNip07Signer();
    await loginWithSigner(signer);
    saveSession({ type: 'extension' });
  }, [loginWithSigner]);

  const loginWithPrivateKey = useCallback(async (key: string) => {
    const signer = new NDKPrivateKeySigner(key);
    await loginWithSigner(signer);
    saveSession({ type: 'nsec', payload: key });
  }, [loginWithSigner]);

  const loginWithNip46 = useCallback(async (connectionString: string) => {
    if (!ndk) return;
    const signer = new NDKNip46Signer(ndk, connectionString);
    await loginWithSigner(signer);
    saveSession({ type: 'nip46', payload: connectionString });
  }, [ndk, loginWithSigner]);

  const logout = useCallback(() => {
    if (ndk) {
      ndk.signer = undefined;
    }
    setActiveUser(undefined);
    saveSession(null);
  }, [ndk]);

  // Auto-login on mount
  useEffect(() => {
    // If we have a session but no active user, we are restoring.
    // If no session, we aren't restoring, so we can stop loading (if not already handled by connection).
    if (!session && !activeUser) {
      if (!ndkInstance.pool.connectedRelays().length) {
        // wait for connection? or just let it be.
      }
      return;
    }

    if (activeUser) return; // Already logged in

    const restoreSession = async () => {
      // setIsLoading(true); // Should already be true initally
      try {
        console.log('🔄 Restoring session:', session?.type);
        if (session?.type === 'extension') {
          // ... existing logic ...
          setTimeout(async () => {
            const signer = new NDKNip07Signer();
            await loginWithSigner(signer);
          }, 500);
        } else if (session?.type === 'nsec' && session.payload) {
          const signer = new NDKPrivateKeySigner(session.payload);
          await loginWithSigner(signer);
        } else if (session?.type === 'nip46' && session.payload) {
          if (!ndk) return;
          const signer = new NDKNip46Signer(ndk, session.payload);
          await loginWithSigner(signer);
        }
      } catch (e) {
        console.error('Failed to restore session:', e);
        saveSession(null);
      } finally {
        // Only set loading to false AFTER restoration attempt
        // But we have a race with the relay connection loading state.
        // Let's rely on the separate `isLoading` state management or unify them.
        // For now, let's log completion.
        console.log('✅ Session restore attempt complete');
      }
    };

    restoreSession();
  }, [session, loginWithSigner, activeUser, ndk]);

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
