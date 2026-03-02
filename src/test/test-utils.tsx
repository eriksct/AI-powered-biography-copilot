import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { ReactElement, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { Project, Recording, TranscriptSegment, Document, ChatThread, Message, Profile } from '@/types/biography';

// ─── Mock Data Factories ─────────────────────────────────────────

export function createMockUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-123',
    email: 'test@example.com',
    app_metadata: {},
    user_metadata: { full_name: 'Test User' },
    aud: 'authenticated',
    created_at: '2025-01-01T00:00:00Z',
    ...overrides,
  } as User;
}

export function createMockSession(overrides: Partial<Session> = {}): Session {
  const user = createMockUser(overrides.user as any);
  return {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    expires_in: 3600,
    expires_at: Date.now() / 1000 + 3600,
    token_type: 'bearer',
    user,
    ...overrides,
  } as Session;
}

export function createMockProject(overrides: Partial<Project> = {}): Project {
  return {
    id: 'proj-1',
    user_id: 'user-123',
    title: 'Test Biography',
    description: 'A test project',
    subject_name: 'Jean Dupont',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-15T00:00:00Z',
    ...overrides,
  };
}

export function createMockRecording(overrides: Partial<Recording> = {}): Recording {
  return {
    id: 'rec-1',
    project_id: 'proj-1',
    user_id: 'user-123',
    name: 'Entretien 1',
    audio_path: 'user-123/proj-1/audio-file.webm',
    duration_seconds: 120,
    file_size_bytes: 1024000,
    transcription_status: 'completed',
    created_at: '2025-01-10T00:00:00Z',
    updated_at: '2025-01-10T00:00:00Z',
    ...overrides,
  };
}

export function createMockTranscriptSegment(overrides: Partial<TranscriptSegment> = {}): TranscriptSegment {
  return {
    id: 'seg-1',
    recording_id: 'rec-1',
    segment_index: 0,
    start_time: 0,
    end_time: 5.5,
    text: 'Bonjour, je suis Jean Dupont.',
    speaker_label: 'Speaker 1',
    confidence: 0.95,
    created_at: '2025-01-10T00:00:00Z',
    ...overrides,
  };
}

export function createMockDocument(overrides: Partial<Document> = {}): Document {
  return {
    id: 'doc-1',
    project_id: 'proj-1',
    user_id: 'user-123',
    title: 'Sans titre',
    content: { type: 'doc', content: [] },
    created_at: '2025-01-10T00:00:00Z',
    updated_at: '2025-01-10T00:00:00Z',
    ...overrides,
  };
}

export function createMockChatThread(overrides: Partial<ChatThread> = {}): ChatThread {
  return {
    id: 'thread-1',
    project_id: 'proj-1',
    user_id: 'user-123',
    title: 'Nouvelle discussion',
    created_at: '2025-01-10T00:00:00Z',
    updated_at: '2025-01-10T00:00:00Z',
    ...overrides,
  };
}

export function createMockMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: 'msg-1',
    chat_thread_id: 'thread-1',
    role: 'user',
    content: 'Bonjour, aide-moi à écrire la biographie.',
    created_at: '2025-01-10T00:00:00Z',
    ...overrides,
  };
}

export function createMockProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: 'user-123',
    email: 'test@example.com',
    full_name: 'Test User',
    plan: 'free',
    subscription_status: 'none',
    transcription_seconds_used: 0,
    max_projects: 1,
    max_transcription_seconds: 7200,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

// ─── Test Query Client ───────────────────────────────────────────

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

// ─── Custom Render ───────────────────────────────────────────────

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialRoute?: string;
  queryClient?: QueryClient;
}

export function renderWithProviders(
  ui: ReactElement,
  options: CustomRenderOptions = {},
) {
  const {
    initialRoute = '/',
    queryClient = createTestQueryClient(),
    ...renderOptions
  } = options;

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[initialRoute]}>
          {children}
        </MemoryRouter>
      </QueryClientProvider>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
  };
}
