// Supabase Edge Function: AI Chat using OpenAI GPT-4o with RAG retrieval
// Deploy with: supabase functions deploy ai-chat

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

interface SemanticResult {
  id: string;
  recording_id: string;
  segment_index: number;
  start_time: number;
  end_time: number;
  text: string;
  speaker_label: string;
  recording_name: string;
  similarity_score: number;
  text_rank: number;
  combined_score: number;
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

async function generateQueryEmbedding(text: string, openaiKey: string): Promise<number[]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Embedding API error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
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

// Fallback: old truncation approach when RAG is unavailable
const MAX_CONTEXT_CHARS = 200_000;

interface TruncatedContext {
  transcriptions: { recordingName: string; text: string }[];
  documentText: string;
  wasTruncated: boolean;
}

function truncateContext(
  transcriptions: { recordingName: string; text: string }[],
  documentText: string
): TruncatedContext {
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

/**
 * Load all transcriptions for an interview (fallback when RAG unavailable).
 */
async function loadFullContext(
  supabase: any,
  interviewId: string
): Promise<{ transcriptions: { recordingName: string; text: string }[]; documentText: string }> {
  // Fetch completed recordings
  const { data: recordings } = await supabase
    .from('recordings')
    .select('id, name, transcription_status')
    .eq('interview_id', interviewId)
    .eq('transcription_status', 'completed')
    .order('created_at', { ascending: true });

  const transcriptions: { recordingName: string; text: string }[] = [];
  for (const rec of recordings || []) {
    const { data: segments } = await supabase
      .from('transcripts')
      .select('text')
      .eq('recording_id', rec.id)
      .order('segment_index', { ascending: true });

    if (segments && segments.length > 0) {
      const text = segments.map((s: any) => s.text).join(' ');
      transcriptions.push({ recordingName: rec.name, text });
    }
  }

  // Fetch document text
  const { data: doc } = await supabase
    .from('documents')
    .select('search_text, content')
    .eq('interview_id', interviewId)
    .maybeSingle();

  let documentText = doc?.search_text || '';
  if (!documentText && doc?.content) {
    // Inline extraction as fallback
    const extract = (node: any): string => {
      if (!node) return '';
      if (typeof node === 'string') return node;
      if (node.text) return node.text;
      if (node.content && Array.isArray(node.content)) {
        return node.content.map(extract).filter((t: string) => t.length > 0).join('\n');
      }
      return '';
    };
    documentText = extract(doc.content);
  }

  return { transcriptions, documentText };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const {
      messages,
      subjectName,
      interviewId,
      interviewTheme,
      interviewNumber,
      // Legacy field — still accepted for backward compat but ignored when RAG works
      interviewContext: legacyContext,
    } = await req.json();

    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const tavilyKey = Deno.env.get('TAVILY_API_KEY');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // ── Build context via RAG or fallback ──

    let contextBlock = '';
    let ragSegments: { index: number; recordingName: string; recordingId: string; startTime: number; endTime: number }[] = [];
    const userMessage = messages[messages.length - 1]?.content || '';

    if (interviewId) {
      // Check how many segments exist and how many have embeddings
      const { data: recordings } = await supabase
        .from('recordings')
        .select('id')
        .eq('interview_id', interviewId)
        .eq('transcription_status', 'completed');

      const recordingIds = (recordings || []).map((r: any) => r.id);

      let totalSegments = 0;
      let embeddedSegments = 0;
      if (recordingIds.length > 0) {
        const { count: total } = await supabase
          .from('transcripts')
          .select('id', { count: 'exact', head: true })
          .in('recording_id', recordingIds);
        totalSegments = total || 0;

        const { count: embedded } = await supabase
          .from('transcripts')
          .select('id', { count: 'exact', head: true })
          .in('recording_id', recordingIds)
          .not('embedding', 'is', null);
        embeddedSegments = embedded || 0;
      }

      // Heuristic: skip RAG if <15 segments (include all directly)
      const useRag = totalSegments >= 15 && embeddedSegments > 0;

      if (useRag) {
        // ── RAG path: embed query + hybrid search ──
        try {
          const queryEmbedding = await generateQueryEmbedding(userMessage, openaiKey);

          const { data: searchResults, error: searchError } = await supabase
            .rpc('search_interview_segments', {
              p_interview_id: interviewId,
              p_query_embedding: JSON.stringify(queryEmbedding),
              p_query_text: userMessage,
              p_k: 10,
            });

          if (searchError) {
            console.error('Hybrid search failed, falling back:', searchError.message);
            throw new Error('Search failed');
          }

          if (searchResults && searchResults.length > 0) {
            contextBlock += '\n\n--- PASSAGES PERTINENTS DES TRANSCRIPTIONS ---\n';
            for (let i = 0; i < (searchResults as SemanticResult[]).length; i++) {
              const seg = (searchResults as SemanticResult[])[i];
              ragSegments.push({
                index: i + 1,
                recordingName: seg.recording_name,
                recordingId: seg.recording_id,
                startTime: seg.start_time,
                endTime: seg.end_time,
              });
              const startTs = formatTimestamp(seg.start_time);
              const endTs = formatTimestamp(seg.end_time);
              contextBlock += `\n[Source ${i + 1} — ${seg.recording_name}, ${startTs}–${endTs}]\n${seg.text}\n`;
            }

            contextBlock =
              '\n\nVoici les passages les plus pertinents de l\'entretien en rapport avec votre question. ' +
              'Ces extraits ont été sélectionnés automatiquement parmi l\'ensemble des transcriptions.\n\n' +
              'RÈGLE DE CITATION : Quand vous utilisez une information provenant d\'un passage ci-dessous, ' +
              'ajoutez la référence [N] (où N est le numéro de la source) à la fin de la phrase ou du paragraphe concerné. ' +
              'Ne citez que les sources que vous utilisez réellement. ' +
              'Quand on vous demande de réécrire, utilisez ces transcriptions comme source et citez-les.' +
              contextBlock;
          } else {
            // No results from RAG — fallback
            throw new Error('No RAG results');
          }
        } catch (ragError) {
          console.warn('RAG failed, falling back to full context:', ragError);
          // Fall through to fallback
          contextBlock = '';
        }
      }

      // ── Fallback path: load all context (for small interviews or when RAG fails) ──
      if (!contextBlock) {
        const fullCtx = legacyContext || await loadFullContext(supabase, interviewId);

        const { transcriptions, documentText, wasTruncated } = truncateContext(
          fullCtx.transcriptions || [],
          fullCtx.documentText || ''
        );

        if (transcriptions.length > 0) {
          // Also fetch recording IDs so we can build proper source references
          const { data: recData } = await supabase
            .from('recordings')
            .select('id, name')
            .eq('interview_id', interviewId)
            .eq('transcription_status', 'completed')
            .order('created_at', { ascending: true });
          const recordingMap = new Map((recData || []).map((r: any) => [r.name, r.id]));

          contextBlock += '\n\n--- TRANSCRIPTIONS DE L\'ENTRETIEN ---\n';
          for (let i = 0; i < transcriptions.length; i++) {
            const t = transcriptions[i];
            const sourceIdx = i + 1;
            const recordingId = recordingMap.get(t.recordingName) || '';
            ragSegments.push({
              index: sourceIdx,
              recordingName: t.recordingName,
              recordingId,
              startTime: 0,
              endTime: 0,
            });
            contextBlock += `\n[Source ${sourceIdx} — ${t.recordingName}]\n${t.text}\n`;
          }
        }

        if (documentText?.trim()) {
          contextBlock += '\n\n--- TEXTE RÉDIGÉ DE L\'ENTRETIEN ---\n';
          contextBlock += documentText;
        }

        if (contextBlock) {
          contextBlock =
            '\n\nVoici le contenu de l\'entretien sur lequel vous travaillez. ' +
            'Utilisez ces informations pour répondre de manière précise et contextualisée. ' +
            'RÈGLE DE CITATION : Quand vous utilisez une information provenant d\'un passage ci-dessous, ' +
            'ajoutez la référence [N] (où N est le numéro de la source) à la fin de la phrase ou du paragraphe concerné. ' +
            'Ne citez que les sources que vous utilisez réellement. ' +
            'Quand on vous demande de réécrire, utilisez les transcriptions comme source et citez-les. ' +
            'Quand on vous demande d\'améliorer le texte, référez-vous au texte rédigé actuel.' +
            contextBlock;
        }

        if (wasTruncated) {
          contextBlock += '\n\nNote : le contexte a été partiellement tronqué car l\'entretien est très long. Certaines transcriptions peuvent être incomplètes.';
        }
      } else {
        // RAG succeeded — still include full document text (the written work)
        const { data: doc } = await supabase
          .from('documents')
          .select('search_text, content')
          .eq('interview_id', interviewId)
          .maybeSingle();

        let documentText = doc?.search_text || '';
        if (!documentText && doc?.content) {
          const extract = (node: any): string => {
            if (!node) return '';
            if (typeof node === 'string') return node;
            if (node.text) return node.text;
            if (node.content && Array.isArray(node.content)) {
              return node.content.map(extract).filter((t: string) => t.length > 0).join('\n');
            }
            return '';
          };
          documentText = extract(doc.content);
        }

        if (documentText?.trim()) {
          contextBlock += '\n\n--- TEXTE RÉDIGÉ DE L\'ENTRETIEN ---\n';
          contextBlock += documentText;
          contextBlock += '\n\nQuand on vous demande d\'améliorer le texte, référez-vous au texte rédigé ci-dessus.';
        }
      }
    }

    // ── Build system prompt ──

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

    const fullSystemPrompt = systemPrompt + contextBlock;

    const openaiMessages: any[] = [
      { role: 'system', content: fullSystemPrompt },
      ...messages.map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    // ── First GPT-4o call (may trigger web_search tool) ──

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

    // ── Handle web_search tool call ──

    if (firstChoice.finish_reason === 'tool_calls' && tavilyKey) {
      const toolCall = firstChoice.message.tool_calls[0];
      const { query } = JSON.parse(toolCall.function.arguments);

      const searchResults = await searchWeb(query, tavilyKey);

      if (searchResults.length > 0) {
        // Offset web source indices when RAG segments exist to avoid conflicts
        const webOffset = ragSegments.length;
        const sourcesContext = searchResults
          .map((r: TavilyResult, i: number) => `[${webOffset + i + 1}] ${r.title}\nURL: ${r.url}\n${r.content}`)
          .join('\n\n');

        const synthesisMessages = [
          {
            role: 'system',
            content: fullSystemPrompt + `\n\nVous venez de recevoir des résultats de recherche web. Rédigez votre réponse en intégrant les informations pertinentes avec des citations inline sous la forme [${webOffset + 1}], [${webOffset + 2}], etc. correspondant aux numéros des sources. À la fin de votre réponse, n'ajoutez PAS de liste de sources — elle sera ajoutée automatiquement.`,
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

        // Build web sources with offset indices
        const webSources = searchResults.map((r: TavilyResult, i: number) => ({
          index: webOffset + i + 1,
          title: r.title,
          url: r.url,
        }));

        // Build RAG sources from cited references in the response
        const ragSources = buildRagSources(content, ragSegments);

        const sources = [...ragSources, ...webSources];

        return new Response(
          JSON.stringify({ content, sources }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // No tool call or empty search results — normal response
    const content = firstChoice?.message?.content || "Désolé, je n'ai pas pu générer de réponse.";

    // Build RAG sources if segments were used
    if (ragSegments.length > 0) {
      const sources = buildRagSources(content, ragSegments);
      if (sources.length > 0) {
        return new Response(
          JSON.stringify({ content, sources }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

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

/**
 * Scan GPT response for [N] citations and build sources for cited RAG segments.
 */
function buildRagSources(
  content: string,
  ragSegments: { index: number; recordingName: string; recordingId: string; startTime: number; endTime: number }[]
): { index: number; title: string; url: string }[] {
  const citedIndices = new Set<number>();
  const citationRegex = /\[(\d+)\]/g;
  let match;
  while ((match = citationRegex.exec(content)) !== null) {
    citedIndices.add(parseInt(match[1], 10));
  }

  return ragSegments
    .filter(seg => citedIndices.has(seg.index))
    .map(seg => ({
      index: seg.index,
      title: `${seg.recordingName} — ${formatTimestamp(seg.startTime)}`,
      url: `recording:${seg.recordingId}?t=${Math.floor(seg.startTime)}`,
    }));
}

function formatTimestamp(seconds: number): string {
  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);
  return `${min}:${sec.toString().padStart(2, '0')}`;
}
