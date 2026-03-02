/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useProfile } from '../useProfile';
import { mockFromResponse } from '@/test/mocks/supabase';
import { createMockProfile, createTestQueryClient } from '@/test/test-utils';
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

describe('useProfile', () => {
  it('fetches user profile', async () => {
    const profile = createMockProfile();
    mockFromResponse(profile);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useProfile(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(profile);
  });

  it('fetches pro user profile', async () => {
    const profile = createMockProfile({
      plan: 'pro',
      max_projects: 50,
      max_transcription_seconds: 36000,
    });
    mockFromResponse(profile);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useProfile(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.plan).toBe('pro');
    expect(result.current.data?.max_projects).toBe(50);
  });

  it('handles fetch error', async () => {
    mockFromResponse(null, { message: 'Profile not found' });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useProfile(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
