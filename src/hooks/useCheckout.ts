import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { trackCheckoutStarted } from '@/lib/analytics';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

async function callEdgeFunction(fnName: string, body: Record<string, unknown>) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  console.log(`[callEdgeFunction] Calling ${fnName}...`);

  let res: Response;
  try {
    res = await fetch(`${SUPABASE_URL}/functions/v1/${fnName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': ANON_KEY,
      },
      body: JSON.stringify(body),
    });
  } catch (fetchErr) {
    console.error(`[callEdgeFunction] Fetch failed:`, fetchErr);
    throw fetchErr;
  }

  console.log(`[callEdgeFunction] Status: ${res.status}`);

  const text = await res.text();
  console.log(`[callEdgeFunction] Raw response:`, text);

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Invalid JSON response: ${text.slice(0, 200)}`);
  }

  if (data.error) throw new Error(data.error);
  return data;
}

export function useCheckout() {
  return useMutation({
    mutationFn: async (priceId: string) => {
      console.log('[useCheckout] Invoking with priceId:', priceId);
      trackCheckoutStarted(priceId);
      const data = await callEdgeFunction('create-checkout-session', { priceId });
      console.log('[useCheckout] Success, URL:', data.url);
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
