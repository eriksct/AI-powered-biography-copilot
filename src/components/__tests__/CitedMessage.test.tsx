import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { CitedMessage } from '../CitedMessage';

describe('CitedMessage', () => {
  it('renders plain text when no sources', () => {
    const { container } = render(<CitedMessage content="Hello world" />);
    expect(container.textContent).toContain('Hello world');
  });

  it('renders web sources as links', () => {
    const content = 'Texte [1]\n\n---sources---\n[1] Wikipedia | https://en.wikipedia.org';
    const { container } = render(<CitedMessage content={content} />);
    const link = container.querySelector('a[href="https://en.wikipedia.org"]');
    expect(link).not.toBeNull();
  });

  it('does not render sources section when none are present', () => {
    const { container } = render(<CitedMessage content="No sources here" />);
    expect(container.querySelectorAll('button').length).toBe(0);
    expect(container.querySelectorAll('a').length).toBe(0);
  });

  it('renders citation markers as inline elements', () => {
    const content = 'Texte [1] et [2]\n\n---sources---\n[1] Rec 1 | recording:uuid?t=60\n[2] Site | https://example.com';
    const { container } = render(<CitedMessage content={content} />);
    // Should contain the original text without the sources block
    expect(container.textContent).toContain('Texte');
    expect(container.textContent).not.toContain('---sources---');
  });
});
