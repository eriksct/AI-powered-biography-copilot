import { useState } from "react";
import { Mic, Plus, Play, Pause, RotateCcw, RotateCw, Trash2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Recording } from "@/types/biography";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface RecordingsListProps {
  recordings: Recording[];
  onSelectRecording: (id: string) => void;
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
  selectedRecordingId,
}: RecordingsListProps) {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [selectedTranscript, setSelectedTranscript] = useState<{ name: string; transcript: string } | null>(null);

  const handlePlayPause = (id: string) => {
    setPlayingId(playingId === id ? null : id);
  };

  const handleTranscriptClick = (recording: Recording) => {
    if (recording.transcript) {
      setSelectedTranscript({ name: recording.name, transcript: recording.transcript });
      setTranscriptOpen(true);
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
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTranscriptClick(recording);
                      }}
                      className="flex items-center gap-1 hover:text-foreground transition-colors"
                    >
                      <FileText className="w-3 h-3" />
                      <span>Transcript</span>
                    </button>
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
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Transcript - {selectedTranscript?.name}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[60vh] pr-4">
            <div className="whitespace-pre-wrap text-sm text-foreground leading-relaxed">
              {selectedTranscript?.transcript || "Aucun transcript disponible."}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
