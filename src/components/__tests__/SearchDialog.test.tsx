/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchDialog } from '../SearchDialog';
import { renderWithProviders, createMockTranscriptSegment } from '@/test/test-utils';

// Mock transcript search results
let mockSearchResults: any[] | undefined = undefined;
let mockIsLoading = false;

vi.mock('@/hooks/useTranscript', () => ({
  useTranscriptSearch: () => ({
    data: mockSearchResults,
    isLoading: mockIsLoading,
  }),
}));

const mockTrackSearchUsed = vi.fn();
vi.mock('@/lib/analytics', () => ({
  trackSearchUsed: (...args: any[]) => mockTrackSearchUsed(...args),
}));

const mockOnOpenChange = vi.fn();
const mockOnSelectRecording = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  mockSearchResults = undefined;
  mockIsLoading = false;
});

describe('SearchDialog', () => {
  it('renders search input when open', () => {
    renderWithProviders(
      <SearchDialog
        interviewId="int-1"
        open={true}
        onOpenChange={mockOnOpenChange}
        onSelectRecording={mockOnSelectRecording}
      />
    );

    expect(screen.getByPlaceholderText(/Rechercher dans les transcripts/)).toBeInTheDocument();
  });

  it('shows minimum character message when query is short', () => {
    renderWithProviders(
      <SearchDialog
        interviewId="int-1"
        open={true}
        onOpenChange={mockOnOpenChange}
        onSelectRecording={mockOnSelectRecording}
      />
    );

    expect(screen.getByText(/au moins 2 caractères/)).toBeInTheDocument();
  });

  it('displays search results', async () => {
    mockSearchResults = [
      {
        ...createMockTranscriptSegment({ text: 'Bonjour Jean, comment allez-vous?' }),
        recordings: { id: 'rec-1', name: 'Entretien du mardi', interview_id: 'int-1' },
      },
    ];

    const user = userEvent.setup();
    renderWithProviders(
      <SearchDialog
        interviewId="int-1"
        open={true}
        onOpenChange={mockOnOpenChange}
        onSelectRecording={mockOnSelectRecording}
      />
    );

    // Type a search query
    const input = screen.getByPlaceholderText(/Rechercher dans les transcripts/);
    await user.type(input, 'Jean');

    await waitFor(() => {
      expect(screen.getByText('Entretien du mardi')).toBeInTheDocument();
      expect(screen.getByText('Bonjour Jean, comment allez-vous?')).toBeInTheDocument();
    });
  });

  it('shows no results message', async () => {
    mockSearchResults = [];

    const user = userEvent.setup();
    renderWithProviders(
      <SearchDialog
        interviewId="int-1"
        open={true}
        onOpenChange={mockOnOpenChange}
        onSelectRecording={mockOnSelectRecording}
      />
    );

    const input = screen.getByPlaceholderText(/Rechercher dans les transcripts/);
    await user.type(input, 'xyz');

    await waitFor(() => {
      expect(screen.getByText(/Aucun résultat/)).toBeInTheDocument();
    });
  });

  it('selects a result and tracks analytics', async () => {
    mockSearchResults = [
      {
        ...createMockTranscriptSegment({ text: 'Test result' }),
        recordings: { id: 'rec-1', name: 'Recording 1', interview_id: 'int-1' },
      },
    ];

    const user = userEvent.setup();
    renderWithProviders(
      <SearchDialog
        interviewId="int-1"
        open={true}
        onOpenChange={mockOnOpenChange}
        onSelectRecording={mockOnSelectRecording}
      />
    );

    const input = screen.getByPlaceholderText(/Rechercher dans les transcripts/);
    await user.type(input, 'Test');

    await waitFor(() => {
      expect(screen.getByText('Test result')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Test result'));

    expect(mockOnSelectRecording).toHaveBeenCalledWith('rec-1');
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    expect(mockTrackSearchUsed).toHaveBeenCalled();
  });

  it('shows loading state', () => {
    mockIsLoading = true;

    renderWithProviders(
      <SearchDialog
        interviewId="int-1"
        open={true}
        onOpenChange={mockOnOpenChange}
        onSelectRecording={mockOnSelectRecording}
      />
    );

    expect(screen.getByText('Recherche...')).toBeInTheDocument();
  });
});
