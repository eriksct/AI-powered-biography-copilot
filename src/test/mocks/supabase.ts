/* eslint-disable @typescript-eslint/no-explicit-any */
import { vi } from 'vitest';

// Chainable PostgREST query builder mock
function createQueryBuilder(resolvedValue: { data: any; error: any } = { data: [], error: null }) {
  const builder: any = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(resolvedValue),
    maybeSingle: vi.fn().mockResolvedValue(resolvedValue),
    then: vi.fn((resolve) => resolve(resolvedValue)),
  };

  // Make the builder itself thenable so `await supabase.from('x').select()` works
  builder.select.mockReturnValue(builder);
  builder.insert.mockReturnValue(builder);
  builder.update.mockReturnValue(builder);
  builder.delete.mockReturnValue(builder);
  builder.eq.mockReturnValue(builder);
  builder.neq.mockReturnValue(builder);
  builder.in.mockReturnValue(builder);
  builder.ilike.mockReturnValue(builder);
  builder.order.mockReturnValue(builder);
  builder.limit.mockReturnValue(builder);

  // Allow await on the builder directly
  builder[Symbol.for('jest.asymmetricMatch')] = undefined;
  Object.defineProperty(builder, 'then', {
    value: (onFulfilled: any) => Promise.resolve(resolvedValue).then(onFulfilled),
    configurable: true,
  });

  return builder;
}

// Auth state change callback holder
let authStateCallback: ((event: string, session: any) => void) | null = null;

export const mockSupabaseAuth = {
  getSession: vi.fn().mockResolvedValue({
    data: { session: null },
  }),
  signInWithPassword: vi.fn().mockResolvedValue({ data: {}, error: null }),
  signUp: vi.fn().mockResolvedValue({ data: {}, error: null }),
  signOut: vi.fn().mockResolvedValue({ error: null }),
  onAuthStateChange: vi.fn((callback) => {
    authStateCallback = callback;
    return {
      data: {
        subscription: { unsubscribe: vi.fn() },
      },
    };
  }),
};

// Helper to trigger auth state changes in tests
export function triggerAuthStateChange(event: string, session: any) {
  if (authStateCallback) {
    authStateCallback(event, session);
  }
}

export const mockQueryBuilder = createQueryBuilder();

// Storage mock
const mockStorageBucket = {
  upload: vi.fn().mockResolvedValue({ data: { path: 'test-path' }, error: null }),
  remove: vi.fn().mockResolvedValue({ data: [], error: null }),
  createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: 'https://example.com/signed-url' }, error: null }),
  getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/public-url' } }),
};

export const mockSupabase = {
  auth: mockSupabaseAuth,
  from: vi.fn().mockReturnValue(mockQueryBuilder),
  storage: {
    from: vi.fn().mockReturnValue(mockStorageBucket),
  },
  functions: {
    invoke: vi.fn().mockResolvedValue({ data: null, error: null }),
  },
};

export { mockStorageBucket };

// Helper to configure from().select()... to resolve with specific data
export function mockFromResponse(data: any, error: any = null) {
  const builder = createQueryBuilder({ data, error });
  mockSupabase.from.mockReturnValue(builder);
  return builder;
}

// Helper to configure from().insert().select().single() result
export function mockInsertResponse(data: any, error: any = null) {
  const builder = createQueryBuilder({ data, error });
  mockSupabase.from.mockReturnValue(builder);
  return builder;
}

// Helper to configure sequential from() calls with different responses
export function mockFromSequence(responses: Array<{ data: any; error?: any }>) {
  let callIndex = 0;
  mockSupabase.from.mockImplementation(() => {
    const response = responses[callIndex] || responses[responses.length - 1];
    callIndex++;
    return createQueryBuilder({ data: response.data, error: response.error ?? null });
  });
}

export function resetSupabaseMocks() {
  authStateCallback = null;
  mockSupabaseAuth.getSession.mockResolvedValue({ data: { session: null } });
  mockSupabaseAuth.signInWithPassword.mockResolvedValue({ data: {}, error: null });
  mockSupabaseAuth.signUp.mockResolvedValue({ data: {}, error: null });
  mockSupabaseAuth.signOut.mockResolvedValue({ error: null });
  mockSupabase.from.mockReturnValue(createQueryBuilder());
  mockStorageBucket.upload.mockResolvedValue({ data: { path: 'test-path' }, error: null });
  mockStorageBucket.remove.mockResolvedValue({ data: [], error: null });
  mockStorageBucket.createSignedUrl.mockResolvedValue({ data: { signedUrl: 'https://example.com/signed-url' }, error: null });
  mockStorageBucket.getPublicUrl.mockReturnValue({ data: { publicUrl: 'https://example.com/public-url' } });
  mockSupabase.storage.from.mockReturnValue(mockStorageBucket);
  mockSupabase.functions.invoke.mockResolvedValue({ data: null, error: null });
}
