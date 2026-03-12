import "@testing-library/jest-dom";
import { vi } from "vitest";
import { mockSupabase, resetSupabaseMocks } from "./mocks/supabase";

// ─── Global Mocks ────────────────────────────────────────────────

// Mock Supabase client
vi.mock("@/lib/supabase", () => ({
  supabase: mockSupabase,
  supabaseConfigured: true,
}));

// Mock analytics (all functions are no-ops in tests)
vi.mock("@/lib/analytics", () => ({
  identifyUser: vi.fn(),
  resetUser: vi.fn(),
  updateUserPlan: vi.fn(),
  trackSignupCompleted: vi.fn(),
  trackLogin: vi.fn(),
  trackProjectCreated: vi.fn(),
  trackProjectDeleted: vi.fn(),
  trackInterviewCreated: vi.fn(),
  trackInterviewDeleted: vi.fn(),
  trackRecordingStarted: vi.fn(),
  trackRecordingCompleted: vi.fn(),
  trackTranscriptionCompleted: vi.fn(),
  trackSearchUsed: vi.fn(),
  trackAIChatSent: vi.fn(),
  track500WordsWritten: vi.fn(),
  trackDocumentExported: vi.fn(),
  trackUpgradeDialogShown: vi.fn(),
  trackCheckoutStarted: vi.fn(),
  trackSubscriptionActive: vi.fn(),
}));

// ─── Browser API Mocks ──────────────────────────────────────────

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// Mock window.location for redirect tests
const locationMock = {
  ...window.location,
  href: "",
  assign: vi.fn(),
  replace: vi.fn(),
};
Object.defineProperty(window, "location", {
  writable: true,
  value: locationMock,
});

// ─── Reset Between Tests ─────────────────────────────────────────

beforeEach(() => {
  resetSupabaseMocks();
  window.location.href = "";
  vi.clearAllMocks();
});
