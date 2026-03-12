export interface ParsedMessage {
  text: string;
  sources: { index: number; title: string; url: string }[];
}

const SOURCES_SEPARATOR = '---sources---';

export function parseMessageContent(content: string): ParsedMessage {
  const separatorIndex = content.indexOf(SOURCES_SEPARATOR);

  if (separatorIndex === -1) {
    return { text: content, sources: [] };
  }

  const text = content.substring(0, separatorIndex).trimEnd();
  const sourcesBlock = content.substring(separatorIndex + SOURCES_SEPARATOR.length).trim();

  const sources = sourcesBlock
    .split('\n')
    .map((line) => {
      const match = line.match(/^\[(\d+)\]\s+(.+?)\s+\|\s+(https?:\/\/.+)$/);
      if (!match) return null;
      return {
        index: parseInt(match[1], 10),
        title: match[2].trim(),
        url: match[3].trim(),
      };
    })
    .filter((s): s is NonNullable<typeof s> => s !== null);

  return { text, sources };
}
