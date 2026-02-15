import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useProjects, useCreateProject, useUpdateProject, useDeleteProject } from '@/hooks/useProjects';
import { useSubscription } from '@/hooks/useSubscription';
import { useProjectStats } from '@/hooks/useProjectStats';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { BookOpen, Plus, MoreVertical, Trash2, User, LogOut, Edit2, Calendar, Mic, FileText, Settings, type LucideIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Project } from '@/types/biography';
import UpgradeDialog from '@/components/UpgradeDialog';

// Deterministic color for project avatar based on title
const AVATAR_COLORS = [
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-violet-500 to-purple-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
  'from-cyan-500 to-sky-600',
];

function getAvatarColor(title: string): string {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(title: string): string {
  return title
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

function StatPill({ icon: Icon, value, label }: { icon: LucideIcon; value: number; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Icon className="w-3.5 h-3.5" />
      <span>
        {value} {label}
      </span>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { user, signOut } = useAuth();
  const { data: projects, isLoading } = useProjects();
  const { canCreateProject } = useSubscription();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();

  const projectIds = useMemo(() => (projects || []).map((p) => p.id), [projects]);
  const { data: statsMap } = useProjectStats(projectIds);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [description, setDescription] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [editTarget, setEditTarget] = useState<Project | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');

  // Handle checkout success/cancel query params
  useEffect(() => {
    const checkoutStatus = searchParams.get('checkout');
    if (checkoutStatus === 'success') {
      toast.success('Abonnement activé ! Bienvenue dans Biograph Pro.');
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      searchParams.delete('checkout');
      setSearchParams(searchParams, { replace: true });
    } else if (checkoutStatus === 'cancel') {
      toast.info('Paiement annulé.');
      searchParams.delete('checkout');
      setSearchParams(searchParams, { replace: true });
    }
  }, []);

  const handleNewProjectClick = () => {
    if (canCreateProject) {
      setDialogOpen(true);
    } else {
      setUpgradeDialogOpen(true);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const project = await createProject.mutateAsync({
        title,
        subject_name: subjectName,
        description,
      });
      setDialogOpen(false);
      setTitle('');
      setSubjectName('');
      setDescription('');
      toast.success('Projet créé');
      navigate(`/project/${project.id}`);
    } catch {
      toast.error('Erreur lors de la création du projet');
    }
  };

  const handleEdit = async () => {
    if (!editTarget || !editTitle.trim()) return;
    try {
      await updateProject.mutateAsync({
        projectId: editTarget.id,
        title: editTitle.trim(),
      });
      toast.success('Projet renommé');
      setEditDialogOpen(false);
      setEditTarget(null);
    } catch {
      toast.error('Erreur lors du renommage');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteProject.mutateAsync(deleteTarget.id);
      toast.success(`"${deleteTarget.title}" supprimé`);
      setDeleteTarget(null);
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || '';
  const firstName = (user?.user_metadata?.full_name || user?.email?.split('@')[0] || '').split(/\s+/)[0];

  const projectCount = projects?.length ?? 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/[0.03]">
      {/* Header */}
      <header className="border-b border-border/60 bg-panel/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
              <BookOpen className="w-4.5 h-4.5 text-primary" />
            </div>
            <h1 className="text-lg font-semibold text-foreground tracking-tight">Biograph</h1>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <User className="w-4 h-4" />
                <span className="text-sm">{displayName}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <Settings className="w-4 h-4 mr-2" />
                Réglages
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Se déconnecter
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* Hero section */}
        <div className="mb-10">
          <div className="flex items-end justify-between gap-4">
            <div className="space-y-1.5">
              <h2 className="text-3xl font-bold text-foreground tracking-tight">
                Bonjour {firstName}, qu'écrivons-nous aujourd'hui ?
              </h2>
              <p className="text-muted-foreground text-base">
                {projectCount === 0
                  ? 'Créez votre première biographie pour commencer.'
                  : projectCount === 1
                    ? '1 biographie en cours'
                    : `${projectCount} biographies en cours`}
              </p>
            </div>
            <Button className="gap-2 shadow-sm" onClick={handleNewProjectClick}>
              <Plus className="w-4 h-4" />
              Nouveau projet
            </Button>
          </div>
        </div>

        {/* Create project dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nouveau projet de biographie</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titre du projet</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="ex: Biographie de Madame Herveux"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Nom du sujet</Label>
                <Input
                  id="subject"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  placeholder="ex: Madame Herveux"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (optionnel)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Notes sur le projet..."
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={createProject.isPending}>
                  {createProject.isPending ? 'Création...' : 'Créer'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Project grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-52 rounded-2xl bg-secondary/50 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Project cards */}
            {projects?.map((project) => {
              const stats = statsMap?.[project.id];
              const recordingCount = stats?.recording_count ?? 0;
              const wordCount = stats?.word_count ?? 0;
              // Progress heuristic: recording = 40%, writing = 60%
              const hasRecordings = recordingCount > 0;
              const hasWritten = wordCount > 100;
              const progressValue = (hasRecordings ? 40 : 0) + (hasWritten ? Math.min(60, Math.floor((wordCount / 2000) * 60)) : 0);

              return (
                <div
                  key={project.id}
                  className="group relative border border-border/60 rounded-2xl p-6 bg-card hover:shadow-xl hover:shadow-primary/[0.08] hover:border-primary/30 hover:-translate-y-1 transition-all duration-300 ease-out cursor-pointer"
                  onClick={() => navigate(`/project/${project.id}`)}
                >
                  {/* Context menu */}
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-secondary/80"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditTarget(project);
                            setEditTitle(project.title);
                            setEditDialogOpen(true);
                          }}
                        >
                          <Edit2 className="w-4 h-4 mr-2" />
                          Renommer
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget(project);
                          }}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="space-y-4">
                    {/* Avatar + title */}
                    <div className="flex items-start gap-3.5">
                      <div
                        className={`flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br ${getAvatarColor(project.title)} text-white text-sm font-bold shrink-0 shadow-sm`}
                      >
                        {getInitials(project.title)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground text-base leading-tight mb-0.5 group-hover:text-primary transition-colors duration-200">
                          {project.title}
                        </h3>
                        {project.subject_name && (
                          <p className="text-sm text-muted-foreground truncate">{project.subject_name}</p>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    {project.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                        {project.description}
                      </p>
                    )}

                    {/* Stats row */}
                    <div className="flex items-center gap-4">
                      <StatPill icon={Mic} value={recordingCount} label={recordingCount === 1 ? 'entretien' : 'entretiens'} />
                      <StatPill icon={FileText} value={wordCount} label="mots" />
                    </div>

                    {/* Progress bar */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground font-medium">Progression</span>
                        <span className="text-[11px] text-muted-foreground">{Math.min(progressValue, 100)}%</span>
                      </div>
                      <Progress value={Math.min(progressValue, 100)} className="h-1.5" />
                    </div>

                    {/* Date */}
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70 pt-1 border-t border-border/40">
                      <Calendar className="w-3 h-3" />
                      <span>Modifié le {formatDate(project.updated_at)}</span>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* New project card (dashed) */}
            <button
              onClick={handleNewProjectClick}
              className="group border-2 border-dashed border-border/60 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 min-h-[240px] hover:border-primary/40 hover:bg-primary/[0.03] hover:-translate-y-1 transition-all duration-300 ease-out cursor-pointer"
            >
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-secondary/60 group-hover:bg-primary/10 transition-colors duration-300">
                <Plus className="w-7 h-7 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors duration-300">
                  Nouveau projet
                </p>
                <p className="text-xs text-muted-foreground/60 mt-0.5">
                  Commencer une biographie
                </p>
              </div>
            </button>
          </div>
        )}

        {/* Empty state (only when no projects at all) */}
        {!isLoading && projects && projects.length === 0 && (
          <div className="text-center py-20 space-y-5">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mx-auto">
              <BookOpen className="w-8 h-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-foreground">Aucun projet</h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                Commencez par créer votre premier projet de biographie. Enregistrez des entretiens et laissez
                l'IA vous aider à rédiger.
              </p>
            </div>
            <Button onClick={() => setDialogOpen(true)} size="lg" className="gap-2 shadow-sm">
              <Plus className="w-4 h-4" />
              Créer mon premier projet
            </Button>
          </div>
        )}
      </main>

      {/* Edit dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Renommer le projet</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Nouveau titre</Label>
              <Input
                id="edit-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Titre du projet"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleEdit()}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleEdit} disabled={updateProject.isPending || !editTitle.trim()}>
                {updateProject.isPending ? 'Renommage...' : 'Renommer'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le projet ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer « {deleteTarget?.title} » ? Tous les enregistrements
              et textes associés seront perdus. Cette action est irréversible.
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
        reason="projects"
      />
    </div>
  );
}
