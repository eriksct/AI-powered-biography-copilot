import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Header } from '@/components/Header';
import { RecordingsList } from '@/components/RecordingsList';
import { TextEditor } from '@/components/TextEditor';
import { AIAssistant } from '@/components/AIAssistant';
import { SearchDialog } from '@/components/SearchDialog';
import { Project as ProjectType, Interview as InterviewType } from '@/types/biography';
import { useInterview } from '@/hooks/useInterviews';
import { useIsMobile } from '@/hooks/use-mobile';

export default function Interview() {
  const { projectId, interviewId } = useParams<{ projectId: string; interviewId: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [selectedRecordingId, setSelectedRecordingId] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async (): Promise<ProjectType> => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  const { data: interview, isLoading: interviewLoading } = useInterview(interviewId || null);

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (projectLoading || interviewLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-muted-foreground">Chargement de l'entretien...</div>
      </div>
    );
  }

  if (!project || !interview) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background gap-4">
        <div className="text-foreground">Entretien introuvable</div>
        <button
          onClick={() => navigate(projectId ? `/project/${projectId}` : '/dashboard')}
          className="text-sm text-primary hover:underline"
        >
          Retour
        </button>
      </div>
    );
  }

  const interviewLabel = `Entretien ${interview.number} — ${interview.theme || ''}`.trim();

  if (isMobile) {
    return (
      <div className="flex flex-col h-screen bg-background">
        <Header
          breadcrumbs={[
            { label: 'Mes biographies', href: '/dashboard' },
            { label: project.title, href: `/project/${projectId}` },
            { label: interviewLabel },
          ]}
        />
        <div className="flex-1 overflow-hidden">
          <RecordingsList
            interviewId={interview.id}
            selectedRecordingId={selectedRecordingId}
            onSelectRecording={setSelectedRecordingId}
            fullScreen
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header
        breadcrumbs={[
          { label: 'Mes biographies', href: '/dashboard' },
          { label: project.title, href: `/project/${projectId}` },
          { label: interviewLabel },
        ]}
        onSearchClick={() => setSearchOpen(true)}
      />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left panel - Recordings */}
        <div className="w-64 shrink-0 h-full overflow-hidden">
          <RecordingsList
            interviewId={interview.id}
            selectedRecordingId={selectedRecordingId}
            onSelectRecording={setSelectedRecordingId}
          />
        </div>

        {/* Center panel - Text Editor */}
        <div className="flex-1 min-w-0 h-full overflow-hidden">
          <TextEditor interviewId={interview.id} />
        </div>

        {/* Right panel - AI Assistant */}
        <div className="w-80 shrink-0 h-full overflow-hidden">
          <AIAssistant
            interviewId={interview.id}
            subjectName={project.subject_name}
            interviewTheme={interview.theme}
            interviewNumber={interview.number}
          />
        </div>
      </div>

      <SearchDialog
        interviewId={interview.id}
        open={searchOpen}
        onOpenChange={setSearchOpen}
        onSelectRecording={setSelectedRecordingId}
      />
    </div>
  );
}
