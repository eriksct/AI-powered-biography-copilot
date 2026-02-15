import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Project } from '@/types/biography';
import { useAuth } from '@/contexts/AuthContext';

export function useProjects() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['projects', user?.id],
    queryFn: async (): Promise<Project[]> => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: { title: string; subject_name?: string; description?: string }) => {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          user_id: user!.id,
          title: params.title,
          subject_name: params.subject_name || null,
          description: params.description || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data as Project;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { projectId: string; title: string }) => {
      const { data, error } = await supabase
        .from('projects')
        .update({ title: params.title, updated_at: new Date().toISOString() })
        .eq('id', params.projectId)
        .select()
        .single();
      if (error) throw error;
      return data as Project;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projectId: string) => {
      const { error } = await supabase.from('projects').delete().eq('id', projectId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}
