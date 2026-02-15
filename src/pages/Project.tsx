import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Header } from '@/components/Header';
import { RecordingsList } from '@/components/RecordingsList';
import { TextEditor } from '@/components/TextEditor';
import { AIAssistant } from '@/components/AIAssistant';
import { SearchDialog } from '@/components/SearchDialog';
import { Project as ProjectType } from '@/types/biography';

export default function Project() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [selectedRecordingId, setSelectedRecordingId] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);

  const { data: project, isLoading } = useQuery({
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-muted-foreground">Chargement du projet...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background gap-4">
        <div className="text-foreground">Projet introuvable</div>
        <button
          onClick={() => navigate('/dashboard')}
          className="text-sm text-primary hover:underline"
        >
          Retour au tableau de bord
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header
        biographyTitle={project.title}
        onSearchClick={() => setSearchOpen(true)}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Left panel - Recordings */}
        <div className="w-64 shrink-0 h-full">
          <RecordingsList
            projectId={project.id}
            selectedRecordingId={selectedRecordingId}
            onSelectRecording={setSelectedRecordingId}
          />
        </div>

        {/* Center panel - Text Editor */}
        <div className="flex-1 min-w-0 h-full">
          <TextEditor projectId={project.id} />
        </div>

        {/* Right panel - AI Assistant */}
        <div className="w-80 shrink-0 h-full">
          <AIAssistant
            projectId={project.id}
            subjectName={project.subject_name}
          />
        </div>
      </div>

      <SearchDialog
        projectId={project.id}
        open={searchOpen}
        onOpenChange={setSearchOpen}
        onSelectRecording={setSelectedRecordingId}
      />
    </div>
  );
}
