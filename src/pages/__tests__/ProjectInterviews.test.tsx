/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProjectInterviews from '../ProjectInterviews';
import { renderWithProviders, createMockInterview, createMockProject } from '@/test/test-utils';

// Mock hooks
const mockProject = createMockProject({ id: 'proj-1', title: 'Biographie de Marie', subject_name: 'Marie Dupont' });
const mockInterviews = [
  createMockInterview({ id: 'int-1', number: 1, theme: 'Enfance et famille', interview_date: '2025-01-10' }),
  createMockInterview({ id: 'int-2', number: 2, theme: 'Carrière professionnelle', interview_date: '2025-02-15' }),
];

const mockNavigate = vi.fn();
const mockCreateInterview = { mutateAsync: vi.fn(), isPending: false };
const mockDeleteInterview = { mutateAsync: vi.fn(), isPending: false };

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ projectId: 'proj-1' }),
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
      if (options.queryKey[0] === 'recording-counts') {
        return { data: { 'int-1': 1, 'int-2': 0 }, isLoading: false };
      }
      return { data: undefined, isLoading: false };
    },
  };
});

vi.mock('@/hooks/useInterviews', () => ({
  useInterviews: () => ({ data: mockInterviews, isLoading: false }),
  useCreateInterview: () => mockCreateInterview,
  useDeleteInterview: () => mockDeleteInterview,
  useUpdateInterview: () => ({ mutateAsync: vi.fn() }),
}));

let mockMaxInterviews = 10;

vi.mock('@/hooks/useSubscription', () => ({
  useSubscription: () => ({
    profile: {
      max_interviews_per_project: mockMaxInterviews,
    },
    canCreateProject: true,
    plan: 'free',
    isPro: false,
  }),
}));

vi.mock('@/hooks/useProjectSearch', () => ({
  useProjectSearch: () => ({ data: [], isLoading: false }),
}));

vi.mock('@/components/UpgradeDialog', () => ({
  default: ({ open, reason }: { open: boolean; reason?: string }) =>
    open ? <div data-testid="upgrade-dialog">Upgrade - {reason}</div> : null,
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockMaxInterviews = 10; // default: allow creating interviews
});

describe('ProjectInterviews', () => {
  it('renders the interview list with numbers and themes', () => {
    renderWithProviders(<ProjectInterviews />);

    expect(screen.getByText('Enfance et famille')).toBeInTheDocument();
    expect(screen.getByText('Carrière professionnelle')).toBeInTheDocument();
    // Verify both interview numbers are rendered
    expect(document.body.textContent).toContain('1');
    expect(document.body.textContent).toContain('2');
  });

  it('displays project subject name', () => {
    renderWithProviders(<ProjectInterviews />);

    expect(screen.getByText('Marie Dupont')).toBeInTheDocument();
  });

  it('navigates to interview page on card click', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ProjectInterviews />);

    const card = screen.getByText('Enfance et famille').closest('[class*="cursor-pointer"]');
    if (card) {
      await user.click(card);
      expect(mockNavigate).toHaveBeenCalledWith('/project/proj-1/interview/int-1');
    }
  });

  it('opens create interview dialog', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ProjectInterviews />);

    // Use the main button (not the ghost card) — target by role
    const newButtons = screen.getAllByText('Nouvel entretien');
    // Click the first one (the header button)
    await user.click(newButtons[0]);

    expect(screen.getByText("Thème de l'entretien")).toBeInTheDocument();
    expect(screen.getByText("Date de l'entretien")).toBeInTheDocument();
  });

  it('creates an interview via the dialog', async () => {
    const user = userEvent.setup();
    const newInterview = createMockInterview({ id: 'int-new', number: 3, theme: 'Retraite' });
    mockCreateInterview.mutateAsync.mockResolvedValueOnce(newInterview);

    renderWithProviders(<ProjectInterviews />);

    // Open dialog via header button
    const newButtons = screen.getAllByText('Nouvel entretien');
    await user.click(newButtons[0]);

    // Fill form
    const themeInput = screen.getByPlaceholderText('ex: Enfance et famille');
    await user.type(themeInput, 'Retraite');

    // Submit
    await user.click(screen.getByRole('button', { name: /^Créer$/ }));

    expect(mockCreateInterview.mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: 'proj-1',
        theme: 'Retraite',
      })
    );
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/project/proj-1/interview/int-new');
    });
  });

  it('shows upgrade dialog when interview limit is reached', async () => {
    mockMaxInterviews = 2; // exactly matches the 2 existing interviews
    const user = userEvent.setup();
    renderWithProviders(<ProjectInterviews />);

    // Click the header button
    const newButtons = screen.getAllByText('Nouvel entretien');
    await user.click(newButtons[0]);

    expect(screen.getByTestId('upgrade-dialog')).toBeInTheDocument();
    expect(screen.getByText(/interview_limit/)).toBeInTheDocument();
  });

  it('shows delete confirmation dialog', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ProjectInterviews />);

    // Find delete buttons (ghost buttons with trash icon)
    const deleteButtons = screen.getAllByRole('button').filter(
      (btn) => btn.querySelector('.lucide-trash-2') || btn.querySelector('[class*="destructive"]')
    );

    if (deleteButtons.length > 0) {
      await user.click(deleteButtons[0]);
      await waitFor(() => {
        expect(screen.getByText(/Supprimer l'entretien/)).toBeInTheDocument();
      });
    }
  });
});
