import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Document } from '@/types/biography';
import { useAuth } from '@/contexts/AuthContext';
import { useRef, useCallback } from 'react';

export function useDocument(interviewId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['document', interviewId],
    queryFn: async (): Promise<Document | null> => {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('interview_id', interviewId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;

      // Auto-create document if none exists
      if (!data && user) {
        const { data: newDoc, error: createError } = await supabase
          .from('documents')
          .insert({
            interview_id: interviewId,
            user_id: user.id,
            title: 'Sans titre',
            content: {},
          })
          .select()
          .single();
        if (createError) throw createError;
        return newDoc;
      }

      return data;
    },
    enabled: !!interviewId && !!user,
  });
}

export function useSaveDocument(interviewId?: string) {
  const queryClient = useQueryClient();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mutation = useMutation({
    mutationFn: async (params: { documentId: string; content: any }) => {
      const { error } = await supabase
        .from('documents')
        .update({ content: params.content })
        .eq('id', params.documentId);
      if (error) throw error;
    },
    onSuccess: () => {
      if (interviewId) {
        queryClient.invalidateQueries({ queryKey: ['interview-context', interviewId] });
      }
    },
  });

  const debouncedSave = useCallback(
    (documentId: string, content: any) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        mutation.mutate({ documentId, content });
      }, 2000);
    },
    [mutation]
  );

  return { save: debouncedSave, isSaving: mutation.isPending };
}
