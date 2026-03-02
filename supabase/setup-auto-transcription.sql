-- ============================================================
-- SETUP AUTO-TRANSCRIPTION TRIGGER
-- ============================================================
-- This script sets up automatic transcription for recordings
-- Run this in Supabase SQL Editor
--
-- What it does:
-- 1. Enables pg_net extension for HTTP requests
-- 2. Creates a trigger function that calls the transcribe Edge Function
-- 3. Creates a trigger that fires when a new recording is inserted
--
-- Result: Transcriptions will happen automatically even if user
-- closes their browser after uploading an audio file
-- ============================================================

-- Step 1: Enable pg_net extension
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Step 2: Create the trigger function
CREATE OR REPLACE FUNCTION trigger_auto_transcription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Call the transcribe Edge Function using pg_net
  PERFORM net.http_post(
    url := 'https://uyhjhmpmyhirzkwyjjts.supabase.co/functions/v1/transcribe',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5aGpobXBteWhpcnprd3lqanRzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTIzODE2MywiZXhwIjoyMDUwODE0MTYzfQ.5aQGInZsInV5aGpobXBteWhpcnprd3lqanRzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTIzODE2MywiZXhwIjoyMDUwODE0MTYzfQ'
    ),
    body := jsonb_build_object('recordingId', NEW.id)
  );

  RETURN NEW;
END;
$$;

-- Step 3: Drop existing trigger if it exists
DROP TRIGGER IF EXISTS auto_transcribe_on_upload ON recordings;

-- Step 4: Create the trigger
CREATE TRIGGER auto_transcribe_on_upload
  AFTER INSERT ON recordings
  FOR EACH ROW
  WHEN (NEW.transcription_status = 'pending')
  EXECUTE FUNCTION trigger_auto_transcription();

-- ============================================================
-- DONE!
-- ============================================================
-- The automatic transcription is now set up.
--
-- Test it:
-- 1. Upload an audio recording from the app
-- 2. Close your browser/computer
-- 3. Come back later and check - the transcription should be complete!
-- ============================================================
