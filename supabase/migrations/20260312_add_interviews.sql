-- Migration: Add interviews layer between projects and recordings/documents/chat_threads
-- This migration can destructively re-create child tables since existing data can be erased.

-- ============================================================
-- 1. Create the interviews table
-- ============================================================
CREATE TABLE IF NOT EXISTS interviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  number INTEGER NOT NULL,
  interview_date DATE NOT NULL DEFAULT CURRENT_DATE,
  theme TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, number)
);

CREATE INDEX IF NOT EXISTS idx_interviews_project_id ON interviews(project_id);
CREATE INDEX IF NOT EXISTS idx_interviews_user_id ON interviews(user_id);

-- updated_at trigger
CREATE TRIGGER set_interviews_updated_at
  BEFORE UPDATE ON interviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own interviews"
  ON interviews FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create own interviews"
  ON interviews FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own interviews"
  ON interviews FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own interviews"
  ON interviews FOR DELETE USING (user_id = auth.uid());

-- ============================================================
-- 2. Re-create recordings with interview_id instead of project_id
-- ============================================================
DROP TABLE IF EXISTS bookmarks CASCADE;
DROP TABLE IF EXISTS transcripts CASCADE;
DROP TABLE IF EXISTS recordings CASCADE;

CREATE TABLE recordings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  audio_path TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  file_size_bytes BIGINT NOT NULL DEFAULT 0,
  transcription_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (transcription_status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_recordings_interview_id ON recordings(interview_id);
CREATE INDEX idx_recordings_user_id ON recordings(user_id);

CREATE TRIGGER set_recordings_updated_at
  BEFORE UPDATE ON recordings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE recordings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own recordings"
  ON recordings FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create own recordings"
  ON recordings FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own recordings"
  ON recordings FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own recordings"
  ON recordings FOR DELETE USING (user_id = auth.uid());

-- Re-create auto-transcription trigger (the function still exists via CREATE OR REPLACE)
CREATE TRIGGER auto_transcribe_on_upload
  AFTER INSERT ON recordings
  FOR EACH ROW
  WHEN (NEW.transcription_status = 'pending')
  EXECUTE FUNCTION trigger_auto_transcription();

-- ============================================================
-- 3. Re-create transcripts (unchanged schema, depends on recordings)
-- ============================================================
CREATE TABLE transcripts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recording_id UUID NOT NULL REFERENCES recordings(id) ON DELETE CASCADE,
  segment_index INTEGER NOT NULL DEFAULT 0,
  start_time FLOAT NOT NULL DEFAULT 0,
  end_time FLOAT NOT NULL DEFAULT 0,
  text TEXT NOT NULL DEFAULT '',
  speaker_label TEXT,
  confidence FLOAT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transcripts_recording_id ON transcripts(recording_id);

ALTER TABLE transcripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transcripts"
  ON transcripts FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM recordings WHERE recordings.id = transcripts.recording_id AND recordings.user_id = auth.uid()
  ));
CREATE POLICY "Users can create own transcripts"
  ON transcripts FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM recordings WHERE recordings.id = transcripts.recording_id AND recordings.user_id = auth.uid()
  ));

-- ============================================================
-- 4. Re-create bookmarks (depends on recordings)
-- ============================================================
CREATE TABLE bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recording_id UUID NOT NULL REFERENCES recordings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  timestamp_seconds FLOAT NOT NULL DEFAULT 0,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bookmarks_recording_id ON bookmarks(recording_id);

ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookmarks"
  ON bookmarks FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create own bookmarks"
  ON bookmarks FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own bookmarks"
  ON bookmarks FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own bookmarks"
  ON bookmarks FOR DELETE USING (user_id = auth.uid());

-- ============================================================
-- 5. Re-create documents with interview_id instead of project_id
-- ============================================================
DROP TABLE IF EXISTS documents CASCADE;

CREATE TABLE documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Sans titre',
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_documents_interview_id ON documents(interview_id);

CREATE TRIGGER set_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own documents"
  ON documents FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create own documents"
  ON documents FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own documents"
  ON documents FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own documents"
  ON documents FOR DELETE USING (user_id = auth.uid());

-- ============================================================
-- 6. Re-create chat_threads with interview_id instead of project_id
-- ============================================================
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS chat_threads CASCADE;

CREATE TABLE chat_threads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Nouvelle discussion',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_threads_interview_id ON chat_threads(interview_id);

CREATE TRIGGER set_chat_threads_updated_at
  BEFORE UPDATE ON chat_threads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE chat_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chat_threads"
  ON chat_threads FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create own chat_threads"
  ON chat_threads FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own chat_threads"
  ON chat_threads FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own chat_threads"
  ON chat_threads FOR DELETE USING (user_id = auth.uid());

-- ============================================================
-- 7. Re-create messages (depends on chat_threads)
-- ============================================================
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_thread_id UUID NOT NULL REFERENCES chat_threads(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_chat_thread_id ON messages(chat_thread_id);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own messages"
  ON messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM chat_threads WHERE chat_threads.id = messages.chat_thread_id AND chat_threads.user_id = auth.uid()
  ));
CREATE POLICY "Users can create own messages"
  ON messages FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM chat_threads WHERE chat_threads.id = messages.chat_thread_id AND chat_threads.user_id = auth.uid()
  ));

-- ============================================================
-- 8. Add max_interviews_per_project to profiles
-- ============================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS max_interviews_per_project INTEGER NOT NULL DEFAULT 2;

-- Set existing pro users to unlimited interviews
UPDATE profiles SET max_interviews_per_project = 999 WHERE plan = 'pro';
