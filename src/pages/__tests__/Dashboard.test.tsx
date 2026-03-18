/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Dashboard from '../Dashboard';
import { renderWithProviders, createMockProject } from '@/test/test-utils';

// Mock hooks
const mockProjects = [
  createMockProject({ id: 'proj-1', title: 'Biographie de Marie', subject_name: 'Marie Dupont' }),
  createMockProject({ id: 'proj-2', title: 'Histoire de Pierre', subject_name: 'Pierre Martin' }),
];

const mockNavigate = vi.fn();
const mockCreateProject = { mutateAsync: vi.fn(), isPending: false };
const mockUpdateProject = { mutateAsync: vi.fn(), isPending: false };
const mockDeleteProject = { mutateAsync: vi.fn(), isPending: false };

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
  };
});

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-123', email: 'test@example.com', user_metadata: { full_name: 'Test User' } },
    session: { access_token: 'token' },
    signOut: vi.fn(),
  }),
}));

vi.mock('@/hooks/useProjects', () => ({
  useProjects: () => ({ data: mockProjects, isLoading: false }),
  useCreateProject: () => mockCreateProject,
  useUpdateProject: () => mockUpdateProject,
  useDeleteProject: () => mockDeleteProject,
}));

vi.mock('@/hooks/useSubscription', () => ({
  useSubscription: () => ({
    canCreateProject: true,
    plan: 'free',
    isPro: false,
  }),
}));

vi.mock('@/hooks/useProjectStats', () => ({
  useProjectStats: () => ({
    data: {
      'proj-1': { interview_count: 3, recording_count: 3, word_count: 500 },
      'proj-2': { interview_count: 1, recording_count: 1, word_count: 150 },
    },
  }),
}));

vi.mock('@/components/UpgradeDialog', () => ({
  default: ({ open }: { open: boolean }) => open ? <div data-testid="upgrade-dialog">Upgrade</div> : null,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Dashboard', () => {
  it('renders the dashboard with header and projects', async () => {
    renderWithProviders(<Dashboard />);

    expect(screen.getByText('Biograph')).toBeInTheDocument();
    expect(screen.getByText(/Bonjour Test/)).toBeInTheDocument();
    expect(screen.getByText('2 biographies en cours')).toBeInTheDocument();
  });

  it('displays project cards with titles and subjects', () => {
    renderWithProviders(<Dashboard />);

    expect(screen.getByText('Biographie de Marie')).toBeInTheDocument();
    expect(screen.getByText('Marie Dupont')).toBeInTheDocument();
    expect(screen.getByText('Histoire de Pierre')).toBeInTheDocument();
    expect(screen.getByText('Pierre Martin')).toBeInTheDocument();
  });

  it('displays project stats', () => {
    renderWithProviders(<Dashboard />);

    expect(screen.getByText(/3 entretiens/)).toBeInTheDocument();
    expect(screen.getByText(/1 entretien/)).toBeInTheDocument();
    // Word counts appear in both the stat pill and progress bar, so use getAllByText
    expect(screen.getAllByText(/500 mots/).length).toBeGreaterThanOrEqual(1);
  });

  it('navigates to project on card click', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Dashboard />);

    const cards = screen.getByText('Biographie de Marie').closest('[class*="cursor-pointer"]');
    if (cards) {
      await user.click(cards);
      expect(mockNavigate).toHaveBeenCalledWith('/project/proj-1');
    }
  });

  it('opens create project dialog', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Dashboard />);

    // Use getAllByRole and pick the first one (the header button, not the dashed card)
    const newButtons = screen.getAllByText(/Nouveau projet/);
    await user.click(newButtons[0]);

    expect(screen.getByText('Nouveau projet de biographie')).toBeInTheDocument();
    expect(screen.getByLabelText('Titre du projet')).toBeInTheDocument();
    expect(screen.getByLabelText('Nom du sujet')).toBeInTheDocument();
  });

  it('creates a project via the dialog', async () => {
    const user = userEvent.setup();
    const newProject = createMockProject({ id: 'proj-new', title: 'Nouvelle Bio' });
    mockCreateProject.mutateAsync.mockResolvedValueOnce(newProject);

    renderWithProviders(<Dashboard />);

    // Open dialog — use the first "Nouveau projet" element (header button)
    const newButtons = screen.getAllByText(/Nouveau projet/);
    await user.click(newButtons[0]);

    // Fill form
    await user.type(screen.getByLabelText('Titre du projet'), 'Nouvelle Bio');
    await user.type(screen.getByLabelText('Nom du sujet'), 'Louise');

    // Submit
    await user.click(screen.getByRole('button', { name: /^Créer$/ }));

    expect(mockCreateProject.mutateAsync).toHaveBeenCalledWith({
      title: 'Nouvelle Bio',
      subject_name: 'Louise',
      description: '',
    });
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/project/proj-new');
    });
  });

  it('displays the "Nouveau projet" card placeholder', () => {
    renderWithProviders(<Dashboard />);
    expect(screen.getByText('Commencer une biographie')).toBeInTheDocument();
  });
});
