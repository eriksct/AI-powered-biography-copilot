/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Recursively extracts plain text from a TipTap JSON document.
 * Joins block-level nodes with newlines, inline text nodes are concatenated.
 */
export function extractTextFromTiptap(json: any): string {
  if (!json) return '';
  if (typeof json === 'string') return json;
  if (json.text) return json.text;
  if (json.content && Array.isArray(json.content)) {
    return json.content
      .map((node: any) => extractTextFromTiptap(node))
      .filter((text: string) => text.length > 0)
      .join('\n');
  }
  return '';
}
