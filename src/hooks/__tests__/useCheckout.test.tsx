import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCheckout, usePortalSession } from '@/hooks/useCheckout';
import { mockSupabaseAuth } from '@/test/mocks/supabase';
import { createMockSession } from '@/test/test-utils';
import { trackCheckoutStarted } from '@/lib/analytics';
import { ReactNode } from 'react';

// Mock env vars
vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key');

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useCheckout', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('calls create-checkout-session with correct headers', async () => {
    const session = createMockSession();
    mockSupabaseAuth.getSession.mockResolvedValue({ data: { session } });

    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify({ url: 'https://checkout.stripe.com/pay' })),
    });

    const { result } = renderHook(() => useCheckout(), { wrapper: createWrapper() });

    result.current.mutate('price_abc');

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/functions/v1/create-checkout-session'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': `Bearer ${session.access_token}`,
          }),
          body: JSON.stringify({ priceId: 'price_abc' }),
        }),
      );
    });
  });

  it('redirects to checkout URL on success', async () => {
    const session = createMockSession();
    mockSupabaseAuth.getSession.mockResolvedValue({ data: { session } });

    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify({ url: 'https://checkout.stripe.com/pay' })),
    });

    const { result } = renderHook(() => useCheckout(), { wrapper: createWrapper() });

    result.current.mutate('price_abc');

    await waitFor(() => {
      expect(window.location.href).toBe('https://checkout.stripe.com/pay');
    });
  });

  it('tracks checkout event with priceId', async () => {
    const session = createMockSession();
    mockSupabaseAuth.getSession.mockResolvedValue({ data: { session } });

    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify({ url: 'https://checkout.stripe.com/pay' })),
    });

    const { result } = renderHook(() => useCheckout(), { wrapper: createWrapper() });

    result.current.mutate('price_monthly');

    await waitFor(() => {
      expect(trackCheckoutStarted).toHaveBeenCalledWith('price_monthly');
    });
  });

  it('throws when not authenticated', async () => {
    mockSupabaseAuth.getSession.mockResolvedValue({ data: { session: null } });

    const { result } = renderHook(() => useCheckout(), { wrapper: createWrapper() });

    result.current.mutate('price_abc');

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
      expect(result.current.error?.message).toBe('Not authenticated');
    });
  });

  it('throws when no checkout URL returned', async () => {
    const session = createMockSession();
    mockSupabaseAuth.getSession.mockResolvedValue({ data: { session } });

    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify({})),  // No url field
    });

    const { result } = renderHook(() => useCheckout(), { wrapper: createWrapper() });

    result.current.mutate('price_abc');

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
      expect(result.current.error?.message).toBe('No checkout URL returned');
    });
  });

  it('handles invalid JSON response', async () => {
    const session = createMockSession();
    mockSupabaseAuth.getSession.mockResolvedValue({ data: { session } });

    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve('not json'),
    });

    const { result } = renderHook(() => useCheckout(), { wrapper: createWrapper() });

    result.current.mutate('price_abc');

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

describe('usePortalSession', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('calls create-portal-session and redirects', async () => {
    const session = createMockSession();
    mockSupabaseAuth.getSession.mockResolvedValue({ data: { session } });

    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify({ url: 'https://billing.stripe.com/portal' })),
    });

    const { result } = renderHook(() => usePortalSession(), { wrapper: createWrapper() });

    result.current.mutate();

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('create-portal-session'),
        expect.any(Object),
      );
      expect(window.location.href).toBe('https://billing.stripe.com/portal');
    });
  });

  it('throws when no portal URL returned', async () => {
    const session = createMockSession();
    mockSupabaseAuth.getSession.mockResolvedValue({ data: { session } });

    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify({})),
    });

    const { result } = renderHook(() => usePortalSession(), { wrapper: createWrapper() });

    result.current.mutate();

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
      expect(result.current.error?.message).toBe('No portal URL returned');
    });
  });
});
