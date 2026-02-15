import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface ProjectStats {
  project_id: string;
  recording_count: number;
  total_duration_seconds: number;
  word_count: number;
}

function countWordsInTipTapContent(content: any): number {
  if (!content) return 0;
  const extractText = (node: any): string => {
    if (!node) return '';
    if (node.type === 'text') return node.text || '';
    if (Array.isArray(node.content)) {
      return node.content.map(extractText).join(' ');
    }
    return '';
  };
  const text = extractText(content).trim();
  if (!text) return 0;
  return text.split(/\s+/).filter(Boolean).length;
}

export function useProjectStats(projectIds: string[]) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['project-stats', projectIds],
    queryFn: async (): Promise<Record<string, ProjectStats>> => {
      if (!projectIds.length) return {};

      // Fetch recording stats per project
      const { data: recordings, error: recError } = await supabase
        .from('recordings')
        .select('project_id, duration_seconds')
        .in('project_id', projectIds);
      if (recError) throw recError;

      // Fetch documents for word count
      const { data: documents, error: docError } = await supabase
        .from('documents')
        .select('project_id, content')
        .in('project_id', projectIds);
      if (docError) throw docError;

      // Aggregate stats
      const stats: Record<string, ProjectStats> = {};
      for (const id of projectIds) {
        stats[id] = {
          project_id: id,
          recording_count: 0,
          total_duration_seconds: 0,
          word_count: 0,
        };
      }

      for (const rec of recordings || []) {
        const s = stats[rec.project_id];
        if (s) {
          s.recording_count++;
          s.total_duration_seconds += rec.duration_seconds || 0;
        }
      }

      for (const doc of documents || []) {
        const s = stats[doc.project_id];
        if (s) {
          s.word_count = countWordsInTipTapContent(doc.content);
        }
      }

      return stats;
    },
    enabled: !!user && projectIds.length > 0,
    staleTime: 1000 * 60 * 2,
  });
}
