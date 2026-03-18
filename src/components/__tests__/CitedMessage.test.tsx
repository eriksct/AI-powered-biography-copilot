import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CitedMessage } from '../CitedMessage';
import { parseMessageContent } from '@/lib/parseMessageContent';

describe('CitedMessage', () => {
  it('renders plain text when no sources', () => {
    render(<CitedMessage content="Hello world" />);
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('renders web sources as links with source title', () => {
    const content = 'Texte [1]\n\n---sources---\n[1] Wikipedia | https://en.wikipedia.org';
    const { container } = render(<CitedMessage content={content} />);
    const link = container.querySelector('a[href="https://en.wikipedia.org"]');
    expect(link).not.toBeNull();
    expect(link?.textContent).toContain('Wikipedia');
  });

  it('renders recording sources as clickable buttons', () => {
    const content = 'Texte [1]\n\n---sources---\n[1] Rec 1 — 2:30 | recording:uuid-123?t=150';
    // Verify parsing works
    const parsed = parseMessageContent(content);
    expect(parsed.sources).toHaveLength(1);
    expect(parsed.sources[0].type).toBe('recording');

    const { container } = render(<CitedMessage content={content} />);
    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThanOrEqual(1);
    const recButton = Array.from(buttons).find(b => b.textContent?.includes('Rec 1'));
    expect(recButton).toBeDefined();
    expect(recButton?.tagName).toBe('BUTTON');
  });

  it('renders inline citation pill for recording sources', () => {
    const content = 'Il est né en 1940 [1]\n\n---sources---\n[1] Rec 1 — 0:45 | recording:uuid?t=45';
    const { container } = render(<CitedMessage content={content} />);
    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThanOrEqual(1);
    const recButton = Array.from(buttons).find(b => b.textContent?.includes('Rec 1'));
    expect(recButton).toBeDefined();
    expect(recButton?.textContent).toBe('Rec 1');
  });

  it('renders mixed web and recording sources correctly', () => {
    const content = 'Texte [1] et [2]\n\n---sources---\n[1] Rec 1 — 1:00 | recording:uuid?t=60\n[2] Site | https://example.com';
    const { container } = render(<CitedMessage content={content} />);

    // Recording source (button, not a link)
    const buttons = container.querySelectorAll('button');
    const recButton = Array.from(buttons).find(b => b.textContent?.includes('Rec 1'));
    expect(recButton).toBeDefined();
    expect(recButton?.closest('a')).toBeNull();

    // Web source (has link)
    const webLink = container.querySelector('a[href="https://example.com"]');
    expect(webLink).not.toBeNull();
    expect(webLink?.textContent).toContain('Site');
  });
});
