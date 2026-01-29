import { useState } from "react";
import { Mic, Plus, Play, Pause, RotateCcw, RotateCw, Trash2, FileText, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Recording } from "@/types/biography";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

interface RecordingsListProps {
  recordings: Recording[];
  onSelectRecording: (id: string) => void;
  onDeleteRecording: (id: string) => void;
  selectedRecordingId: string | null;
}

const Waveform = ({ isPlaying }: { isPlaying: boolean }) => {
  const bars = Array.from({ length: 40 }, (_, i) => {
    const height = Math.random() * 60 + 20;
    return (
      <div
        key={i}
        className={cn(
          "w-[2px] rounded-full transition-all duration-150",
          isPlaying ? "bg-waveform-active" : "bg-waveform"
        )}
        style={{ height: `${height}%` }}
      />
    );
  });

  return (
    <div className="flex items-center justify-center gap-[2px] h-12 px-2 bg-secondary/50 rounded-lg">
      {bars}
    </div>
  );
};

export function RecordingsList({
  recordings,
  onSelectRecording,
  onDeleteRecording,
  selectedRecordingId,
}: RecordingsListProps) {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [selectedTranscript, setSelectedTranscript] = useState<{ name: string; transcript: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recordingToDelete, setRecordingToDelete] = useState<Recording | null>(null);

  const handlePlayPause = (id: string) => {
    setPlayingId(playingId === id ? null : id);
  };

  const handleTranscriptClick = (recording: Recording) => {
    if (recording.transcript) {
      setSelectedTranscript({ name: recording.name, transcript: recording.transcript });
      setTranscriptOpen(true);
      setCopied(false);
    }
  };

  const handleCopyTranscript = async () => {
    if (selectedTranscript?.transcript) {
      await navigator.clipboard.writeText(selectedTranscript.transcript);
      setCopied(true);
      toast.success("Transcript copié !");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, recording: Recording) => {
    e.stopPropagation();
    setRecordingToDelete(recording);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (recordingToDelete) {
      onDeleteRecording(recordingToDelete.id);
      toast.success(`"${recordingToDelete.name}" supprimé`);
      setDeleteDialogOpen(false);
      setRecordingToDelete(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-panel border-r border-border">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Mic className="w-4 h-4" />
          <span>Enregistrements</span>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7">
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Recordings List */}
      <div className="flex-1 overflow-y-auto">
        {recordings.map((recording) => {
          const isSelected = selectedRecordingId === recording.id;
          const isPlaying = playingId === recording.id;

          return (
            <div
              key={recording.id}
              className={cn(
                "p-3 border-b border-border cursor-pointer transition-colors",
                isSelected ? "bg-secondary/80" : "hover:bg-secondary/40"
              )}
              onClick={() => onSelectRecording(recording.id)}
            >
              {/* Recording Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {isSelected && (
                    <div className="w-2 h-2 rounded-full bg-active-dot" />
                  )}
                  <span className="text-sm font-medium text-foreground">
                    {recording.name}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {recording.duration}
                </span>
              </div>

              {/* Extended view for selected recording */}
              {isSelected && (
                <div className="mt-3 space-y-3">
                  {/* Time and Transcript */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{recording.currentTime}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTranscriptClick(recording);
                      }}
                      className="h-7 text-xs"
                    >
                      <FileText className="w-3 h-3" />
                      Transcript
                    </Button>
                  </div>

                  {/* Waveform */}
                  <Waveform isPlaying={isPlaying} />

                  {/* Time indicators */}
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>1:04:00</span>
                    <span>-0:01</span>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      className="h-10 w-10 rounded-full bg-primary hover:bg-primary/90"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlayPause(recording.id);
                      }}
                    >
                      {isPlaying ? (
                        <Pause className="w-4 h-4 text-primary-foreground" />
                      ) : (
                        <Play className="w-4 h-4 text-primary-foreground ml-0.5" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    >
                      <RotateCw className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive/70 hover:text-destructive"
                      onClick={(e) => handleDeleteClick(e, recording)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Transcript Dialog */}
      <Dialog open={transcriptOpen} onOpenChange={setTranscriptOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <div className="flex items-center justify-between pr-8">
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Transcript - {selectedTranscript?.name}
              </DialogTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyTranscript}
                className="flex items-center gap-2"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-green-500" />
                    Copié
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copier
                  </>
                )}
              </Button>
            </div>
          </DialogHeader>
          <ScrollArea className="h-[60vh] pr-4">
            <div className="whitespace-pre-wrap text-sm text-foreground leading-relaxed select-text">
              {selectedTranscript?.transcript || "Aucun transcript disponible."}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l'enregistrement ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer "{recordingToDelete?.name}" ? Cette action est irréversible.
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
    </div>
  );
}
