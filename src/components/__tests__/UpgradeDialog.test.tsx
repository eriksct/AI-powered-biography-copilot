/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import UpgradeDialog from '../UpgradeDialog';
import { renderWithProviders } from '@/test/test-utils';

// Mock useCheckout
vi.mock('@/hooks/useCheckout', () => ({
  useCheckout: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('UpgradeDialog', () => {
  it('shows project limit message when reason is projects', () => {
    renderWithProviders(
      <UpgradeDialog open={true} onOpenChange={vi.fn()} reason="projects" />
    );

    expect(screen.getByText(/limite de 1 projet/)).toBeInTheDocument();
  });

  it('shows transcription limit message when reason is transcription', () => {
    renderWithProviders(
      <UpgradeDialog open={true} onOpenChange={vi.fn()} reason="transcription" />
    );

    expect(screen.getByText(/2 heures de transcription/)).toBeInTheDocument();
  });

  it('shows interview limit message when reason is interview_limit', () => {
    renderWithProviders(
      <UpgradeDialog open={true} onOpenChange={vi.fn()} reason="interview_limit" />
    );

    expect(screen.getByText(/limite de 2 entretiens par projet/)).toBeInTheDocument();
  });

  it('shows generic message when no reason is provided', () => {
    renderWithProviders(
      <UpgradeDialog open={true} onOpenChange={vi.fn()} />
    );

    expect(screen.getByText(/Débloquez toutes les fonctionnalités/)).toBeInTheDocument();
  });

  it('displays Pro features', () => {
    renderWithProviders(
      <UpgradeDialog open={true} onOpenChange={vi.fn()} />
    );

    expect(screen.getByText('Biographies illimitées')).toBeInTheDocument();
    expect(screen.getByText('Assistant IA illimité')).toBeInTheDocument();
  });

  it('shows upgrade button with price', () => {
    renderWithProviders(
      <UpgradeDialog open={true} onOpenChange={vi.fn()} />
    );

    expect(screen.getByText('69€ / mois')).toBeInTheDocument();
  });
});
