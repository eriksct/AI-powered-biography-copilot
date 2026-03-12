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

export function useTranscriptSearch(interviewId: string, query: string) {
  return useQuery({
    queryKey: ['transcript-search', interviewId, query],
    queryFn: async () => {
      if (!query.trim()) return [];

      const { data, error } = await supabase
        .from('transcripts')
        .select(`
          *,
          recordings!inner(id, name, interview_id)
        `)
        .eq('recordings.interview_id', interviewId)
        .ilike('text', `%${query}%`)
        .order('segment_index', { ascending: true })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!interviewId && query.trim().length >= 2,
  });
}
