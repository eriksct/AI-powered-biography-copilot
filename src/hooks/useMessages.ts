import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Message, Source } from '@/types/biography';
import { trackAIChatSent } from '@/lib/analytics';

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
    onMutate: async (params) => {
      await queryClient.cancelQueries({ queryKey: ['messages', params.chatThreadId] });

      const previous = queryClient.getQueryData<Message[]>(['messages', params.chatThreadId]);

      const optimisticMessage: Message = {
        id: `optimistic-${Date.now()}`,
        chat_thread_id: params.chatThreadId,
        role: 'user',
        content: params.content,
        created_at: new Date().toISOString(),
      };

      queryClient.setQueryData<Message[]>(
        ['messages', params.chatThreadId],
        (old) => [...(old || []), optimisticMessage],
      );

      return { previous };
    },
    onError: (_err, params, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['messages', params.chatThreadId], context.previous);
      }
    },
    mutationFn: async (params: {
      chatThreadId: string;
      content: string;
      interviewId: string;
      subjectName?: string;
      interviewTheme?: string;
      interviewNumber?: number;
      attachments?: File[];
      interviewContext?: {
        transcriptions: { recordingName: string; text: string }[];
        documentText: string;
      };
    }) => {
      let messageContent = params.content;

      // Upload attachments if present
      if (params.attachments && params.attachments.length > 0) {
        const attachmentUrls: string[] = [];

        for (const file of params.attachments) {
          const fileName = `${Date.now()}_${file.name}`;
          const filePath = `${params.chatThreadId}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('chat-attachments')
            .upload(filePath, file);

          if (uploadError) {
            console.error('Upload error:', uploadError);
            continue;
          }

          const { data: urlData } = supabase.storage
            .from('chat-attachments')
            .getPublicUrl(filePath);

          attachmentUrls.push(urlData.publicUrl);
        }

        if (attachmentUrls.length > 0) {
          messageContent += '\n\n[Pièces jointes: ' + params.attachments.map(f => f.name).join(', ') + ']';
        }
      }

      // Insert user message
      const { error: userError } = await supabase
        .from('messages')
        .insert({
          chat_thread_id: params.chatThreadId,
          role: 'user' as const,
          content: messageContent,
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
          interviewId: params.interviewId,
          interviewTheme: params.interviewTheme,
          interviewNumber: params.interviewNumber,
          interviewContext: params.interviewContext,
        },
      });

      if (aiError) throw aiError;

      // Serialize sources into content for storage
      let contentToStore = aiData.content;
      if (aiData.sources && aiData.sources.length > 0) {
        const sourcesBlock = aiData.sources
          .map((s: Source) => `[${s.index}] ${s.title} | ${s.url}`)
          .join('\n');
        contentToStore = `${aiData.content}\n\n---sources---\n${sourcesBlock}`;
      }

      // Insert AI response
      const { error: insertError } = await supabase
        .from('messages')
        .insert({
          chat_thread_id: params.chatThreadId,
          role: 'assistant' as const,
          content: contentToStore,
        });
      if (insertError) throw insertError;

      // Auto-generate title after 2 messages if still default title
      const messageCount = (history?.length || 0) + 2;
      if (messageCount === 2) {
        const { data: thread } = await supabase
          .from('chat_threads')
          .select('title')
          .eq('id', params.chatThreadId)
          .single();

        if (thread?.title === 'Nouvelle discussion') {
          const firstUserMessage = params.content.substring(0, 50).trim();
          const title = firstUserMessage.length >= 50
            ? firstUserMessage.substring(0, 47) + '...'
            : firstUserMessage;

          await supabase
            .from('chat_threads')
            .update({ title })
            .eq('id', params.chatThreadId);
        }
      }
    },
    onSuccess: (_, variables) => {
      trackAIChatSent(variables.interviewId, variables.content.length, !!(variables.attachments?.length));
      queryClient.invalidateQueries({ queryKey: ['messages', variables.chatThreadId] });
      queryClient.invalidateQueries({ queryKey: ['chat-threads', variables.interviewId] });
    },
  });
}
