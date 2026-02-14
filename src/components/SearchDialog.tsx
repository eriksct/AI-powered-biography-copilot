import { useState } from 'react';
import { Search, FileText, Clock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useTranscriptSearch } from '@/hooks/useTranscript';
import { cn } from '@/lib/utils';

interface SearchDialogProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectRecording: (recordingId: string) => void;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function SearchDialog({ projectId, open, onOpenChange, onSelectRecording }: SearchDialogProps) {
  const [query, setQuery] = useState('');
  const { data: results, isLoading } = useTranscriptSearch(projectId, query);

  const handleSelect = (result: any) => {
    if (result.recordings?.id) {
      onSelectRecording(result.recordings.id);
    }
    onOpenChange(false);
    setQuery('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 gap-0">
        <div className="flex items-center gap-3 px-4 border-b border-border">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher dans les transcripts..."
            className="border-0 shadow-none focus-visible:ring-0 h-12 text-sm"
            autoFocus
          />
        </div>
        <div className="max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-sm text-muted-foreground text-center">Recherche...</div>
          ) : results && results.length > 0 ? (
            <div className="py-2">
              {results.map((result: any) => (
                <button
                  key={result.id}
                  onClick={() => handleSelect(result)}
                  className="w-full flex items-start gap-3 px-4 py-3 hover:bg-secondary/50 text-left transition-colors"
                >
                  <FileText className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-foreground">
                        {result.recordings?.name || 'Enregistrement'}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Clock className="w-2.5 h-2.5" />
                        {formatTime(result.start_time)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{result.text}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : query.trim().length >= 2 ? (
            <div className="p-4 text-sm text-muted-foreground text-center">
              Aucun résultat pour "{query}"
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
