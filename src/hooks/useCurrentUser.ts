import { useLoggedInAccounts } from './useLoggedInAccounts';

export function useCurrentUser() {
  const { currentUser } = useLoggedInAccounts();

  // Compatibility mapping
  // The old hook returned { user: NUser, ...metadata }
  // Our new currentUser has { id, pubkey, metadata }

  return {
    user: currentUser,
    metadata: currentUser?.metadata,
    ...(currentUser?.metadata || {}),
  };
}
