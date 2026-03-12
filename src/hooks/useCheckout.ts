import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { trackCheckoutStarted } from '@/lib/analytics';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const ALLOWED_REDIRECT_DOMAINS = ['checkout.stripe.com', 'billing.stripe.com'];

function isAllowedRedirectUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && ALLOWED_REDIRECT_DOMAINS.some(
      (domain) => parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`),
    );
  } catch {
    return false;
  }
}

async function callEdgeFunction(fnName: string, body: Record<string, unknown>) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const res = await fetch(`${SUPABASE_URL}/functions/v1/${fnName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      'apikey': ANON_KEY,
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();

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
      trackCheckoutStarted(priceId);
      const data = await callEdgeFunction('create-checkout-session', { priceId });
      if (data?.url) {
        if (!isAllowedRedirectUrl(data.url)) {
          throw new Error('Redirect blocked: untrusted domain');
        }
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
        if (!isAllowedRedirectUrl(data.url)) {
          throw new Error('Redirect blocked: untrusted domain');
        }
        window.location.href = data.url;
      } else {
        throw new Error('No portal URL returned');
      }
    },
  });
}
