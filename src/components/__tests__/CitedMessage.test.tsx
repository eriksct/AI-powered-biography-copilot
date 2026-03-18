import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CitedMessage } from '../CitedMessage';

describe('CitedMessage', () => {
  it('renders plain text when no sources', () => {
    render(<CitedMessage content="Hello world" />);
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('renders web sources as links with source title', () => {
    const content = 'Texte [1]\n\n---sources---\n[1] Wikipedia | https://en.wikipedia.org';
    render(<CitedMessage content={content} />);
    const link = screen.getByText('Wikipedia');
    expect(link.closest('a')).toHaveAttribute('href', 'https://en.wikipedia.org');
  });

  it('renders recording sources as clickable buttons with recording name', () => {
    const content = 'Texte [1]\n\n---sources---\n[1] Rec 1 — 2:30 | recording:uuid-123?t=150';
    render(<CitedMessage content={content} />);
    // Recording badge should show the recording name (before the " — ") as a button
    const badge = screen.getByRole('button', { name: 'Rec 1' });
    expect(badge).toBeInTheDocument();
    expect(badge.tagName).toBe('BUTTON');
  });

  it('renders inline citation pill for recording sources', () => {
    const content = 'Il est né en 1940 [1]\n\n---sources---\n[1] Rec 1 — 0:45 | recording:uuid?t=45';
    const { container } = render(<CitedMessage content={content} />);
    // The inline badge for recording should be a button with title
    const badge = container.querySelector('button[title="Rec 1 — 0:45"]');
    expect(badge).not.toBeNull();
    expect(badge?.textContent).toBe('Rec 1');
  });

  it('renders mixed web and recording sources correctly', () => {
    const content = 'Texte [1] et [2]\n\n---sources---\n[1] Rec 1 — 1:00 | recording:uuid?t=60\n[2] Site | https://example.com';
    render(<CitedMessage content={content} />);
    // Recording source (button, not a link)
    const recBadge = screen.getByRole('button', { name: 'Rec 1' });
    expect(recBadge.closest('a')).toBeNull();
    // Web source (has link)
    expect(screen.getByText('Site').closest('a')).toHaveAttribute('href', 'https://example.com');
  });
});
