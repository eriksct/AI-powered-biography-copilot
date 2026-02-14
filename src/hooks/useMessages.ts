import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Message } from '@/types/biography';

export function useMessages(chatThreadId: string | null) {
  return useQuery({
    queryKey: ['messages', chatThreadId],
    queryFn: async (): Promise<Message[]> => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_thread_id', chatThreadId!)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!chatThreadId,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      chatThreadId: string;
      content: string;
      projectId: string;
      subjectName?: string;
    }) => {
      // Insert user message
      const { error: userError } = await supabase
        .from('messages')
        .insert({
          chat_thread_id: params.chatThreadId,
          role: 'user' as const,
          content: params.content,
        });
      if (userError) throw userError;

      // Update thread timestamp
      await supabase
        .from('chat_threads')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', params.chatThreadId);

      // Get conversation history for AI context
      const { data: history } = await supabase
        .from('messages')
        .select('role, content')
        .eq('chat_thread_id', params.chatThreadId)
        .order('created_at', { ascending: true })
        .limit(20);

      // Call AI edge function
      const { data: aiData, error: aiError } = await supabase.functions.invoke('ai-chat', {
        body: {
          messages: history || [],
          subjectName: params.subjectName,
          projectId: params.projectId,
        },
      });

      if (aiError) throw aiError;

      // Insert AI response
      const { error: insertError } = await supabase
        .from('messages')
        .insert({
          chat_thread_id: params.chatThreadId,
          role: 'assistant' as const,
          content: aiData.content,
        });
      if (insertError) throw insertError;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages', variables.chatThreadId] });
      queryClient.invalidateQueries({ queryKey: ['chat-threads', variables.projectId] });
    },
  });
}
