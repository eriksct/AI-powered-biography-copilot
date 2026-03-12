/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Header } from '../Header';
import { renderWithProviders } from '@/test/test-utils';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-123', email: 'test@example.com' },
    session: { access_token: 'token' },
    signOut: vi.fn(),
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Header breadcrumbs', () => {
  it('renders 2-level breadcrumb on ProjectInterviews page', () => {
    renderWithProviders(
      <Header
        breadcrumbs={[
          { label: 'Mes biographies', href: '/dashboard' },
          { label: 'Biographie de Marie' },
        ]}
      />
    );

    expect(screen.getByText('Mes biographies')).toBeInTheDocument();
    expect(screen.getByText('Biographie de Marie')).toBeInTheDocument();
  });

  it('renders 3-level breadcrumb on Interview page', () => {
    renderWithProviders(
      <Header
        breadcrumbs={[
          { label: 'Mes biographies', href: '/dashboard' },
          { label: 'Biographie de Marie', href: '/project/proj-1' },
          { label: 'Entretien 1 — Enfance et famille' },
        ]}
      />
    );

    expect(screen.getByText('Mes biographies')).toBeInTheDocument();
    expect(screen.getByText('Biographie de Marie')).toBeInTheDocument();
    expect(screen.getByText('Entretien 1 — Enfance et famille')).toBeInTheDocument();
  });

  it('clickable breadcrumb links navigate correctly', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <Header
        breadcrumbs={[
          { label: 'Mes biographies', href: '/dashboard' },
          { label: 'Biographie de Marie', href: '/project/proj-1' },
          { label: 'Entretien 1 — Enfance' },
        ]}
      />
    );

    // Click on "Mes biographies" link
    await user.click(screen.getByText('Mes biographies'));
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');

    // Click on "Biographie de Marie" link
    await user.click(screen.getByText('Biographie de Marie'));
    expect(mockNavigate).toHaveBeenCalledWith('/project/proj-1');
  });

  it('last breadcrumb item is not clickable', () => {
    renderWithProviders(
      <Header
        breadcrumbs={[
          { label: 'Mes biographies', href: '/dashboard' },
          { label: 'Entretien 1 — Enfance' },
        ]}
      />
    );

    const lastItem = screen.getByText('Entretien 1 — Enfance');
    // Last item should be a span, not a button
    expect(lastItem.tagName).toBe('SPAN');
    expect(lastItem).toHaveClass('font-medium');
  });

  it('shows search button when onSearchClick is provided', () => {
    const mockSearchClick = vi.fn();
    renderWithProviders(
      <Header
        breadcrumbs={[{ label: 'Test' }]}
        onSearchClick={mockSearchClick}
      />
    );

    expect(screen.getByText('Rechercher')).toBeInTheDocument();
  });

  it('hides search button when onSearchClick is not provided', () => {
    renderWithProviders(
      <Header breadcrumbs={[{ label: 'Test' }]} />
    );

    expect(screen.queryByText('Rechercher')).not.toBeInTheDocument();
  });
});
