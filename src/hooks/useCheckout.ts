import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

async function callEdgeFunction(fnName: string, body: Record<string, unknown>) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const res = await fetch(`${SUPABASE_URL}/functions/v1/${fnName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  if (data.error) throw new Error(data.error);
  return data;
}

export function useCheckout() {
  return useMutation({
    mutationFn: async (priceId: string) => {
      console.log('[useCheckout] Invoking with priceId:', priceId);
      const data = await callEdgeFunction('create-checkout-session', { priceId });
      console.log('[useCheckout] Response:', data);
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    },
  });
}

export function usePortalSession() {
  return useMutation({
    mutationFn: async () => {
      const data = await callEdgeFunction('create-portal-session', {});
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No portal URL returned');
      }
    },
  });
}
