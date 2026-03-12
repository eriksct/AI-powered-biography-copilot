import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface ProjectSearchResult {
  id: string;
  type: 'transcript' | 'document';
  text: string;
  interviewNumber: number;
  interviewTheme: string;
  interviewId: string;
  recordingName?: string;
  recordingId?: string;
  startTime?: number;
}

export function useProjectSearch(projectId: string, query: string) {
  return useQuery({
    queryKey: ['project-search', projectId, query],
    queryFn: async (): Promise<ProjectSearchResult[]> => {
      if (!query.trim()) return [];

      const results: ProjectSearchResult[] = [];

      // Search in transcripts across all interviews
      const { data: transcriptResults, error: tError } = await supabase
        .from('transcripts')
        .select(`
          id, text, start_time,
          recordings!inner(id, name, interview_id,
            interviews!inner(id, number, theme, project_id)
          )
        `)
        .eq('recordings.interviews.project_id', projectId)
        .ilike('text', `%${query}%`)
        .order('start_time', { ascending: true })
        .limit(30);

      if (!tError && transcriptResults) {
        for (const t of transcriptResults) {
          const rec = (t as any).recordings;
          const interview = rec?.interviews;
          if (interview) {
            results.push({
              id: t.id,
              type: 'transcript',
              text: t.text,
              interviewNumber: interview.number,
              interviewTheme: interview.theme,
              interviewId: interview.id,
              recordingName: rec.name,
              recordingId: rec.id,
              startTime: t.start_time,
            });
          }
        }
      }

      // Search in documents across all interviews
      const { data: interviews } = await supabase
        .from('interviews')
        .select('id, number, theme')
        .eq('project_id', projectId);

      if (interviews) {
        for (const interview of interviews) {
          const { data: docs } = await supabase
            .from('documents')
            .select('id, content')
            .eq('interview_id', interview.id)
            .limit(1);

          if (docs && docs.length > 0) {
            const doc = docs[0];
            const text = extractText(doc.content);
            if (text.toLowerCase().includes(query.toLowerCase())) {
              // Extract a snippet around the match
              const lowerText = text.toLowerCase();
              const idx = lowerText.indexOf(query.toLowerCase());
              const start = Math.max(0, idx - 50);
              const end = Math.min(text.length, idx + query.length + 50);
              const snippet = (start > 0 ? '...' : '') + text.substring(start, end) + (end < text.length ? '...' : '');

              results.push({
                id: doc.id,
                type: 'document',
                text: snippet,
                interviewNumber: interview.number,
                interviewTheme: interview.theme,
                interviewId: interview.id,
              });
            }
          }
        }
      }

      return results;
    },
    enabled: !!projectId && query.trim().length >= 2,
  });
}

function extractText(content: any): string {
  if (!content) return '';
  const extract = (node: any): string => {
    if (!node) return '';
    if (node.type === 'text') return node.text || '';
    if (Array.isArray(node.content)) {
      return node.content.map(extract).join(' ');
    }
    return '';
  };
  return extract(content).trim();
}
