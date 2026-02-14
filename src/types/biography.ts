export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  subject_name?: string;
  created_at: string;
  updated_at: string;
}

export interface Recording {
  id: string;
  project_id: string;
  user_id: string;
  name: string;
  audio_path: string;
  duration_seconds: number;
  file_size_bytes: number;
  transcription_status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface TranscriptSegment {
  id: string;
  recording_id: string;
  segment_index: number;
  start_time: number;
  end_time: number;
  text: string;
  speaker_label?: string;
  confidence?: number;
  created_at: string;
}

export interface Document {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  content: any;
  created_at: string;
  updated_at: string;
}

export interface ChatThread {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  messages?: Message[];
}

export interface Message {
  id: string;
  chat_thread_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

export interface Bookmark {
  id: string;
  recording_id: string;
  user_id: string;
  timestamp_seconds: number;
  note?: string;
  created_at: string;
  updated_at: string;
}
