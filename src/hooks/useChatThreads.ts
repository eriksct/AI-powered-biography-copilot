import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { ChatThread } from '@/types/biography';
import { useAuth } from '@/contexts/AuthContext';

export function useChatThreads(projectId: string) {
  return useQuery({
    queryKey: ['chat-threads', projectId],
    queryFn: async (): Promise<ChatThread[]> => {
      const { data, error } = await supabase
        .from('chat_threads')
        .select('*')
        .eq('project_id', projectId)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });
}

export function useCreateChatThread() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: { projectId: string; title?: string }) => {
      const { data, error } = await supabase
        .from('chat_threads')
        .insert({
          project_id: params.projectId,
          user_id: user!.id,
          title: params.title || 'Nouvelle discussion',
        })
        .select()
        .single();
      if (error) throw error;
      return data as ChatThread;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['chat-threads', variables.projectId] });
    },
  });
}
