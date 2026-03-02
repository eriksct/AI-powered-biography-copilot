/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useSubscription } from '../useSubscription';
import { createMockProfile, createMockProject, createTestQueryClient } from '@/test/test-utils';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

// Mock useAuth
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-123', email: 'test@example.com' },
    session: { access_token: 'token' },
  }),
}));

// Mock the underlying hooks that useSubscription composes
const mockProfileData = { data: createMockProfile(), isLoading: false };
const mockProjectsData = { data: [createMockProject()] };

vi.mock('../useProfile', () => ({
  useProfile: () => mockProfileData,
}));

vi.mock('../useProjects', () => ({
  useProjects: () => mockProjectsData,
}));

function createWrapper() {
  const queryClient = createTestQueryClient();
  return {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  };
}

describe('useSubscription', () => {
  it('returns free plan defaults', () => {
    mockProfileData.data = createMockProfile({ plan: 'free', max_projects: 1 });
    mockProjectsData.data = [createMockProject()];

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useSubscription(), { wrapper });

    expect(result.current.plan).toBe('free');
    expect(result.current.isPro).toBe(false);
    expect(result.current.canCreateProject).toBe(false); // 1 project, max 1
    expect(result.current.canTranscribe).toBe(true);
    expect(result.current.maxProjects).toBe(1);
  });

  it('allows project creation when under limit', () => {
    mockProfileData.data = createMockProfile({ plan: 'free', max_projects: 2 });
    mockProjectsData.data = [createMockProject()]; // 1 project, max 2

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useSubscription(), { wrapper });

    expect(result.current.canCreateProject).toBe(true);
  });

  it('returns pro plan features', () => {
    mockProfileData.data = createMockProfile({
      plan: 'pro',
      max_projects: 50,
      max_transcription_seconds: 36000,
    });
    mockProjectsData.data = [createMockProject()];

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useSubscription(), { wrapper });

    expect(result.current.plan).toBe('pro');
    expect(result.current.isPro).toBe(true);
    expect(result.current.canCreateProject).toBe(true);
    expect(result.current.maxTranscriptionSeconds).toBe(36000);
  });

  it('calculates transcription quota correctly', () => {
    mockProfileData.data = createMockProfile({
      transcription_seconds_used: 5000,
      max_transcription_seconds: 7200,
    });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useSubscription(), { wrapper });

    expect(result.current.transcriptionSecondsUsed).toBe(5000);
    expect(result.current.transcriptionSecondsRemaining).toBe(2200);
    expect(result.current.canTranscribe).toBe(true);
  });

  it('disables transcription when quota exhausted', () => {
    mockProfileData.data = createMockProfile({
      transcription_seconds_used: 7200,
      max_transcription_seconds: 7200,
    });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useSubscription(), { wrapper });

    expect(result.current.transcriptionSecondsRemaining).toBe(0);
    expect(result.current.canTranscribe).toBe(false);
  });

  it('returns project count', () => {
    mockProjectsData.data = [createMockProject(), createMockProject({ id: 'proj-2' })];

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useSubscription(), { wrapper });

    expect(result.current.projectCount).toBe(2);
  });
});
