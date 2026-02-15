import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useCheckout() {
  return useMutation({
    mutationFn: async (priceId: string) => {
      console.log('[useCheckout] Invoking with priceId:', priceId);
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { priceId },
      });
      console.log('[useCheckout] Response data:', data, 'error:', error);
      if (error) {
        console.error('[useCheckout] Function error:', error);
        throw error;
      }
      if (data?.error) {
        console.error('[useCheckout] Server error:', data.error);
        throw new Error(data.error);
      }
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
      const { data, error } = await supabase.functions.invoke('create-portal-session', {
        body: {},
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No portal URL returned');
      }
    },
  });
}
