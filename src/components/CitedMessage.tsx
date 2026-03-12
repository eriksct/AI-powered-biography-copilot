import { ExternalLink } from 'lucide-react';
import { parseMessageContent } from '@/lib/parseMessageContent';

interface CitedMessageProps {
  content: string;
}

export function CitedMessage({ content }: CitedMessageProps) {
  const { text, sources } = parseMessageContent(content);

  if (sources.length === 0) {
    return <div className="whitespace-pre-wrap">{text}</div>;
  }

  // Replace [N] markers with clickable citation badges
  const parts = text.split(/(\[\d+\])/g);
  const rendered = parts.map((part, i) => {
    const citationMatch = part.match(/^\[(\d+)\]$/);
    if (citationMatch) {
      const idx = parseInt(citationMatch[1], 10);
      const source = sources.find((s) => s.index === idx);
      if (source) {
        return (
          <a
            key={i}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-5 h-5 text-[10px] font-semibold bg-primary/15 text-primary rounded-full hover:bg-primary/25 transition-colors cursor-pointer align-super ml-0.5"
            title={source.title}
          >
            {idx}
          </a>
        );
      }
    }
    return <span key={i}>{part}</span>;
  });

  return (
    <div>
      <div className="whitespace-pre-wrap">{rendered}</div>
      <div className="mt-3 pt-2 border-t border-border/30 space-y-1">
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Sources</p>
        {sources.map((source) => (
          <a
            key={source.index}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors group"
          >
            <span className="font-medium text-primary/70 shrink-0">[{source.index}]</span>
            <span className="truncate group-hover:underline">{source.title}</span>
            <ExternalLink className="w-3 h-3 shrink-0 mt-0.5 opacity-0 group-hover:opacity-100" />
          </a>
        ))}
      </div>
    </div>
  );
}
