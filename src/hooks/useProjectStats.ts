import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface ProjectStats {
  project_id: string;
  interview_count: number;
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

      const stats: Record<string, ProjectStats> = {};
      for (const id of projectIds) {
        stats[id] = {
          project_id: id,
          interview_count: 0,
          recording_count: 0,
          total_duration_seconds: 0,
          word_count: 0,
        };
      }

      // Fetch interviews per project
      const { data: interviews, error: intError } = await supabase
        .from('interviews')
        .select('id, project_id')
        .in('project_id', projectIds);
      if (intError) throw intError;

      const interviewIds = (interviews || []).map((i) => i.id);
      const interviewToProject: Record<string, string> = {};
      for (const i of interviews || []) {
        interviewToProject[i.id] = i.project_id;
        stats[i.project_id].interview_count++;
      }

      if (interviewIds.length === 0) return stats;

      // Fetch recording stats via interviews
      const { data: recordings, error: recError } = await supabase
        .from('recordings')
        .select('interview_id, duration_seconds')
        .in('interview_id', interviewIds);
      if (recError) throw recError;

      for (const rec of recordings || []) {
        const projectId = interviewToProject[rec.interview_id];
        if (projectId && stats[projectId]) {
          stats[projectId].recording_count++;
          stats[projectId].total_duration_seconds += rec.duration_seconds || 0;
        }
      }

      // Fetch documents for word count via interviews
      const { data: documents, error: docError } = await supabase
        .from('documents')
        .select('interview_id, content')
        .in('interview_id', interviewIds);
      if (docError) throw docError;

      for (const doc of documents || []) {
        const projectId = interviewToProject[doc.interview_id];
        if (projectId && stats[projectId]) {
          stats[projectId].word_count += countWordsInTipTapContent(doc.content);
        }
      }

      return stats;
    },
    enabled: !!user && projectIds.length > 0,
    staleTime: 1000 * 60 * 2,
  });
}
