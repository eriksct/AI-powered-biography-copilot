import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.95.3';
import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    if (!stripeKey || !webhookSecret) throw new Error('Stripe keys not configured');

    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.text();
    const signature = req.headers.get('stripe-signature');
    if (!signature) throw new Error('Missing stripe-signature header');

    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id;
        if (!userId) {
          console.error('No supabase_user_id in session metadata');
          break;
        }

        const subscriptionId = session.subscription as string;

        await supabase
          .from('profiles')
          .update({
            plan: 'pro',
            subscription_id: subscriptionId,
            subscription_status: 'active',
            max_projects: 999,
            max_transcription_seconds: 54000,
          })
          .eq('id', userId);

        console.log(`User ${userId} upgraded to pro`);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.supabase_user_id;
        if (!userId) {
          console.error('No supabase_user_id in subscription metadata');
          break;
        }

        const status = subscription.status;

        if (status === 'active') {
          await supabase
            .from('profiles')
            .update({
              plan: 'pro',
              subscription_status: 'active',
              max_projects: 999,
              max_transcription_seconds: 54000,
            })
            .eq('id', userId);
        } else if (status === 'past_due') {
          await supabase
            .from('profiles')
            .update({ subscription_status: 'past_due' })
            .eq('id', userId);
        } else if (status === 'canceled' || status === 'unpaid') {
          await supabase
            .from('profiles')
            .update({
              plan: 'free',
              subscription_status: 'canceled',
              max_projects: 1,
              max_transcription_seconds: 7200,
            })
            .eq('id', userId);
        }

        console.log(`Subscription ${subscription.id} updated: ${status}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.supabase_user_id;
        if (!userId) {
          console.error('No supabase_user_id in subscription metadata');
          break;
        }

        await supabase
          .from('profiles')
          .update({
            plan: 'free',
            subscription_id: null,
            subscription_status: 'canceled',
            max_projects: 1,
            max_transcription_seconds: 7200,
          })
          .eq('id', userId);

        console.log(`User ${userId} subscription deleted, reverted to free`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
