import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.95.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper: call Stripe REST API with fetch
async function stripePost(endpoint: string, params: Record<string, string>, stripeKey: string) {
  const res = await fetch(`https://api.stripe.com/v1${endpoint}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${stripeKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(params).toString(),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || `Stripe error ${res.status}`);
  }
  return data;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')?.trim();
    if (!stripeKey) throw new Error('STRIPE_SECRET_KEY not configured');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!.trim();
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!.trim();

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing authorization header');

    const anonClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!.trim());
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: { user }, error: authError } = await anonClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (authError || !user) throw new Error('Unauthorized');

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (profileError) throw profileError;
    if (!profile.stripe_customer_id) throw new Error('No Stripe customer found');

    const origin = req.headers.get('origin') || 'https://erikschjoth.github.io';

    const session = await stripePost('/billing_portal/sessions', {
      customer: profile.stripe_customer_id,
      return_url: `${origin}/settings`,
    }, stripeKey);

    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Portal session error:', msg);
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
