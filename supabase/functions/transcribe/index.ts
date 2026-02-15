// Supabase Edge Function: Transcribe audio using OpenAI Whisper API
// Deploy with: supabase functions deploy transcribe

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { recordingId } = await req.json();

    if (!recordingId) {
      return new Response(
        JSON.stringify({ error: 'recordingId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Update status to processing
    await supabase
      .from('recordings')
      .update({ transcription_status: 'processing' })
      .eq('id', recordingId);

    // Fetch recording record
    const { data: recording, error: fetchError } = await supabase
      .from('recordings')
      .select('*')
      .eq('id', recordingId)
      .single();

    if (fetchError || !recording) {
      throw new Error(`Recording not found: ${fetchError?.message}`);
    }

    // Download audio from storage
    const { data: audioData, error: downloadError } = await supabase.storage
      .from('audio-recordings')
      .download(recording.audio_path);

    if (downloadError || !audioData) {
      throw new Error(`Failed to download audio: ${downloadError?.message}`);
    }

    // Send to OpenAI Whisper API
    const formData = new FormData();
    formData.append('file', audioData, 'audio.webm');
    formData.append('model', 'whisper-1');
    formData.append('response_format', 'verbose_json');
    formData.append('language', 'fr');

    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: formData,
    });

    if (!whisperResponse.ok) {
      const errorText = await whisperResponse.text();
      throw new Error(`Whisper API error: ${whisperResponse.status} ${errorText}`);
    }

    const transcription = await whisperResponse.json();

    // Parse segments and insert into DB
    const segments = (transcription.segments || []).map((seg: any, index: number) => ({
      recording_id: recordingId,
      segment_index: index,
      start_time: seg.start,
      end_time: seg.end,
      text: seg.text.trim(),
      confidence: seg.avg_logprob !== undefined
        ? Math.exp(seg.avg_logprob) // Convert log probability to 0-1 confidence
        : null,
    }));

    if (segments.length > 0) {
      const { error: insertError } = await supabase
        .from('transcripts')
        .insert(segments);
      if (insertError) throw new Error(`Failed to insert segments: ${insertError.message}`);
    }

    // Update recording status to completed
    await supabase
      .from('recordings')
      .update({ transcription_status: 'completed' })
      .eq('id', recordingId);

    // Track transcription usage on the user's profile
    if (recording.duration_seconds > 0) {
      await supabase.rpc('increment_transcription_usage', {
        p_user_id: recording.user_id,
        p_seconds: recording.duration_seconds,
      });
    }

    return new Response(
      JSON.stringify({ success: true, segmentCount: segments.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Transcription error:', error);

    // Try to update status to failed
    try {
      const { recordingId } = await (new Request(req.url, req)).json().catch(() => ({}));
      if (recordingId) {
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );
        await supabase
          .from('recordings')
          .update({ transcription_status: 'failed' })
          .eq('id', recordingId);
      }
    } catch {}

    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
