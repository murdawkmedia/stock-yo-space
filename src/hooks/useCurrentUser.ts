import { useLoggedInAccounts } from './useLoggedInAccounts';

export function useCurrentUser() {
  const { currentUser } = useLoggedInAccounts();

  // Compatibility mapping
  // The old hook returned { user: NUser, ...metadata }
  // Our new currentUser has { id, pubkey, metadata }

  return {
    user: currentUser,
    // If consumers destructured metadata directly from the hook return, we need to spread it
    ...(currentUser?.metadata || {}),
  };
}
