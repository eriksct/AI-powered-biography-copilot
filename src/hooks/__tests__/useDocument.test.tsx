/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useDocument, useSaveDocument } from '../useDocument';
import { mockSupabase, mockFromResponse, mockFromSequence } from '@/test/mocks/supabase';
import { createMockDocument, createTestQueryClient } from '@/test/test-utils';
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

describe('useDocument', () => {
  it('fetches existing document for a project', async () => {
    const doc = createMockDocument();
    mockFromResponse(doc);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useDocument('proj-1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(doc);
    expect(mockSupabase.from).toHaveBeenCalledWith('documents');
  });

  it('auto-creates document when none exists', async () => {
    const newDoc = createMockDocument({ id: 'doc-new' });
    // First call returns null (no document), second returns the newly created doc
    mockFromSequence([
      { data: null },    // maybeSingle returns null → auto-create
      { data: newDoc },  // insert + select + single returns the new doc
    ]);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useDocument('proj-1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(newDoc);
  });

  it('does not fetch when projectId is empty', () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useDocument(''), { wrapper });
    expect(result.current.isFetching).toBe(false);
  });

  it('handles fetch error', async () => {
    mockFromResponse(null, { message: 'DB error' });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useDocument('proj-1'), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useSaveDocument', () => {
  it('debounces save calls', async () => {
    vi.useFakeTimers();
    mockFromResponse(null);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useSaveDocument(), { wrapper });

    act(() => {
      result.current.save('doc-1', { type: 'doc', content: [{ type: 'paragraph' }] });
    });

    // Before debounce fires
    expect(mockSupabase.from).not.toHaveBeenCalledWith('documents');

    // Fast-forward past debounce
    await act(async () => {
      vi.advanceTimersByTime(2100);
    });

    expect(mockSupabase.from).toHaveBeenCalledWith('documents');

    vi.useRealTimers();
  });

  it('cancels previous debounce when called again', async () => {
    vi.useFakeTimers();
    mockFromResponse(null);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useSaveDocument(), { wrapper });

    act(() => {
      result.current.save('doc-1', { content: 'first' });
    });

    // Call again before debounce fires
    act(() => {
      vi.advanceTimersByTime(1000);
      result.current.save('doc-1', { content: 'second' });
    });

    // Wait full debounce from second call
    await act(async () => {
      vi.advanceTimersByTime(2100);
    });

    // Should have been called only once (second call replaced first)
    const documentsCalls = (mockSupabase.from as any).mock.calls.filter(
      (call: any[]) => call[0] === 'documents'
    );
    expect(documentsCalls.length).toBe(1);

    vi.useRealTimers();
  });
});
