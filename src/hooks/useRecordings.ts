import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Recording } from '@/types/biography';
import { useAuth } from '@/contexts/AuthContext';

export function useRecordings(projectId: string) {
  return useQuery({
    queryKey: ['recordings', projectId],
    queryFn: async (): Promise<Recording[]> => {
      const { data, error } = await supabase
        .from('recordings')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });
}

export function useCreateRecording() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: {
      projectId: string;
      name: string;
      audioBlob: Blob;
      durationSeconds: number;
    }) => {
      const { projectId, name, audioBlob, durationSeconds } = params;
      const fileExt = 'webm';
      const fileName = `${user!.id}/${projectId}/${crypto.randomUUID()}.${fileExt}`;

      // Upload audio to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('audio-recordings')
        .upload(fileName, audioBlob, {
          contentType: 'audio/webm',
          upsert: false,
        });
      if (uploadError) throw uploadError;

      // Create recording record
      // The database trigger will automatically start transcription
      const { data, error } = await supabase
        .from('recordings')
        .insert({
          project_id: projectId,
          user_id: user!.id,
          name,
          audio_path: fileName,
          duration_seconds: Math.round(durationSeconds),
          file_size_bytes: audioBlob.size,
          transcription_status: 'pending',
        })
        .select()
        .single();
      if (error) throw error;

      return data as Recording;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['recordings', variables.projectId] });
    },
  });
}

export function useDeleteRecording() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (recording: Recording) => {
      // Delete audio from storage
      await supabase.storage.from('audio-recordings').remove([recording.audio_path]);
      // Delete recording record (cascades to transcripts)
      const { error } = await supabase.from('recordings').delete().eq('id', recording.id);
      if (error) throw error;
    },
    onSuccess: (_, recording) => {
      queryClient.invalidateQueries({ queryKey: ['recordings', recording.project_id] });
    },
  });
}

export function useRecordingAudioUrl(audioPath: string | null) {
  return useQuery({
    queryKey: ['audio-url', audioPath],
    queryFn: async () => {
      if (!audioPath) return null;
      const { data, error } = await supabase.storage
        .from('audio-recordings')
        .createSignedUrl(audioPath, 3600);
      if (error) throw error;
      return data.signedUrl;
    },
    enabled: !!audioPath,
    staleTime: 1000 * 60 * 50,
  });
}
