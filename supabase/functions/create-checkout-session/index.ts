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
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!.trim();

    // Get user from JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing authorization header');

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    const anonClient = createClient(supabaseUrl, supabaseAnonKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await anonClient.auth.getUser(token);

    if (authError) {
      console.error('Auth error:', authError.message);
      throw new Error(`Auth failed: ${authError.message}`);
    }
    if (!user) throw new Error('No user found');

    const { priceId } = await req.json();
    console.log('Received priceId:', priceId);
    if (!priceId) throw new Error('priceId is required');

    // Get or create Stripe customer
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('stripe_customer_id, email')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Profile error:', profileError.message);
      throw profileError;
    }

    let customerId = profile.stripe_customer_id;
    console.log('Existing customerId:', customerId);

    if (!customerId) {
      const email = profile.email || user.email || '';
      console.log('Creating Stripe customer for:', email);
      const customer = await stripePost('/customers', {
        email,
        'metadata[supabase_user_id]': user.id,
      }, stripeKey);
      customerId = customer.id;
      console.log('Created customer:', customerId);

      await supabaseClient
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
    }

    // Determine site URL for redirects
    const origin = req.headers.get('origin') || 'https://erikschjoth.github.io';

    console.log('Creating checkout session with price:', priceId, 'customer:', customerId, 'origin:', origin);

    const session = await stripePost('/checkout/sessions', {
      customer: customerId!,
      'line_items[0][price]': priceId,
      'line_items[0][quantity]': '1',
      mode: 'subscription',
      success_url: `${origin}/dashboard?checkout=success`,
      cancel_url: `${origin}/dashboard?checkout=cancel`,
      'metadata[supabase_user_id]': user.id,
      'subscription_data[metadata][supabase_user_id]': user.id,
    }, stripeKey);

    console.log('Session created, URL:', session.url);

    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Checkout session error:', msg);
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
