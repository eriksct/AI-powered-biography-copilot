import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Auth from '@/pages/Auth';
import { mockSupabaseAuth } from '@/test/mocks/supabase';
import { renderWithProviders } from '@/test/test-utils';
import { toast } from 'sonner';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
  Toaster: () => null,
}));

// Mock react-router-dom navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Auth page', () => {
  it('renders login form by default', () => {
    renderWithProviders(<Auth />);

    expect(screen.getByText('Connectez-vous à votre compte')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Mot de passe')).toBeInTheDocument();
    // Full name field should NOT be visible in login mode
    expect(screen.queryByLabelText('Nom complet')).not.toBeInTheDocument();
  });

  it('shows signup form when mode=signup in URL', () => {
    renderWithProviders(<Auth />, { initialRoute: '/auth?mode=signup' });

    expect(screen.getByText('Créez votre compte')).toBeInTheDocument();
    expect(screen.getByLabelText('Nom complet')).toBeInTheDocument();
  });

  it('toggles between login and signup', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Auth />);

    // Start in login mode
    expect(screen.getByText('Connectez-vous à votre compte')).toBeInTheDocument();

    // Click toggle
    await user.click(screen.getByText("Pas encore de compte ? S'inscrire"));

    // Now in signup mode
    expect(screen.getByText('Créez votre compte')).toBeInTheDocument();
    expect(screen.getByLabelText('Nom complet')).toBeInTheDocument();
  });

  it('calls signInWithPassword on login submit', async () => {
    const user = userEvent.setup();
    mockSupabaseAuth.signInWithPassword.mockResolvedValue({ data: {}, error: null });

    renderWithProviders(<Auth />);

    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Mot de passe'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Se connecter' }));

    await waitFor(() => {
      expect(mockSupabaseAuth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  it('navigates to /dashboard on successful login', async () => {
    const user = userEvent.setup();
    mockSupabaseAuth.signInWithPassword.mockResolvedValue({ data: {}, error: null });

    renderWithProviders(<Auth />);

    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Mot de passe'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Se connecter' }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('calls signUp on signup submit', async () => {
    const user = userEvent.setup();
    mockSupabaseAuth.signUp.mockResolvedValue({ data: {}, error: null });

    renderWithProviders(<Auth />, { initialRoute: '/auth?mode=signup' });

    await user.type(screen.getByLabelText('Nom complet'), 'Jean Dupont');
    await user.type(screen.getByLabelText('Email'), 'jean@example.com');
    await user.type(screen.getByLabelText('Mot de passe'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Créer un compte' }));

    await waitFor(() => {
      expect(mockSupabaseAuth.signUp).toHaveBeenCalledWith({
        email: 'jean@example.com',
        password: 'password123',
        options: { data: { full_name: 'Jean Dupont' } },
      });
    });
  });

  it('shows success toast on signup', async () => {
    const user = userEvent.setup();
    mockSupabaseAuth.signUp.mockResolvedValue({ data: {}, error: null });

    renderWithProviders(<Auth />, { initialRoute: '/auth?mode=signup' });

    await user.type(screen.getByLabelText('Nom complet'), 'Jean Dupont');
    await user.type(screen.getByLabelText('Email'), 'jean@example.com');
    await user.type(screen.getByLabelText('Mot de passe'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Créer un compte' }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalled();
    });
  });

  it('shows error toast on auth failure', async () => {
    const user = userEvent.setup();
    mockSupabaseAuth.signInWithPassword.mockResolvedValue({
      data: {},
      error: { message: 'Invalid credentials' },
    });

    renderWithProviders(<Auth />);

    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Mot de passe'), 'wrong');
    await user.click(screen.getByRole('button', { name: 'Se connecter' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Invalid credentials');
    });
  });
});
