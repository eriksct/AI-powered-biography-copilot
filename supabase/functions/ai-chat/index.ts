// Supabase Edge Function: AI Chat using OpenAI GPT-4o
// Deploy with: supabase functions deploy ai-chat

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
    const { messages, subjectName, projectId } = await req.json();

    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const systemPrompt = `Vous êtes un assistant spécialisé dans l'écriture de biographies. Vous aidez les biographes à transformer des entretiens oraux en récits biographiques cohérents et touchants.

Principes clés :
- Répondez toujours en français
- Préservez la voix et le ton de la personne interviewée
- Transformez l'oral en écrit tout en gardant l'authenticité
- Structurez les informations chronologiquement
- Évitez le jargon académique, privilégiez un style littéraire accessible
- Respectez les faits et n'inventez jamais d'informations
- Vous pouvez aider à structurer des chapitres, réécrire des passages, suggérer des transitions, et organiser le contenu

${subjectName ? `Le biographe travaille actuellement sur la biographie de : ${subjectName}` : ''}`;

    const openaiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: openaiMessages,
        temperature: 0.7,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || "Désolé, je n'ai pas pu générer de réponse.";

    return new Response(
      JSON.stringify({ content }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('AI chat error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
