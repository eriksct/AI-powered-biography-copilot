/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useTranscript, useTranscriptSearch } from '../useTranscript';
import { mockFromResponse } from '@/test/mocks/supabase';
import { createMockTranscriptSegment, createTestQueryClient } from '@/test/test-utils';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

function createWrapper() {
  const queryClient = createTestQueryClient();
  return {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
    queryClient,
  };
}

describe('useTranscript', () => {
  it('fetches transcript segments for a recording', async () => {
    const segments = [
      createMockTranscriptSegment({ segment_index: 0, text: 'Segment 1' }),
      createMockTranscriptSegment({ id: 'seg-2', segment_index: 1, text: 'Segment 2' }),
    ];
    mockFromResponse(segments);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useTranscript('rec-1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(segments);
  });

  it('does not fetch when recordingId is null', () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useTranscript(null), { wrapper });
    expect(result.current.isFetching).toBe(false);
  });

  it('handles fetch error', async () => {
    mockFromResponse(null, { message: 'DB error' });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useTranscript('rec-1'), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useTranscriptSearch', () => {
  it('searches transcripts with join to recordings', async () => {
    const results = [
      {
        ...createMockTranscriptSegment({ text: 'Bonjour Jean' }),
        recordings: { id: 'rec-1', name: 'Entretien 1', interview_id: 'int-1' },
      },
    ];
    mockFromResponse(results);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useTranscriptSearch('int-1', 'Jean'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(results);
  });

  it('does not search when query is less than 2 chars', () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useTranscriptSearch('int-1', 'a'), { wrapper });
    expect(result.current.isFetching).toBe(false);
  });

  it('does not search when query is empty', () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useTranscriptSearch('int-1', ''), { wrapper });
    expect(result.current.isFetching).toBe(false);
  });

  it('does not search when interviewId is empty', () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useTranscriptSearch('', 'test'), { wrapper });
    expect(result.current.isFetching).toBe(false);
  });
});
