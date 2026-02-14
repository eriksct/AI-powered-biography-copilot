// Supabase Edge Function: AI Rephrase text
// Deploy with: supabase functions deploy ai-rephrase

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { text, subjectName } = await req.json();

    if (!text) {
      return new Response(
        JSON.stringify({ error: 'text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `Vous êtes un assistant d'écriture biographique. L'utilisateur va vous donner un passage de biographie. Proposez exactement 3 reformulations différentes de ce texte.

Règles :
- Préservez le sens et les faits
- Gardez le ton et la voix du sujet
- Chaque version doit avoir un style légèrement différent (plus littéraire, plus concis, plus émotionnel)
- Répondez en JSON avec le format : { "options": ["version1", "version2", "version3"] }
${subjectName ? `Sujet de la biographie : ${subjectName}` : ''}`,
          },
          {
            role: 'user',
            content: text,
          },
        ],
        temperature: 0.8,
        max_tokens: 2048,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const content = JSON.parse(data.choices[0]?.message?.content || '{"options":[]}');

    return new Response(
      JSON.stringify(content),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('AI rephrase error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
