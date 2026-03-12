// Supabase Edge Function: AI Chat using OpenAI GPT-4o
// Deploy with: supabase functions deploy ai-chat

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TavilyResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

async function searchWeb(query: string, tavilyKey: string): Promise<TavilyResult[]> {
  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: tavilyKey,
      query,
      max_results: 5,
      include_answer: false,
      search_depth: 'basic',
    }),
  });

  if (!response.ok) {
    console.error('Tavily search failed:', response.status);
    return [];
  }

  const data = await response.json();
  return data.results || [];
}

const webSearchTool = {
  type: 'function' as const,
  function: {
    name: 'web_search',
    description: "Rechercher sur le web pour trouver des informations factuelles, des dates historiques, des faits biographiques vérifiables, ou des informations actuelles. Utiliser quand le biographe a besoin de vérifier un fait ou cherche des informations externes.",
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'La requête de recherche, optimisée pour un moteur de recherche',
        },
      },
      required: ['query'],
    },
  },
};

const MAX_CONTEXT_CHARS = 200_000; // ~50k tokens, leaves room for system prompt + history + response

interface TruncatedContext {
  transcriptions: { recordingName: string; text: string }[];
  documentText: string;
  wasTruncated: boolean;
}

function truncateContext(
  transcriptions: { recordingName: string; text: string }[],
  documentText: string
): TruncatedContext {
  // Document has priority — keep it in full (rarely very long)
  let remainingChars = MAX_CONTEXT_CHARS - documentText.length;
  let wasTruncated = false;

  const truncatedTranscriptions = [];
  for (const t of transcriptions) {
    if (remainingChars <= 500) {
      wasTruncated = true;
      break;
    }
    if (t.text.length > remainingChars) {
      truncatedTranscriptions.push({
        recordingName: t.recordingName,
        text: t.text.slice(0, remainingChars) + '\n[... transcription tronquée]',
      });
      wasTruncated = true;
      break;
    }
    truncatedTranscriptions.push(t);
    remainingChars -= t.text.length;
  }

  return { transcriptions: truncatedTranscriptions, documentText, wasTruncated };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { messages, subjectName, interviewId, interviewTheme, interviewNumber, interviewContext } = await req.json();

    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const tavilyKey = Deno.env.get('TAVILY_API_KEY');

    const systemPrompt = `Vous êtes un assistant spécialisé dans l'écriture de biographies. Vous aidez les biographes à transformer des entretiens oraux en récits biographiques cohérents et touchants.

Principes clés :
- Répondez toujours en français
- Préservez la voix et le ton de la personne interviewée
- Transformez l'oral en écrit tout en gardant l'authenticité
- Structurez les informations chronologiquement
- Évitez le jargon académique, privilégiez un style littéraire accessible
- Respectez les faits et n'inventez jamais d'informations
- Vous pouvez aider à structurer des chapitres, réécrire des passages, suggérer des transitions, et organiser le contenu
- Vous avez accès aux transcriptions des enregistrements et au texte rédigé de l'entretien en cours
- Basez vos réponses sur le contenu réel de l'entretien, citez des passages quand c'est pertinent
- Si on vous demande de réécrire ou reformuler, utilisez le contenu des transcriptions comme source
- Si on vous demande d'améliorer le texte, référez-vous au texte rédigé actuel

Règles de reformulation :
- Écrivez au passé en respectant les règles de conjugaison pour l'emploi de l'imparfait et du passé simple
- Écrivez à la première personne
- Conservez tous les détails car ils sont importants aux yeux du sujet
${tavilyKey ? '\nVous avez accès à un outil de recherche web. Utilisez-le quand le biographe cherche des informations factuelles vérifiables (dates, événements historiques, personnalités, lieux, etc.). Ne l\'utilisez PAS pour des questions d\'écriture ou de style.' : ''}
${subjectName ? `\nLe biographe travaille actuellement sur la biographie de : ${subjectName}` : ''}
${interviewNumber ? `\nEntretien n°${interviewNumber}${interviewTheme ? ` — Thème : ${interviewTheme}` : ''}` : ''}`;

    // Build interview context block from transcriptions and document
    let contextBlock = '';

    if (interviewContext) {
      const { transcriptions, documentText, wasTruncated } = truncateContext(
        interviewContext.transcriptions || [],
        interviewContext.documentText || ''
      );

      if (transcriptions.length > 0) {
        contextBlock += '\n\n--- TRANSCRIPTIONS DE L\'ENTRETIEN ---\n';
        for (const t of transcriptions) {
          contextBlock += `\n[Enregistrement : ${t.recordingName}]\n${t.text}\n`;
        }
      }

      if (documentText.trim()) {
        contextBlock += '\n\n--- TEXTE RÉDIGÉ DE L\'ENTRETIEN ---\n';
        contextBlock += documentText;
      }

      if (contextBlock) {
        contextBlock =
          '\n\nVoici le contenu de l\'entretien sur lequel vous travaillez. ' +
          'Utilisez ces informations pour répondre de manière précise et contextualisée. ' +
          'Citez des passages spécifiques des transcriptions quand c\'est pertinent. ' +
          'Quand on vous demande de réécrire, utilisez les transcriptions comme source. ' +
          'Quand on vous demande d\'améliorer le texte, référez-vous au texte rédigé actuel.' +
          contextBlock;
      }

      if (wasTruncated) {
        contextBlock += '\n\nNote : le contexte a été partiellement tronqué car l\'entretien est très long. Certaines transcriptions peuvent être incomplètes.';
      }
    }

    const fullSystemPrompt = systemPrompt + contextBlock;

    const openaiMessages: any[] = [
      { role: 'system', content: fullSystemPrompt },
      ...messages.map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    // First call: may or may not trigger web_search tool
    const firstResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
        ...(tavilyKey ? { tools: [webSearchTool], tool_choice: 'auto' } : {}),
      }),
    });

    if (!firstResponse.ok) {
      const errorText = await firstResponse.text();
      throw new Error(`OpenAI API error: ${firstResponse.status} ${errorText}`);
    }

    const firstData = await firstResponse.json();
    const firstChoice = firstData.choices[0];

    // Check if GPT-4o wants to call web_search
    if (firstChoice.finish_reason === 'tool_calls' && tavilyKey) {
      const toolCall = firstChoice.message.tool_calls[0];
      const { query } = JSON.parse(toolCall.function.arguments);

      const searchResults = await searchWeb(query, tavilyKey);

      if (searchResults.length > 0) {
        const sourcesContext = searchResults
          .map((r: TavilyResult, i: number) => `[${i + 1}] ${r.title}\nURL: ${r.url}\n${r.content}`)
          .join('\n\n');

        // Second call: synthesize with search results
        const synthesisMessages = [
          {
            role: 'system',
            content: fullSystemPrompt + `\n\nVous venez de recevoir des résultats de recherche web. Rédigez votre réponse en intégrant les informations pertinentes avec des citations inline sous la forme [1], [2], etc. correspondant aux numéros des sources. À la fin de votre réponse, n'ajoutez PAS de liste de sources — elle sera ajoutée automatiquement.`,
          },
          ...openaiMessages.slice(1),
          firstChoice.message,
          {
            role: 'tool',
            tool_call_id: toolCall.id,
            content: sourcesContext,
          },
        ];

        const secondResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            messages: synthesisMessages,
            temperature: 0.7,
            max_tokens: 2048,
          }),
        });

        if (!secondResponse.ok) {
          const errorText = await secondResponse.text();
          throw new Error(`OpenAI API error: ${secondResponse.status} ${errorText}`);
        }

        const secondData = await secondResponse.json();
        const content = secondData.choices[0]?.message?.content || "Désolé, je n'ai pas pu générer de réponse.";

        const sources = searchResults.map((r: TavilyResult, i: number) => ({
          index: i + 1,
          title: r.title,
          url: r.url,
        }));

        return new Response(
          JSON.stringify({ content, sources }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // No tool call or empty search results — normal response
    const content = firstChoice?.message?.content || "Désolé, je n'ai pas pu générer de réponse.";

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
