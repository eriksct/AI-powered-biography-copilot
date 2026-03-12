/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useProjectSearch } from '../useProjectSearch';
import { mockSupabase, mockFromSequence } from '@/test/mocks/supabase';
import { createTestQueryClient } from '@/test/test-utils';
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

describe('useProjectSearch', () => {
  it('searches transcripts across all interviews', async () => {
    const transcriptResults = [
      {
        id: 'seg-1',
        text: 'Jean est né en 1950',
        start_time: 30,
        recordings: {
          id: 'rec-1',
          name: 'Enregistrement 1',
          interviews: {
            id: 'int-1',
            number: 1,
            theme: 'Enfance',
            project_id: 'proj-1',
          },
        },
      },
    ];

    // First from() call: transcripts search
    // Second from() call: interviews fetch
    mockFromSequence([
      { data: transcriptResults },
      { data: [] }, // no interviews for document search
    ]);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useProjectSearch('proj-1', 'Jean'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data![0].type).toBe('transcript');
    expect(result.current.data![0].interviewNumber).toBe(1);
    expect(result.current.data![0].recordingName).toBe('Enregistrement 1');
  });

  it('does not search when query is less than 2 chars', () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useProjectSearch('proj-1', 'a'), { wrapper });
    expect(result.current.isFetching).toBe(false);
  });

  it('does not search when query is empty', () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useProjectSearch('proj-1', ''), { wrapper });
    expect(result.current.isFetching).toBe(false);
  });

  it('does not search when projectId is empty', () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useProjectSearch('', 'test'), { wrapper });
    expect(result.current.isFetching).toBe(false);
  });

  it('returns empty array for empty query', async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useProjectSearch('proj-1', '  '), { wrapper });
    expect(result.current.isFetching).toBe(false);
  });
});
