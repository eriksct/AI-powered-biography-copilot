import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { ChatThread } from '@/types/biography';
import { useAuth } from '@/contexts/AuthContext';

export function useChatThreads(interviewId: string) {
  return useQuery({
    queryKey: ['chat-threads', interviewId],
    queryFn: async (): Promise<ChatThread[]> => {
      const { data, error } = await supabase
        .from('chat_threads')
        .select('*')
        .eq('interview_id', interviewId)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!interviewId,
  });
}

export function useCreateChatThread() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: { interviewId: string; title?: string }) => {
      const { data, error } = await supabase
        .from('chat_threads')
        .insert({
          interview_id: params.interviewId,
          user_id: user!.id,
          title: params.title || 'Nouvelle discussion',
        })
        .select()
        .single();
      if (error) throw error;
      return data as ChatThread;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['chat-threads', variables.interviewId] });
    },
  });
}
