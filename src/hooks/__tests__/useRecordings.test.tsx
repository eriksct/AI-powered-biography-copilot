/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useRecordings, useCreateRecording, useDeleteRecording, useRecordingAudioUrl } from '../useRecordings';
import { mockSupabase, mockFromResponse, mockStorageBucket } from '@/test/mocks/supabase';
import { createMockRecording, createTestQueryClient, renderWithProviders } from '@/test/test-utils';
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

describe('useRecordings', () => {
  it('fetches recordings for a project', async () => {
    const recordings = [createMockRecording(), createMockRecording({ id: 'rec-2', name: 'Entretien 2' })];
    mockFromResponse(recordings);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useRecordings('proj-1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(recordings);
    expect(mockSupabase.from).toHaveBeenCalledWith('recordings');
  });

  it('does not fetch when projectId is empty', () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useRecordings(''), { wrapper });
    expect(result.current.isFetching).toBe(false);
  });

  it('handles fetch error', async () => {
    mockFromResponse(null, { message: 'DB error' });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useRecordings('proj-1'), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useCreateRecording', () => {
  it('uploads audio and creates recording record', async () => {
    const newRecording = createMockRecording({ id: 'rec-new' });
    mockFromResponse(newRecording);

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateRecording(), { wrapper });

    const audioBlob = new Blob(['test-audio'], { type: 'audio/webm' });
    await result.current.mutateAsync({
      projectId: 'proj-1',
      name: 'Test Recording',
      audioBlob,
      durationSeconds: 60,
    });

    // Verify storage upload was called
    expect(mockSupabase.storage.from).toHaveBeenCalledWith('audio-recordings');
    expect(mockStorageBucket.upload).toHaveBeenCalled();

    // Verify DB insert
    expect(mockSupabase.from).toHaveBeenCalledWith('recordings');

    // Verify cache invalidation
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['recordings', 'proj-1'] });
  });

  it('throws when storage upload fails', async () => {
    mockStorageBucket.upload.mockResolvedValueOnce({ data: null, error: { message: 'Upload failed' } });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateRecording(), { wrapper });

    const audioBlob = new Blob(['test-audio'], { type: 'audio/webm' });
    await expect(
      result.current.mutateAsync({
        projectId: 'proj-1',
        name: 'Test Recording',
        audioBlob,
        durationSeconds: 60,
      })
    ).rejects.toEqual({ message: 'Upload failed' });
  });
});

describe('useDeleteRecording', () => {
  it('deletes storage file and DB record', async () => {
    mockFromResponse(null);

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useDeleteRecording(), { wrapper });

    const recording = createMockRecording();
    await result.current.mutateAsync(recording);

    expect(mockSupabase.storage.from).toHaveBeenCalledWith('audio-recordings');
    expect(mockStorageBucket.remove).toHaveBeenCalledWith([recording.audio_path]);
    expect(mockSupabase.from).toHaveBeenCalledWith('recordings');
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['recordings', 'proj-1'] });
  });
});

describe('useRecordingAudioUrl', () => {
  it('fetches signed URL for audio path', async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useRecordingAudioUrl('user-123/proj-1/audio.webm'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBe('https://example.com/signed-url');
    expect(mockSupabase.storage.from).toHaveBeenCalledWith('audio-recordings');
  });

  it('does not fetch when audioPath is null', () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useRecordingAudioUrl(null), { wrapper });
    expect(result.current.isFetching).toBe(false);
  });
});
