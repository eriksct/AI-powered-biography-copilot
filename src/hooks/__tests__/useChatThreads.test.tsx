/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useChatThreads, useCreateChatThread } from '../useChatThreads';
import { mockSupabase, mockFromResponse } from '@/test/mocks/supabase';
import { createMockChatThread, createTestQueryClient } from '@/test/test-utils';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

// Mock useAuth
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-123', email: 'test@example.com' },
    session: { access_token: 'token' },
  }),
}));

function createWrapper() {
  const queryClient = createTestQueryClient();
  return {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
    queryClient,
  };
}

describe('useChatThreads', () => {
  it('fetches chat threads for a project', async () => {
    const threads = [
      createMockChatThread(),
      createMockChatThread({ id: 'thread-2', title: 'Discussion 2' }),
    ];
    mockFromResponse(threads);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useChatThreads('proj-1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(threads);
    expect(mockSupabase.from).toHaveBeenCalledWith('chat_threads');
  });

  it('does not fetch when projectId is empty', () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useChatThreads(''), { wrapper });
    expect(result.current.isFetching).toBe(false);
  });
});

describe('useCreateChatThread', () => {
  it('creates a thread with default title', async () => {
    const newThread = createMockChatThread({ id: 'thread-new' });
    mockFromResponse(newThread);

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useCreateChatThread(), { wrapper });

    await result.current.mutateAsync({ projectId: 'proj-1' });

    expect(mockSupabase.from).toHaveBeenCalledWith('chat_threads');
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['chat-threads', 'proj-1'] });
  });

  it('creates a thread with custom title', async () => {
    const newThread = createMockChatThread({ id: 'thread-new', title: 'Mon sujet' });
    mockFromResponse(newThread);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateChatThread(), { wrapper });

    const created = await result.current.mutateAsync({ projectId: 'proj-1', title: 'Mon sujet' });
    expect(created).toEqual(newThread);
  });
});
