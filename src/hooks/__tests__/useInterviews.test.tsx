/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useInterviews, useInterview, useCreateInterview, useUpdateInterview, useDeleteInterview } from '../useInterviews';
import { mockSupabase, mockFromResponse, mockFromSequence } from '@/test/mocks/supabase';
import { createMockInterview, createTestQueryClient } from '@/test/test-utils';
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

describe('useInterviews', () => {
  it('fetches interviews for a project ordered by number ASC', async () => {
    const interviews = [
      createMockInterview({ number: 1 }),
      createMockInterview({ id: 'int-2', number: 2, theme: 'Carrière' }),
    ];
    mockFromResponse(interviews);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useInterviews('proj-1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(interviews);
    expect(mockSupabase.from).toHaveBeenCalledWith('interviews');
  });

  it('does not fetch when projectId is empty', () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useInterviews(''), { wrapper });
    expect(result.current.isFetching).toBe(false);
  });

  it('handles fetch error', async () => {
    mockFromResponse(null, { message: 'DB error' });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useInterviews('proj-1'), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useInterview', () => {
  it('fetches a single interview by id', async () => {
    const interview = createMockInterview();
    mockFromResponse(interview);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useInterview('int-1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(interview);
  });

  it('does not fetch when interviewId is null', () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useInterview(null), { wrapper });
    expect(result.current.isFetching).toBe(false);
  });
});

describe('useCreateInterview', () => {
  it('creates an interview with auto-incremented number', async () => {
    const newInterview = createMockInterview({ id: 'int-new', number: 3 });
    // First call: get existing interviews to determine next number
    // Second call: insert new interview
    mockFromSequence([
      { data: [{ number: 2 }] },  // existing interviews (max number = 2)
      { data: newInterview },       // insert result
    ]);

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useCreateInterview(), { wrapper });

    const created = await result.current.mutateAsync({
      projectId: 'proj-1',
      theme: 'Vie professionnelle',
      interviewDate: '2025-03-01',
    });

    expect(created).toEqual(newInterview);
    expect(mockSupabase.from).toHaveBeenCalledWith('interviews');
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['interviews', 'proj-1'] });
  });

  it('starts at number 1 when no interviews exist', async () => {
    const newInterview = createMockInterview({ id: 'int-first', number: 1 });
    mockFromSequence([
      { data: [] },           // no existing interviews
      { data: newInterview },  // insert result
    ]);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateInterview(), { wrapper });

    const created = await result.current.mutateAsync({
      projectId: 'proj-1',
      theme: 'Enfance',
    });

    expect(created).toEqual(newInterview);
  });
});

describe('useUpdateInterview', () => {
  it('updates theme and date', async () => {
    const updated = createMockInterview({ theme: 'Nouveau thème' });
    mockFromResponse(updated);

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useUpdateInterview(), { wrapper });

    const returned = await result.current.mutateAsync({
      interviewId: 'int-1',
      theme: 'Nouveau thème',
      interviewDate: '2025-06-15',
    });

    expect(returned).toEqual(updated);
    expect(mockSupabase.from).toHaveBeenCalledWith('interviews');
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['interviews', 'proj-1'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['interview', 'int-1'] });
  });
});

describe('useDeleteInterview', () => {
  it('deletes an interview and invalidates cache', async () => {
    mockFromResponse(null);

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useDeleteInterview(), { wrapper });

    const interview = createMockInterview();
    await result.current.mutateAsync(interview);

    expect(mockSupabase.from).toHaveBeenCalledWith('interviews');
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['interviews', 'proj-1'] });
  });
});
