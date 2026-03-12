import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { extractTextFromTiptap } from '@/lib/tiptap-utils';

interface TranscriptionContext {
  recordingName: string;
  text: string;
}

export interface InterviewContext {
  transcriptions: TranscriptionContext[];
  documentText: string;
}

export function useInterviewContext(interviewId: string | undefined) {
  return useQuery({
    queryKey: ['interview-context', interviewId],
    queryFn: async (): Promise<InterviewContext> => {
      if (!interviewId) return { transcriptions: [], documentText: '' };

      // 1. Fetch completed recordings for this interview
      const { data: recordings } = await supabase
        .from('recordings')
        .select('id, name, transcription_status')
        .eq('interview_id', interviewId)
        .eq('transcription_status', 'completed')
        .order('created_at', { ascending: true });

      // 2. For each recording, fetch transcript segments
      const transcriptions: TranscriptionContext[] = [];
      for (const rec of recordings || []) {
        const { data: segments } = await supabase
          .from('transcripts')
          .select('text, speaker_label, start_time')
          .eq('recording_id', rec.id)
          .order('segment_index', { ascending: true });

        if (segments && segments.length > 0) {
          const text = segments.map(s => s.text).join(' ');
          transcriptions.push({ recordingName: rec.name, text });
        }
      }

      // 3. Fetch the interview document
      const { data: document } = await supabase
        .from('documents')
        .select('content')
        .eq('interview_id', interviewId)
        .maybeSingle();

      const documentText = document?.content
        ? extractTextFromTiptap(document.content)
        : '';

      return { transcriptions, documentText };
    },
    enabled: !!interviewId,
    staleTime: 5 * 60 * 1000, // 5 minutes — avoid unnecessary re-fetches
  });
}
