/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import Interview from '../Interview';
import { renderWithProviders, createMockProject, createMockInterview } from '@/test/test-utils';

const mockProject = createMockProject({ id: 'proj-1', title: 'Biographie de Marie', subject_name: 'Marie Dupont' });
const mockInterview = createMockInterview({ id: 'int-1', number: 1, theme: 'Enfance et famille' });

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ projectId: 'proj-1', interviewId: 'int-1' }),
  };
});

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-123', email: 'test@example.com' },
    session: { access_token: 'token' },
    signOut: vi.fn(),
  }),
}));

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return {
    ...actual,
    useQuery: (options: any) => {
      if (options.queryKey[0] === 'project') {
        return { data: mockProject, isLoading: false };
      }
      return { data: undefined, isLoading: false };
    },
  };
});

vi.mock('@/hooks/useInterviews', () => ({
  useInterview: () => ({ data: mockInterview, isLoading: false }),
  useUpdateInterview: () => ({ mutateAsync: vi.fn() }),
}));

// Mock child components to isolate page tests
vi.mock('@/components/RecordingsList', () => ({
  RecordingsList: ({ interviewId }: { interviewId: string }) => (
    <div data-testid="recordings-list" data-interview-id={interviewId}>
      RecordingsList
    </div>
  ),
}));

vi.mock('@/components/TextEditor', () => ({
  TextEditor: ({ interviewId }: { interviewId: string }) => (
    <div data-testid="text-editor" data-interview-id={interviewId}>
      TextEditor
    </div>
  ),
}));

vi.mock('@/components/AIAssistant', () => ({
  AIAssistant: ({
    interviewId,
    subjectName,
    interviewTheme,
    interviewNumber,
  }: {
    interviewId: string;
    subjectName?: string;
    interviewTheme?: string;
    interviewNumber?: number;
  }) => (
    <div
      data-testid="ai-assistant"
      data-interview-id={interviewId}
      data-subject-name={subjectName}
      data-interview-theme={interviewTheme}
      data-interview-number={interviewNumber}
    >
      AIAssistant
    </div>
  ),
}));

vi.mock('@/components/SearchDialog', () => ({
  SearchDialog: ({ interviewId }: { interviewId: string }) => (
    <div data-testid="search-dialog" data-interview-id={interviewId}>
      SearchDialog
    </div>
  ),
}));

// Mock useIsMobile to return false (desktop)
vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => false,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Interview page', () => {
  it('renders the 3-column layout with child components', () => {
    renderWithProviders(<Interview />);

    expect(screen.getByTestId('recordings-list')).toBeInTheDocument();
    expect(screen.getByTestId('text-editor')).toBeInTheDocument();
    expect(screen.getByTestId('ai-assistant')).toBeInTheDocument();
  });

  it('passes interviewId to all child components', () => {
    renderWithProviders(<Interview />);

    expect(screen.getByTestId('recordings-list')).toHaveAttribute('data-interview-id', 'int-1');
    expect(screen.getByTestId('text-editor')).toHaveAttribute('data-interview-id', 'int-1');
    expect(screen.getByTestId('ai-assistant')).toHaveAttribute('data-interview-id', 'int-1');
  });

  it('passes subject name and interview context to AIAssistant', () => {
    renderWithProviders(<Interview />);

    const aiAssistant = screen.getByTestId('ai-assistant');
    expect(aiAssistant).toHaveAttribute('data-subject-name', 'Marie Dupont');
    expect(aiAssistant).toHaveAttribute('data-interview-theme', 'Enfance et famille');
    expect(aiAssistant).toHaveAttribute('data-interview-number', '1');
  });

  it('renders 3-level breadcrumb', () => {
    renderWithProviders(<Interview />);

    expect(screen.getByText('Mes biographies')).toBeInTheDocument();
    expect(screen.getByText('Biographie de Marie')).toBeInTheDocument();
    expect(screen.getByText(/Entretien 1/)).toBeInTheDocument();
  });

  it('passes interviewId to SearchDialog', () => {
    renderWithProviders(<Interview />);

    expect(screen.getByTestId('search-dialog')).toHaveAttribute('data-interview-id', 'int-1');
  });
});
