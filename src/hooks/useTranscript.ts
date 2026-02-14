import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { TranscriptSegment } from '@/types/biography';

export function useTranscript(recordingId: string | null) {
  return useQuery({
    queryKey: ['transcript', recordingId],
    queryFn: async (): Promise<TranscriptSegment[]> => {
      const { data, error } = await supabase
        .from('transcripts')
        .select('*')
        .eq('recording_id', recordingId!)
        .order('segment_index', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!recordingId,
  });
}

export function useTranscriptSearch(projectId: string, query: string) {
  return useQuery({
    queryKey: ['transcript-search', projectId, query],
    queryFn: async () => {
      if (!query.trim()) return [];

      const { data, error } = await supabase
        .from('transcripts')
        .select(`
          *,
          recordings!inner(id, name, project_id)
        `)
        .eq('recordings.project_id', projectId)
        .ilike('text', `%${query}%`)
        .order('segment_index', { ascending: true })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!projectId && query.trim().length >= 2,
  });
}
