import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Interview } from '@/types/biography';
import { useAuth } from '@/contexts/AuthContext';
import { trackInterviewCreated, trackInterviewDeleted } from '@/lib/analytics';

export function useInterviews(projectId: string) {
  return useQuery({
    queryKey: ['interviews', projectId],
    queryFn: async (): Promise<Interview[]> => {
      const { data, error } = await supabase
        .from('interviews')
        .select('*')
        .eq('project_id', projectId)
        .order('number', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });
}

export function useInterview(interviewId: string | null) {
  return useQuery({
    queryKey: ['interview', interviewId],
    queryFn: async (): Promise<Interview> => {
      const { data, error } = await supabase
        .from('interviews')
        .select('*')
        .eq('id', interviewId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!interviewId,
  });
}

export function useCreateInterview() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: {
      projectId: string;
      theme: string;
      interviewDate?: string;
    }) => {
      // Get the next number
      const { data: existing, error: countError } = await supabase
        .from('interviews')
        .select('number')
        .eq('project_id', params.projectId)
        .order('number', { ascending: false })
        .limit(1);
      if (countError) throw countError;

      const nextNumber = (existing && existing.length > 0) ? existing[0].number + 1 : 1;

      const { data, error } = await supabase
        .from('interviews')
        .insert({
          project_id: params.projectId,
          user_id: user!.id,
          number: nextNumber,
          theme: params.theme,
          interview_date: params.interviewDate || new Date().toISOString().split('T')[0],
        })
        .select()
        .single();
      if (error) throw error;
      return data as Interview;
    },
    onSuccess: (data, variables) => {
      trackInterviewCreated(variables.projectId, data.id, data.number);
      queryClient.invalidateQueries({ queryKey: ['interviews', variables.projectId] });
    },
  });
}

export function useUpdateInterview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      interviewId: string;
      theme?: string;
      interviewDate?: string;
    }) => {
      const updates: Record<string, unknown> = {};
      if (params.theme !== undefined) updates.theme = params.theme;
      if (params.interviewDate !== undefined) updates.interview_date = params.interviewDate;

      const { data, error } = await supabase
        .from('interviews')
        .update(updates)
        .eq('id', params.interviewId)
        .select()
        .single();
      if (error) throw error;
      return data as Interview;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['interviews', data.project_id] });
      queryClient.invalidateQueries({ queryKey: ['interview', data.id] });
    },
  });
}

export function useDeleteInterview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (interview: Interview) => {
      const { error } = await supabase
        .from('interviews')
        .delete()
        .eq('id', interview.id);
      if (error) throw error;
      return interview;
    },
    onSuccess: (interview) => {
      trackInterviewDeleted(interview.project_id, interview.id);
      queryClient.invalidateQueries({ queryKey: ['interviews', interview.project_id] });
    },
  });
}
