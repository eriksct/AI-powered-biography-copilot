// Supabase Edge Function: Convert transcript to narrative prose
// Deploy with: supabase functions deploy ai-to-prose

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
    const { transcriptText, subjectName } = await req.json();

    if (!transcriptText) {
      return new Response(
        JSON.stringify({ error: 'transcriptText is required' }),
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
            content: `Vous êtes un écrivain biographique professionnel. L'utilisateur va vous donner un extrait de transcript d'entretien oral. Transformez-le en prose narrative biographique.

Règles :
- Convertissez la première personne ("je") en troisième personne ("il/elle")
- Gardez l'authenticité et l'émotion du récit
- Structurez le texte de manière fluide et littéraire
- Préservez les citations directes du sujet quand elles sont particulièrement expressives (entre guillemets)
- Ne modifiez pas les faits
- Maintenez un flux chronologique cohérent
- Répondez en JSON avec le format : { "prose": "texte en prose narrative" }
${subjectName ? `Sujet de la biographie : ${subjectName}` : ''}`,
          },
          {
            role: 'user',
            content: transcriptText,
          },
        ],
        temperature: 0.7,
        max_tokens: 3000,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const content = JSON.parse(data.choices[0]?.message?.content || '{"prose":""}');

    return new Response(
      JSON.stringify(content),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('AI to-prose error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
