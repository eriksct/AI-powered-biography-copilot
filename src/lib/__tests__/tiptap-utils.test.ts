import { describe, it, expect } from 'vitest';
import { extractTextFromTiptap } from '../tiptap-utils';

describe('extractTextFromTiptap', () => {
  it('extracts text from simple paragraphs', () => {
    const doc = {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'Bonjour le monde' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Deuxième paragraphe' }] },
      ],
    };
    expect(extractTextFromTiptap(doc)).toBe('Bonjour le monde\nDeuxième paragraphe');
  });

  it('extracts text from headings and paragraphs', () => {
    const doc = {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Chapitre 1' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Contenu du chapitre.' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Section A' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Détails de la section.' }] },
      ],
    };
    const result = extractTextFromTiptap(doc);
    expect(result).toContain('Chapitre 1');
    expect(result).toContain('Contenu du chapitre.');
    expect(result).toContain('Section A');
    expect(result).toContain('Détails de la section.');
  });

  it('extracts text from bullet and ordered lists', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'bulletList',
          content: [
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Item 1' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Item 2' }] }] },
          ],
        },
      ],
    };
    const result = extractTextFromTiptap(doc);
    expect(result).toContain('Item 1');
    expect(result).toContain('Item 2');
  });

  it('returns empty string for null', () => {
    expect(extractTextFromTiptap(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(extractTextFromTiptap(undefined)).toBe('');
  });

  it('returns empty string for empty object', () => {
    expect(extractTextFromTiptap({})).toBe('');
  });

  it('returns the string itself when input is a string', () => {
    expect(extractTextFromTiptap('plain text')).toBe('plain text');
  });

  it('handles deeply nested lists', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [
                { type: 'paragraph', content: [{ type: 'text', text: 'Parent' }] },
                {
                  type: 'bulletList',
                  content: [
                    { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Enfant' }] }] },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };
    const result = extractTextFromTiptap(doc);
    expect(result).toContain('Parent');
    expect(result).toContain('Enfant');
  });

  it('handles inline formatting (bold, italic)', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Normal ' },
            { type: 'text', marks: [{ type: 'bold' }], text: 'gras' },
            { type: 'text', text: ' texte' },
          ],
        },
      ],
    };
    const result = extractTextFromTiptap(doc);
    expect(result).toContain('Normal');
    expect(result).toContain('gras');
    expect(result).toContain('texte');
  });

  it('filters out empty text nodes', () => {
    const doc = {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'Texte' }] },
        { type: 'paragraph', content: [] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Suite' }] },
      ],
    };
    const result = extractTextFromTiptap(doc);
    expect(result).toBe('Texte\nSuite');
  });
});
