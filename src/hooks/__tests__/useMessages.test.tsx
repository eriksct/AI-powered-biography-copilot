import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useMessages, useSendMessage } from '../useMessages';
import { mockSupabase, mockFromSequence, mockFromResponse } from '@/test/mocks/supabase';
import { createMockMessage, createTestQueryClient } from '@/test/test-utils';
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

describe('useMessages', () => {
  it('fetches messages for a chat thread', async () => {
    const messages = [
      createMockMessage({ role: 'user', content: 'Bonjour' }),
      createMockMessage({ id: 'msg-2', role: 'assistant', content: 'Bonjour! Comment puis-je aider?' }),
    ];
    mockFromResponse(messages);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useMessages('thread-1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(messages);
    expect(mockSupabase.from).toHaveBeenCalledWith('messages');
  });

  it('does not fetch when chatThreadId is null', () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useMessages(null), { wrapper });
    expect(result.current.isFetching).toBe(false);
  });
});

describe('useSendMessage', () => {
  it('sends a message and invokes AI edge function', async () => {
    // Mock the sequence of from() calls:
    // 1. Insert user message
    // 2. Update thread timestamp
    // 3. Get history
    // 4. Insert AI response
    // 5. Get thread (for title check) — messageCount will be history.length + 2
    const history = [
      { role: 'user', content: 'Bonjour' },
      { role: 'assistant', content: 'Bonjour!' },
      { role: 'user', content: 'Aide-moi' },
    ];
    mockFromSequence([
      { data: null },           // insert user message
      { data: null },           // update thread timestamp
      { data: history },        // get conversation history (3 msgs → count = 5 ≠ 2, skip title)
      { data: null },           // insert AI response
    ]);

    // Mock AI response
    mockSupabase.functions.invoke.mockResolvedValueOnce({
      data: { content: 'Voici mon aide.' },
      error: null,
    });

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useSendMessage(), { wrapper });

    const context = {
      transcriptions: [{ recordingName: 'Rec 1', text: 'Bonjour' }],
      documentText: 'Mon texte',
    };

    await result.current.mutateAsync({
      chatThreadId: 'thread-1',
      content: 'Aide-moi à écrire',
      interviewId: 'int-1',
      subjectName: 'Jean Dupont',
      interviewTheme: 'Enfance',
      interviewNumber: 1,
      interviewContext: context,
    });

    // Verify edge function was invoked with interviewContext
    expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('ai-chat', {
      body: {
        messages: history,
        subjectName: 'Jean Dupont',
        interviewId: 'int-1',
        interviewTheme: 'Enfance',
        interviewNumber: 1,
        interviewContext: context,
      },
    });

    // Verify cache invalidation
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['messages', 'thread-1'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['chat-threads', 'int-1'] });
  });

  it('sends without interviewContext when not provided', async () => {
    mockFromSequence([
      { data: null },           // insert user message
      { data: null },           // update thread timestamp
      { data: [] },             // get conversation history
      { data: null },           // insert AI response
      { data: { title: 'Nouvelle discussion' } }, // get thread title
      { data: null },           // update title
    ]);

    mockSupabase.functions.invoke.mockResolvedValueOnce({
      data: { content: 'Réponse' },
      error: null,
    });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useSendMessage(), { wrapper });

    await result.current.mutateAsync({
      chatThreadId: 'thread-1',
      content: 'Bonjour',
      interviewId: 'int-1',
    });

    // interviewContext should be undefined in the body
    expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('ai-chat', {
      body: {
        messages: [],
        subjectName: undefined,
        interviewId: 'int-1',
        interviewTheme: undefined,
        interviewNumber: undefined,
        interviewContext: undefined,
      },
    });
  });

  it('throws when AI edge function returns error', async () => {
    mockFromSequence([
      { data: null },       // insert user message
      { data: null },       // update thread timestamp
      { data: [] },         // get conversation history
    ]);

    mockSupabase.functions.invoke.mockResolvedValueOnce({
      data: null,
      error: { message: 'AI service unavailable' },
    });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useSendMessage(), { wrapper });

    await expect(
      result.current.mutateAsync({
        chatThreadId: 'thread-1',
        content: 'Hello',
        interviewId: 'int-1',
      })
    ).rejects.toEqual({ message: 'AI service unavailable' });
  });

  it('auto-generates title after first exchange (2 messages)', async () => {
    // When history is empty (0 msgs) + 2 new = 2 → triggers title generation
    mockFromSequence([
      { data: null },                                        // insert user message
      { data: null },                                        // update thread timestamp
      { data: [] },                                          // get history (empty → count = 2)
      { data: null },                                        // insert AI response
      { data: { title: 'Nouvelle discussion' } },            // get thread title
      { data: null },                                        // update title
    ]);

    mockSupabase.functions.invoke.mockResolvedValueOnce({
      data: { content: 'Response' },
      error: null,
    });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useSendMessage(), { wrapper });

    await result.current.mutateAsync({
      chatThreadId: 'thread-1',
      content: 'Raconte-moi ton enfance',
      interviewId: 'int-1',
    });

    // Title update should have been triggered
    // The from() call for chat_threads update should have happened
    expect(mockSupabase.from).toHaveBeenCalledWith('chat_threads');
  });
});
