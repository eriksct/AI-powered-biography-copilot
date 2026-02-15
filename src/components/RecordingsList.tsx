import { useState, useRef } from 'react';
import { Mic, Square, Pause, Play, RotateCcw, RotateCw, Trash2, FileText, Copy, Check, Plus, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Recording } from '@/types/biography';
import { cn } from '@/lib/utils';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { useRecordings, useCreateRecording, useDeleteRecording, useRecordingAudioUrl } from '@/hooks/useRecordings';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { useTranscript } from '@/hooks/useTranscript';
import { useSubscription } from '@/hooks/useSubscription';
import UpgradeDialog from '@/components/UpgradeDialog';

interface RecordingsListProps {
  projectId: string;
  selectedRecordingId: string | null;
  onSelectRecording: (id: string) => void;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function TranscriptionBadge({ status }: { status: string }) {
  switch (status) {
    case 'processing':
      return (
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400 px-3 py-1.5 rounded-full shadow-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          Transcription en cours
        </span>
      );
    case 'completed':
      return (
        <span className="inline-flex items-center gap-1 text-[10px] text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400 px-1.5 py-0.5 rounded-full">
          <CheckCircle className="w-2.5 h-2.5" />
          Transcrit
        </span>
      );
    case 'failed':
      return (
        <span className="inline-flex items-center gap-1 text-[10px] text-destructive bg-destructive/10 px-1.5 py-0.5 rounded-full">
          <AlertCircle className="w-2.5 h-2.5" />
          Erreur
        </span>
      );
    default:
      return (
        <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-full">
          En attente
        </span>
      );
  }
}

function AudioPlayer({ recording }: { recording: Recording }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const { data: audioUrl } = useRecordingAudioUrl(recording.audio_path);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  const skip = (e: React.MouseEvent, seconds: number) => {
    e.stopPropagation();
    if (!audioRef.current) return;
    audioRef.current.currentTime += seconds;
  };

  if (!audioUrl) return null;

  return (
    <div className="mt-3 space-y-3">
      <audio
        ref={audioRef}
        src={audioUrl}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
      />

      {/* Progress bar */}
      <div className="px-1">
        <div
          className="h-1.5 bg-secondary rounded-full cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            if (!audioRef.current) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const pct = (e.clientX - rect.left) / rect.width;
            audioRef.current.currentTime = pct * recording.duration_seconds;
          }}
        >
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${(currentTime / Math.max(recording.duration_seconds, 1)) * 100}%` }}
          />
        </div>
      </div>

      {/* Time */}
      <div className="flex justify-between text-xs text-muted-foreground px-1">
        <span>{formatDuration(Math.round(currentTime))}</span>
        <span>{formatDuration(recording.duration_seconds)}</span>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => skip(e, -10)}>
          <RotateCcw className="w-4 h-4" />
        </Button>
        <Button
          size="icon"
          className="h-10 w-10 rounded-full bg-primary hover:bg-primary/90"
          onClick={togglePlay}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4 text-primary-foreground" />
          ) : (
            <Play className="w-4 h-4 text-primary-foreground ml-0.5" />
          )}
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => skip(e, 10)}>
          <RotateCw className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

function TranscriptDialog({ recording, open, onOpenChange }: {
  recording: Recording;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: segments } = useTranscript(open ? recording.id : null);
  const [copied, setCopied] = useState(false);

  const fullText = segments?.map((s) => s.text).join(' ') || '';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(fullText);
    setCopied(true);
    toast.success('Transcript copié !');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <div className="flex items-center justify-between pr-8">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Transcript - {recording.name}
            </DialogTitle>
            <Button variant="outline" size="sm" onClick={handleCopy} className="flex items-center gap-2">
              {copied ? (
                <><Check className="w-4 h-4 text-green-500" /> Copié</>
              ) : (
                <><Copy className="w-4 h-4" /> Copier</>
              )}
            </Button>
          </div>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          {segments && segments.length > 0 ? (
            <div className="space-y-3">
              {segments.map((segment) => (
                <div key={segment.id} className="flex gap-3 text-sm">
                  <span className="text-xs text-muted-foreground font-mono shrink-0 pt-0.5">
                    {formatDuration(Math.round(segment.start_time))}
                  </span>
                  <p className={cn(
                    "text-foreground leading-relaxed",
                    segment.confidence !== undefined && segment.confidence !== null && segment.confidence < 0.8 && "text-yellow-600 dark:text-yellow-400"
                  )}>
                    {segment.text}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Aucun transcript disponible.</p>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export function RecordingsList({ projectId, selectedRecordingId, onSelectRecording }: RecordingsListProps) {
  const { data: recordings, isLoading } = useRecordings(projectId);
  const createRecording = useCreateRecording();
  const deleteRecording = useDeleteRecording();
  const recorder = useAudioRecorder();
  const { canTranscribe } = useSubscription();

  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [transcriptRecording, setTranscriptRecording] = useState<Recording | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recordingToDelete, setRecordingToDelete] = useState<Recording | null>(null);
  const [nameDialogOpen, setNameDialogOpen] = useState(false);
  const [recordingName, setRecordingName] = useState('');
  const [pendingBlob, setPendingBlob] = useState<Blob | null>(null);
  const [pendingDuration, setPendingDuration] = useState(0);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);

  const handleStartRecording = async () => {
    if (!canTranscribe) {
      setUpgradeDialogOpen(true);
      return;
    }
    await recorder.startRecording();
  };

  const handleStopRecording = async () => {
    const blob = await recorder.stopRecording();
    if (blob) {
      setPendingBlob(blob);
      setPendingDuration(recorder.duration);
      setRecordingName(`Enregistrement ${(recordings?.length || 0) + 1}`);
      setNameDialogOpen(true);
    }
  };

  const handleSaveRecording = async () => {
    if (!pendingBlob || !recordingName.trim()) return;
    try {
      const created = await createRecording.mutateAsync({
        projectId,
        name: recordingName.trim(),
        audioBlob: pendingBlob,
        durationSeconds: pendingDuration,
      });
      setNameDialogOpen(false);
      setPendingBlob(null);
      onSelectRecording(created.id);
      toast.success('Enregistrement sauvegardé');
    } catch {
      toast.error("Erreur lors de la sauvegarde de l'enregistrement");
    }
  };

  const handleTranscriptClick = (e: React.MouseEvent, recording: Recording) => {
    e.stopPropagation();
    if (recording.transcription_status === 'completed') {
      setTranscriptRecording(recording);
      setTranscriptOpen(true);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, recording: Recording) => {
    e.stopPropagation();
    setRecordingToDelete(recording);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!recordingToDelete) return;
    try {
      await deleteRecording.mutateAsync(recordingToDelete);
      toast.success(`"${recordingToDelete.name}" supprimé`);
    } catch {
      toast.error('Erreur lors de la suppression');
    }
    setDeleteDialogOpen(false);
    setRecordingToDelete(null);
  };

  return (
    <div className="flex flex-col h-full bg-panel border-r border-border">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Mic className="w-4 h-4" />
          <span>Enregistrements</span>
        </div>
      </div>

      {/* Recording controls */}
      <div className="px-3 py-3 border-b border-border">
        {recorder.isRecording ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                <span className="text-sm font-medium text-destructive">
                  {formatDuration(recorder.duration)}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {recorder.isPaused ? (
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={recorder.resumeRecording}>
                    <Play className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={recorder.pauseRecording}>
                    <Pause className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  variant="destructive"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleStopRecording}
                >
                  <Square className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
            {recorder.isPaused && (
              <p className="text-xs text-muted-foreground">En pause</p>
            )}
          </div>
        ) : (
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={handleStartRecording}
            disabled={createRecording.isPending}
          >
            <Mic className="w-4 h-4" />
            Nouvel enregistrement
          </Button>
        )}
        {recorder.error && (
          <p className="text-xs text-destructive mt-2">{recorder.error}</p>
        )}
      </div>

      {/* Recordings List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-sm text-muted-foreground">Chargement...</div>
        ) : recordings && recordings.length > 0 ? (
          recordings.map((recording) => {
            const isSelected = selectedRecordingId === recording.id;
            return (
              <div
                key={recording.id}
                className={cn(
                  'p-3 border-b border-border cursor-pointer transition-colors',
                  isSelected ? 'bg-secondary/80' : 'hover:bg-secondary/40'
                )}
                onClick={() => onSelectRecording(recording.id)}
              >
                {/* Recording Header */}
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    {isSelected && <div className="w-2 h-2 rounded-full bg-active-dot" />}
                    <span className="text-sm font-medium text-foreground">{recording.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDuration(recording.duration_seconds)}
                  </span>
                </div>

                {/* Status */}
                <div className="flex items-center justify-between mb-1">
                  <TranscriptionBadge status={recording.transcription_status} />
                </div>

                {/* Expanded view */}
                {isSelected && (
                  <div className="mt-2 space-y-2">
                    <AudioPlayer recording={recording} />

                    {/* Actions */}
                    <div className="flex items-center justify-center gap-2 pt-2">
                      {recording.transcription_status === 'completed' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs gap-1"
                          onClick={(e) => handleTranscriptClick(e, recording)}
                        >
                          <FileText className="w-3 h-3" />
                          Transcript
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive/70 hover:text-destructive"
                        onClick={(e) => handleDeleteClick(e, recording)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Aucun enregistrement
          </div>
        )}
      </div>

      {/* Name dialog */}
      <Dialog open={nameDialogOpen} onOpenChange={setNameDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Nommer l'enregistrement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              value={recordingName}
              onChange={(e) => setRecordingName(e.target.value)}
              placeholder="Nom de l'enregistrement"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleSaveRecording()}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setNameDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleSaveRecording} disabled={createRecording.isPending}>
                {createRecording.isPending ? 'Sauvegarde...' : 'Sauvegarder'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transcript Dialog */}
      {transcriptRecording && (
        <TranscriptDialog
          recording={transcriptRecording}
          open={transcriptOpen}
          onOpenChange={setTranscriptOpen}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l'enregistrement ?</AlertDialogTitle>
            <AlertDialogDescription>
              Etes-vous sur de vouloir supprimer "{recordingToDelete?.name}" ? Cette action est irreversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Upgrade Dialog */}
      <UpgradeDialog
        open={upgradeDialogOpen}
        onOpenChange={setUpgradeDialogOpen}
        reason="transcription"
      />
    </div>
  );
}
