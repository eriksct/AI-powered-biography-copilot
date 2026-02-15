import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { usePortalSession } from '@/hooks/useCheckout';
import { formatTranscriptionTime } from '@/lib/plans';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import UpgradeDialog from '@/components/UpgradeDialog';
import {
  BookOpen,
  ArrowLeft,
  Crown,
  User,
  LogOut,
  Settings as SettingsIcon,
  Loader2,
  FolderOpen,
  Mic,
  ExternalLink,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

export default function Settings() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const {
    profile,
    plan,
    isPro,
    isLoading,
    projectCount,
    maxProjects,
    transcriptionSecondsUsed,
    maxTranscriptionSeconds,
  } = useSubscription();
  const portalSession = usePortalSession();
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleManageSubscription = async () => {
    try {
      await portalSession.mutateAsync();
    } catch {
      toast.error('Erreur lors de la redirection vers le portail de gestion.');
    }
  };

  const transcriptionPercent = maxTranscriptionSeconds > 0
    ? Math.min(100, (transcriptionSecondsUsed / maxTranscriptionSeconds) * 100)
    : 0;

  const projectPercent = isPro ? 0 : Math.min(100, (projectCount / maxProjects) * 100);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-panel">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              <h1 className="text-lg font-semibold text-foreground">Réglages</h1>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <User className="w-4 h-4" />
                <span className="text-sm">{user?.email}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                <FolderOpen className="w-4 h-4 mr-2" />
                Tableau de bord
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Se déconnecter
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Plan Section */}
        <section className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isPro ? 'bg-amber-100 text-amber-600' : 'bg-secondary text-muted-foreground'}`}>
                {isPro ? <Crown className="w-5 h-5" /> : <SettingsIcon className="w-5 h-5" />}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Votre plan</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant={isPro ? 'default' : 'secondary'}>
                    {isPro ? 'Professionnel' : 'Gratuit'}
                  </Badge>
                  {profile?.subscription_status === 'active' && (
                    <span className="text-xs text-green-600">Actif</span>
                  )}
                  {profile?.subscription_status === 'past_due' && (
                    <span className="text-xs text-amber-600">Paiement en retard</span>
                  )}
                  {profile?.subscription_status === 'canceled' && (
                    <span className="text-xs text-muted-foreground">Annulé</span>
                  )}
                </div>
              </div>
            </div>
            {isPro ? (
              <Button
                variant="outline"
                onClick={handleManageSubscription}
                disabled={portalSession.isPending}
                className="gap-2"
              >
                {portalSession.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ExternalLink className="w-4 h-4" />
                )}
                Gérer mon abonnement
              </Button>
            ) : (
              <Button onClick={() => setUpgradeDialogOpen(true)} className="gap-2">
                <Crown className="w-4 h-4" />
                Passer à Pro
              </Button>
            )}
          </div>

          {/* Plan details */}
          {isPro ? (
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Projets illimités, 15h de transcription/mois, assistant IA illimité</p>
              <p>Export professionnel DOCX/PDF, support prioritaire</p>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground space-y-1">
              <p>1 projet actif, 2h de transcription, fonctionnalités de base</p>
              <p>Passez à Pro pour débloquer toutes les fonctionnalités.</p>
            </div>
          )}
        </section>

        {/* Usage Section */}
        <section className="rounded-xl border border-border bg-card p-6 space-y-6">
          <h2 className="text-lg font-semibold text-foreground">Utilisation</h2>

          {/* Projects usage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-muted-foreground" />
                <span className="text-foreground">Projets</span>
              </div>
              <span className="text-muted-foreground">
                {projectCount} / {isPro ? 'illimité' : maxProjects}
              </span>
            </div>
            {!isPro && (
              <Progress value={projectPercent} className="h-2" />
            )}
          </div>

          {/* Transcription usage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4 text-muted-foreground" />
                <span className="text-foreground">Transcription</span>
              </div>
              <span className="text-muted-foreground">
                {formatTranscriptionTime(transcriptionSecondsUsed)} / {formatTranscriptionTime(maxTranscriptionSeconds)}
              </span>
            </div>
            <Progress value={transcriptionPercent} className="h-2" />
          </div>
        </section>

        {/* Account Section */}
        <section className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Compte</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Email</span>
              <span className="text-foreground">{user?.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Nom</span>
              <span className="text-foreground">{profile?.full_name || '-'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Membre depuis</span>
              <span className="text-foreground">
                {profile?.created_at
                  ? new Date(profile.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })
                  : '-'}
              </span>
            </div>
          </div>
        </section>
      </main>

      <UpgradeDialog
        open={upgradeDialogOpen}
        onOpenChange={setUpgradeDialogOpen}
      />
    </div>
  );
}
