import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Header } from '@/components/Header';
import { useInterviews, useCreateInterview, useDeleteInterview, useUpdateInterview } from '@/hooks/useInterviews';
import { useSubscription } from '@/hooks/useSubscription';
import { useProjectSearch, ProjectSearchResult } from '@/hooks/useProjectSearch';
import { Project as ProjectType, Interview } from '@/types/biography';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import UpgradeDialog from '@/components/UpgradeDialog';
import { Plus, Calendar, MessageSquareText, Trash2, Search, FileText, Clock, Pencil, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

function SearchDialog({
  projectId,
  open,
  onOpenChange,
}: {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const { data: results, isLoading } = useProjectSearch(projectId, query);

  const handleSelect = (result: ProjectSearchResult) => {
    navigate(`/project/${projectId}/interview/${result.interviewId}`);
    onOpenChange(false);
    setQuery('');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 gap-0">
        <div className="flex items-center gap-3 px-4 border-b border-border">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher dans tous les entretiens..."
            className="border-0 shadow-none focus-visible:ring-0 h-12 text-sm"
            autoFocus
          />
        </div>
        <div className="max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-sm text-muted-foreground text-center">Recherche...</div>
          ) : results && results.length > 0 ? (
            <div className="py-2">
              {results.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleSelect(result)}
                  className="w-full flex items-start gap-3 px-4 py-3 hover:bg-secondary/50 text-left transition-colors"
                >
                  <FileText className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-foreground">
                        Entretien {result.interviewNumber} — {result.type === 'transcript' ? result.recordingName : 'Texte'}
                      </span>
                      {result.startTime !== undefined && (
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Clock className="w-2.5 h-2.5" />
                          {formatTime(result.startTime)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{result.text}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : query.trim().length >= 2 ? (
            <div className="p-4 text-sm text-muted-foreground text-center">
              Aucun résultat pour « {query} »
            </div>
          ) : (
            <div className="p-4 text-sm text-muted-foreground text-center">
              Tapez au moins 2 caractères pour rechercher
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function ProjectInterviews() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { data: interviews, isLoading: interviewsLoading } = useInterviews(projectId!);
  const createInterview = useCreateInterview();
  const deleteInterview = useDeleteInterview();
  const updateInterview = useUpdateInterview();
  const { profile } = useSubscription();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Interview | null>(null);
  const [theme, setTheme] = useState('');
  const [interviewDate, setInterviewDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

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

  const handleNewInterviewClick = () => {
    const maxInterviews = profile?.max_interviews_per_project ?? 2;
    const currentCount = interviews?.length ?? 0;
    if (currentCount >= maxInterviews) {
      setUpgradeDialogOpen(true);
      return;
    }
    setTheme('');
    setInterviewDate(new Date().toISOString().split('T')[0]);
    setCreateDialogOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!theme.trim()) return;
    try {
      const interview = await createInterview.mutateAsync({
        projectId: projectId!,
        theme: theme.trim(),
        interviewDate,
      });
      setCreateDialogOpen(false);
      toast.success('Entretien créé');
      navigate(`/project/${projectId}/interview/${interview.id}`);
    } catch {
      toast.error("Erreur lors de la création de l'entretien");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteInterview.mutateAsync(deleteTarget);
      toast.success(`Entretien ${deleteTarget.number} supprimé`);
      setDeleteTarget(null);
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleStartRename = (e: React.MouseEvent, interview: Interview) => {
    e.stopPropagation();
    setRenamingId(interview.id);
    setRenameValue(interview.theme || '');
  };

  const handleConfirmRename = async (e: React.MouseEvent | React.FormEvent) => {
    e.stopPropagation();
    if (!renamingId || !renameValue.trim()) return;
    try {
      await updateInterview.mutateAsync({ interviewId: renamingId, theme: renameValue.trim() });
      toast.success('Entretien renommé');
    } catch {
      toast.error('Erreur lors du renommage');
    }
    setRenamingId(null);
  };

  const handleCancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRenamingId(null);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  if (projectLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background gap-4">
        <div className="text-foreground">Projet introuvable</div>
        <button onClick={() => navigate('/dashboard')} className="text-sm text-primary hover:underline">
          Retour au tableau de bord
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/[0.08]">
      <Header
        breadcrumbs={[
          { label: 'Mes biographies', href: '/dashboard' },
          { label: project.title },
        ]}
        onSearchClick={() => setSearchOpen(true)}
      />

      <main className="max-w-4xl mx-auto px-6 py-10">
        {/* Title section */}
        <div className="mb-10">
          <div className="flex items-end justify-between gap-4">
            <div className="space-y-1.5">
              <h2 className="text-3xl font-bold text-foreground tracking-tight">
                {project.title}
              </h2>
              {project.subject_name && (
                <p className="text-muted-foreground text-base">
                  {project.subject_name}
                </p>
              )}
            </div>
            <Button className="gap-2 shadow-sm" onClick={handleNewInterviewClick}>
              <Plus className="w-4 h-4" />
              Nouvel entretien
            </Button>
          </div>
        </div>

        {/* Interview list */}
        {interviewsLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-24 rounded-xl bg-secondary/50 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {interviews && interviews.map((interview) => (
              <div
                key={interview.id}
                className="group relative border border-border/60 rounded-xl p-5 bg-card hover:shadow-lg hover:shadow-primary/[0.06] hover:border-primary/30 transition-all duration-200 cursor-pointer"
                onClick={() => navigate(`/project/${projectId}/interview/${interview.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary font-bold text-sm shrink-0">
                      {interview.number}
                    </div>
                    <div>
                      {renamingId === interview.id ? (
                        <form onSubmit={handleConfirmRename} onClick={(e) => e.stopPropagation()} className="flex items-center gap-1.5">
                          <Input
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            className="h-8 text-sm font-medium w-48"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Escape') { e.stopPropagation(); setRenamingId(null); }
                            }}
                          />
                          <Button type="submit" variant="ghost" size="icon" className="h-7 w-7 text-green-600 hover:text-green-700" disabled={!renameValue.trim()}>
                            <Check className="w-3.5 h-3.5" />
                          </Button>
                          <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={handleCancelRename}>
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        </form>
                      ) : (
                        <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                          {interview.theme || `Entretien ${interview.number}`}
                        </h3>
                      )}
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(interview.interview_date)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {renamingId !== interview.id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-opacity"
                        onClick={(e) => handleStartRename(e, interview)}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 text-destructive/70 hover:text-destructive transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(interview);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {/* Ghost card to create a new interview */}
            <div
              className="border border-dashed border-border/60 rounded-xl p-5 hover:border-primary/40 hover:bg-primary/[0.03] transition-all duration-200 cursor-pointer group"
              onClick={handleNewInterviewClick}
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg border border-dashed border-border group-hover:border-primary/40 text-muted-foreground group-hover:text-primary transition-colors">
                  <Plus className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
                  Nouvel entretien
                </span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Create interview dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nouvel entretien</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="theme">Thème de l'entretien</Label>
              <Input
                id="theme"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                placeholder="ex: Enfance et famille"
                required
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="interview-date">Date de l'entretien</Label>
              <Input
                id="interview-date"
                type="date"
                value={interviewDate}
                onChange={(e) => setInterviewDate(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={createInterview.isPending || !theme.trim()}>
                {createInterview.isPending ? 'Création...' : 'Créer'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l'entretien ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer l'entretien {deleteTarget?.number} ({deleteTarget?.theme}) ?
              Tous les enregistrements, textes et discussions associés seront perdus. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Upgrade dialog */}
      <UpgradeDialog
        open={upgradeDialogOpen}
        onOpenChange={setUpgradeDialogOpen}
        reason="interview_limit"
      />

      {/* Search dialog */}
      <SearchDialog
        projectId={projectId!}
        open={searchOpen}
        onOpenChange={setSearchOpen}
      />
    </div>
  );
}
