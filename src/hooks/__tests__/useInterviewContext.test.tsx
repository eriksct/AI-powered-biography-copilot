import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useInterviewContext } from '../useInterviewContext';
import { mockFromSequence } from '@/test/mocks/supabase';
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

describe('useInterviewContext', () => {
  it('fetches transcriptions and document text', async () => {
    // Sequence:
    // 1. recordings query → 2 completed recordings
    // 2. transcripts for recording 1
    // 3. transcripts for recording 2
    // 4. document query
    mockFromSequence([
      {
        data: [
          { id: 'rec-1', name: 'Enregistrement 1', transcription_status: 'completed' },
          { id: 'rec-2', name: 'Enregistrement 2', transcription_status: 'completed' },
        ],
      },
      {
        data: [
          { text: 'Bonjour,', speaker_label: 'S1', start_time: 0 },
          { text: 'je suis Jean.', speaker_label: 'S1', start_time: 2 },
        ],
      },
      {
        data: [
          { text: 'Deuxième enregistrement.', speaker_label: 'S1', start_time: 0 },
        ],
      },
      {
        data: {
          content: {
            type: 'doc',
            content: [
              { type: 'paragraph', content: [{ type: 'text', text: 'Texte rédigé.' }] },
            ],
          },
        },
      },
    ]);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useInterviewContext('int-1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data!.transcriptions).toHaveLength(2);
    expect(result.current.data!.transcriptions[0].recordingName).toBe('Enregistrement 1');
    expect(result.current.data!.transcriptions[0].text).toBe('Bonjour, je suis Jean.');
    expect(result.current.data!.transcriptions[1].text).toBe('Deuxième enregistrement.');
    expect(result.current.data!.documentText).toBe('Texte rédigé.');
  });

  it('returns empty transcriptions when no recordings are completed', async () => {
    mockFromSequence([
      { data: [] },   // no completed recordings
      { data: null },  // document query returns null
    ]);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useInterviewContext('int-1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data!.transcriptions).toHaveLength(0);
    expect(result.current.data!.documentText).toBe('');
  });

  it('returns empty document text when document has no content', async () => {
    mockFromSequence([
      { data: [] },          // no recordings
      { data: { content: null } },  // document with null content
    ]);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useInterviewContext('int-1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data!.documentText).toBe('');
  });

  it('does not fetch when interviewId is undefined', () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useInterviewContext(undefined), { wrapper });
    expect(result.current.isFetching).toBe(false);
  });

  it('does not fetch when interviewId is empty string', () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useInterviewContext(''), { wrapper });
    expect(result.current.isFetching).toBe(false);
  });

  it('skips recordings with empty transcript segments', async () => {
    mockFromSequence([
      {
        data: [
          { id: 'rec-1', name: 'Enregistrement 1', transcription_status: 'completed' },
        ],
      },
      { data: [] },   // no segments for this recording
      { data: null },  // document
    ]);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useInterviewContext('int-1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data!.transcriptions).toHaveLength(0);
  });
});
