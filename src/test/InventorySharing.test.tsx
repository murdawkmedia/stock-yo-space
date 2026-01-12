
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useInventory } from '@/hooks/useInventory';
import { useSharing } from '@/hooks/useSharing';
import { useNDK } from '@/contexts/NDKContext';
import { useInventoryKey } from '@/hooks/useInventoryKey';
import { NDKKind } from '@nostr-dev-kit/ndk';

// Mock dependencies
vi.mock('@/hooks/useSharing');
vi.mock('@/contexts/NDKContext');
vi.mock('@/hooks/useInventoryKey');
const mockUseQuery = vi.fn();
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return {
    ...actual,
    useQuery: (...args: any[]) => mockUseQuery(...args),
    useMutation: vi.fn(() => ({ mutateAsync: vi.fn() })),
    useQueryClient: vi.fn(),
  };
});

describe('useInventory Sharing Logic', () => {
  const mockFetchEvents = vi.fn().mockResolvedValue(new Set()); // Return empty Set
  const mockNdk = {
    fetchEvents: mockFetchEvents,
  };
  const mockUser = { pubkey: 'user-a-pubkey' };

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mocks
    (useNDK as any).mockReturnValue({ ndk: mockNdk, activeUser: mockUser });
    (useInventoryKey as any).mockReturnValue({ keys: new Map(), myKey: null, sharedKey: null });

    // Default mock implementation
    mockUseQuery.mockImplementation(({ queryFn, enabled }: any) => {
      if (enabled !== false && typeof queryFn === 'function') {
        queryFn(); // Trigger the queryFn immediately
      }
      return { data: [], isLoading: false };
    });
  });

  it('should fetch items from ONLY active user if no shares exist', async () => {
    // Mock useSharing to return only self
    (useSharing as any).mockReturnValue({
      allAuthorPubkeys: ['user-a-pubkey']
    });

    renderHook(() => useInventory());

    await waitFor(() => {
      expect(mockFetchEvents).toHaveBeenCalledWith(expect.objectContaining({
        kinds: [35871], // INVENTORY_KIND
        authors: ['user-a-pubkey']
      }));
    });
  });

  it('should fetch items from BOTH self and shared users', async () => {
    // Mock useSharing to return self AND User B
    const startList = ['user-a-pubkey', 'user-b-pubkey'];
    (useSharing as any).mockReturnValue({
      allAuthorPubkeys: startList
    });

    renderHook(() => useInventory());

    await waitFor(() => {
      expect(mockFetchEvents).toHaveBeenCalledWith(expect.objectContaining({
        kinds: [35871],
        authors: startList
      }));
    });
  });

  it('should NOT fetch User B items if they are not in the sharing list (Isolation Check)', async () => {
    // Mock useSharing to return ONLY self (User B removed)
    (useSharing as any).mockReturnValue({
      allAuthorPubkeys: ['user-a-pubkey']
    });

    renderHook(() => useInventory());

    await waitFor(() => {
      expect(mockFetchEvents).toHaveBeenCalledWith(expect.objectContaining({
        authors: ['user-a-pubkey']
      }));

      const calledArgs = mockFetchEvents.mock.calls[0][0];
      expect(calledArgs.authors).not.toContain('user-b-pubkey');
    });
  });
});
