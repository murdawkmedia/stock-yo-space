import { useNDK } from '@/contexts/NDKContext';

export function useLoginActions() {
  const { loginWithExtension, loginWithPrivateKey, loginWithNip46, logout } = useNDK();
  // We can use useLoggedInAccounts if we need compatible list management, but simpler is direct NDK usage for actions.
  // Actually, useLoggedInAccounts provides `setLogin` for some reason?
  // But LoginDialog calls these actions.

  return {
    // Login with a Nostr secret key
    async nsec(nsec: string): Promise<void> {
      try {
        await loginWithPrivateKey(nsec);
      } catch (e) {
        console.error("Login failed", e);
        throw e;
      }
    },
    // Login with a NIP-46 "bunker://" URI
    async bunker(uri: string): Promise<void> {
      try {
        await loginWithNip46(uri);
      } catch (e) {
        console.error("Bunker login failed", e);
        throw e;
      }
    },
    // Login with a NIP-07 browser extension
    async extension(): Promise<void> {
      await loginWithExtension();
    },
    // Log out the current user
    async logout(): Promise<void> {
      await logout();
    }
  };
}
