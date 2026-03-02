import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useProjects, useCreateProject, useUpdateProject, useDeleteProject } from '@/hooks/useProjects';
import { mockSupabase, mockFromResponse } from '@/test/mocks/supabase';
import { createMockProject, createMockUser } from '@/test/test-utils';
import { trackProjectCreated, trackProjectDeleted } from '@/lib/analytics';
import { ReactNode } from 'react';

// Mock useAuth to return a user
const mockUser = createMockUser();
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: mockUser, session: null, loading: false, signOut: vi.fn() }),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useProjects', () => {
  it('fetches projects for current user', async () => {
    const projects = [createMockProject(), createMockProject({ id: 'proj-2', title: 'Second' })];
    mockFromResponse(projects);

    const { result } = renderHook(() => useProjects(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockSupabase.from).toHaveBeenCalledWith('projects');
    expect(result.current.data).toEqual(projects);
  });

  it('does not fetch when user is null', async () => {
    // Temporarily override useAuth to return no user
    const authMock = await vi.importMock('@/contexts/AuthContext');
    (authMock as any).useAuth = () => ({ user: null, session: null, loading: false, signOut: vi.fn() });

    const { result } = renderHook(() => useProjects(), { wrapper: createWrapper() });

    // Query should not execute (enabled: !!user)
    expect(result.current.isFetching).toBe(false);

    // Restore
    (authMock as any).useAuth = () => ({ user: mockUser, session: null, loading: false, signOut: vi.fn() });
  });
});

describe('useCreateProject', () => {
  it('inserts a project and calls analytics', async () => {
    const newProject = createMockProject({ id: 'proj-new', title: 'New Project' });
    mockFromResponse(newProject);

    const { result } = renderHook(() => useCreateProject(), { wrapper: createWrapper() });

    result.current.mutate({ title: 'New Project', subject_name: 'Marie' });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockSupabase.from).toHaveBeenCalledWith('projects');
    expect(trackProjectCreated).toHaveBeenCalledWith('proj-new', true);
  });

  it('handles creation errors', async () => {
    mockFromResponse(null, { message: 'Insert failed' });

    const { result } = renderHook(() => useCreateProject(), { wrapper: createWrapper() });

    result.current.mutate({ title: 'Failing Project' });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

describe('useUpdateProject', () => {
  it('updates project title', async () => {
    const updated = createMockProject({ title: 'Updated Title' });
    mockFromResponse(updated);

    const { result } = renderHook(() => useUpdateProject(), { wrapper: createWrapper() });

    result.current.mutate({ projectId: 'proj-1', title: 'Updated Title' });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockSupabase.from).toHaveBeenCalledWith('projects');
  });
});

describe('useDeleteProject', () => {
  it('deletes a project and calls analytics', async () => {
    mockFromResponse(null);

    const { result } = renderHook(() => useDeleteProject(), { wrapper: createWrapper() });

    result.current.mutate('proj-1');

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockSupabase.from).toHaveBeenCalledWith('projects');
    expect(trackProjectDeleted).toHaveBeenCalledWith('proj-1');
  });

  it('handles delete errors', async () => {
    mockFromResponse(null, { message: 'Delete failed' });

    const { result } = renderHook(() => useDeleteProject(), { wrapper: createWrapper() });

    result.current.mutate('proj-1');

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});
