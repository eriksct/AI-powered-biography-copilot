-- Biography Platform Schema (with Interviews layer)
-- Run this in the Supabase SQL Editor for a fresh setup

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ============================================================
-- FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to atomically increment transcription usage
CREATE OR REPLACE FUNCTION increment_transcription_usage(p_user_id UUID, p_seconds INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET transcription_seconds_used = transcription_seconds_used + p_seconds
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- TABLES
-- ============================================================

-- Profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  stripe_customer_id TEXT,
  subscription_id TEXT,
  subscription_status TEXT DEFAULT 'none' CHECK (subscription_status IN ('none', 'active', 'past_due', 'canceled', 'incomplete', 'trialing')),
  transcription_seconds_used INTEGER NOT NULL DEFAULT 0,
  max_projects INTEGER NOT NULL DEFAULT 1,
  max_transcription_seconds INTEGER NOT NULL DEFAULT 7200,
  max_interviews_per_project INTEGER NOT NULL DEFAULT 2,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  subject_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Interviews (sits between projects and recordings/documents/chats)
CREATE TABLE interviews (
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

-- Recordings (linked to interviews)
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

-- Transcript segments
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

-- Documents (linked to interviews)
CREATE TABLE documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Sans titre',
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat threads (linked to interviews)
CREATE TABLE chat_threads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Nouvelle discussion',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_thread_id UUID NOT NULL REFERENCES chat_threads(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bookmarks
CREATE TABLE bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recording_id UUID NOT NULL REFERENCES recordings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  timestamp_seconds FLOAT NOT NULL DEFAULT 0,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_interviews_project_id ON interviews(project_id);
CREATE INDEX idx_interviews_user_id ON interviews(user_id);
CREATE INDEX idx_recordings_interview_id ON recordings(interview_id);
CREATE INDEX idx_recordings_user_id ON recordings(user_id);
CREATE INDEX idx_transcripts_recording_id ON transcripts(recording_id);
CREATE INDEX idx_transcripts_text ON transcripts USING gin(to_tsvector('french', text));
CREATE INDEX idx_documents_interview_id ON documents(interview_id);
CREATE INDEX idx_chat_threads_interview_id ON chat_threads(interview_id);
CREATE INDEX idx_messages_chat_thread_id ON messages(chat_thread_id);
CREATE INDEX idx_bookmarks_recording_id ON bookmarks(recording_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Projects
CREATE POLICY "Users can view own projects" ON projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create projects" ON projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own projects" ON projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own projects" ON projects FOR DELETE USING (auth.uid() = user_id);

-- Interviews
CREATE POLICY "Users can view own interviews" ON interviews FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create own interviews" ON interviews FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own interviews" ON interviews FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own interviews" ON interviews FOR DELETE USING (user_id = auth.uid());

-- Recordings
CREATE POLICY "Users can view own recordings" ON recordings FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create own recordings" ON recordings FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own recordings" ON recordings FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own recordings" ON recordings FOR DELETE USING (user_id = auth.uid());

-- Transcripts (via recording ownership)
CREATE POLICY "Users can view own transcripts" ON transcripts
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM recordings WHERE recordings.id = transcripts.recording_id AND recordings.user_id = auth.uid()
  ));
CREATE POLICY "Users can create own transcripts" ON transcripts
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM recordings WHERE recordings.id = transcripts.recording_id AND recordings.user_id = auth.uid()
  ));

-- Documents
CREATE POLICY "Users can view own documents" ON documents FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create own documents" ON documents FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own documents" ON documents FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own documents" ON documents FOR DELETE USING (user_id = auth.uid());

-- Chat threads
CREATE POLICY "Users can view own chat_threads" ON chat_threads FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create own chat_threads" ON chat_threads FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own chat_threads" ON chat_threads FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own chat_threads" ON chat_threads FOR DELETE USING (user_id = auth.uid());

-- Messages (via chat thread ownership)
CREATE POLICY "Users can view own messages" ON messages
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM chat_threads WHERE chat_threads.id = messages.chat_thread_id AND chat_threads.user_id = auth.uid()
  ));
CREATE POLICY "Users can create own messages" ON messages
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM chat_threads WHERE chat_threads.id = messages.chat_thread_id AND chat_threads.user_id = auth.uid()
  ));

-- Bookmarks
CREATE POLICY "Users can view own bookmarks" ON bookmarks FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create bookmarks" ON bookmarks FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own bookmarks" ON bookmarks FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own bookmarks" ON bookmarks FOR DELETE USING (user_id = auth.uid());

-- ============================================================
-- TRIGGERS
-- ============================================================

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_interviews_updated_at BEFORE UPDATE ON interviews FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_recordings_updated_at BEFORE UPDATE ON recordings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_chat_threads_updated_at BEFORE UPDATE ON chat_threads FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_bookmarks_updated_at BEFORE UPDATE ON bookmarks FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- AUTO-TRANSCRIPTION TRIGGER
-- ============================================================
-- Calls the transcribe Edge Function when a new recording is uploaded

CREATE OR REPLACE FUNCTION trigger_auto_transcription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
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

CREATE TRIGGER auto_transcribe_on_upload
  AFTER INSERT ON recordings
  FOR EACH ROW
  WHEN (NEW.transcription_status = 'pending')
  EXECUTE FUNCTION trigger_auto_transcription();

-- ============================================================
-- STORAGE
-- ============================================================

INSERT INTO storage.buckets (id, name, public) VALUES ('audio-recordings', 'audio-recordings', false)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload own audio" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'audio-recordings' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own audio" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'audio-recordings' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own audio" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'audio-recordings' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Chat attachments storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload chat attachments" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'chat-attachments' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Anyone can view chat attachments" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'chat-attachments'
  );

CREATE POLICY "Users can delete own chat attachments" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'chat-attachments' AND
    auth.role() = 'authenticated'
  );
