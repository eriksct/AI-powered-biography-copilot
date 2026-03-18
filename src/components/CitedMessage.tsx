import { ExternalLink } from 'lucide-react';
import { parseMessageContent, ParsedSource } from '@/lib/parseMessageContent';

interface CitedMessageProps {
  content: string;
}

export function CitedMessage({ content }: CitedMessageProps) {
  const { text, sources } = parseMessageContent(content);

  if (sources.length === 0) {
    return <div className="whitespace-pre-wrap">{text}</div>;
  }

  const handleCitationClick = (source: ParsedSource) => {
    if (source.type === 'recording') {
      // Parse recording:uuid?t=seconds
      const match = source.url.match(/^recording:([^?]+)\??t?=?(\d*)$/);
      if (match) {
        const recordingId = match[1];
        const time = parseInt(match[2] || '0', 10);
        window.dispatchEvent(
          new CustomEvent('citation-navigate', {
            detail: { recordingId, time },
          })
        );
      }
    }
  };

  // Replace [N] markers with inline pill badges
  const parts = text.split(/(\[\d+\])/g);
  const rendered = parts.map((part, i) => {
    const citationMatch = part.match(/^\[(\d+)\]$/);
    if (citationMatch) {
      const idx = parseInt(citationMatch[1], 10);
      const source = sources.find((s) => s.index === idx);
      if (source) {
        if (source.type === 'recording') {
          // Extract short label from title (e.g. "Enregistrement 2 — 0:00" → "Enregistrement 2")
          const label = source.title.split(' — ')[0];
          return (
            <button
              key={i}
              type="button"
              onClick={() => handleCitationClick(source)}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground bg-secondary hover:bg-secondary/80 rounded-full px-2 py-0.5 ml-1 align-baseline cursor-pointer transition-colors border border-border/50"
              title={source.title}
            >
              {label}
            </button>
          );
        }
        // Web source
        return (
          <a
            key={i}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-full px-2 py-0.5 ml-1 align-baseline cursor-pointer transition-colors"
            title={source.title}
          >
            {source.title}
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        );
      }
    }
    return <span key={i}>{part}</span>;
  });

  return (
    <div className="whitespace-pre-wrap">{rendered}</div>
  );
}
