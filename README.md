# Biograph - AI-Powered Biography Writing Platform

Biograph is a web application designed for biographers who work with elderly subjects. It streamlines the biography creation process by combining audio recording, automatic transcription, AI-assisted writing, and rich text editing in a single integrated workspace.

## Core Workflow

**Record** interview audio &rarr; **Transcribe** automatically via Whisper &rarr; **Search & organize** transcripts &rarr; **Write** with AI assistance &rarr; **Export** as .docx

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui (Radix) |
| Editor | TipTap (ProseMirror) with formatting toolbar |
| Backend | Supabase (PostgreSQL, Auth, Storage, Edge Functions) |
| AI | OpenAI GPT-4o (writing assistant), Whisper (transcription) |
| State | TanStack React Query (server), React Context (auth) |
| Export | docx + file-saver for .docx generation |

## Features

- **Authentication** &mdash; Email/password signup and login via Supabase Auth
- **Project Management** &mdash; Create and manage multiple biography projects from a dashboard
- **Audio Recording** &mdash; Record interviews directly in the browser using the MediaRecorder API
- **Automatic Transcription** &mdash; Audio uploaded to Supabase Storage, transcribed via OpenAI Whisper with timestamped segments
- **Transcript Search** &mdash; Full-text search across all project transcripts (Cmd+K)
- **Rich Text Editor** &mdash; TipTap editor with bold, italic, underline, headings, lists, blockquotes, and auto-save
- **AI Assistant** &mdash; GPT-4o chat for biography writing guidance, with project context awareness
- **AI Text Tools** &mdash; Rephrase (3 options), condense, and transcript-to-prose conversion
- **Document Export** &mdash; Export your biography draft as a formatted .docx file
- **French UI** &mdash; Entire interface in French

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A [Supabase](https://supabase.com) project
- An [OpenAI](https://platform.openai.com) API key

### 1. Clone and Install

```bash
git clone https://github.com/eriksct/AI-powered-biography-copilot.git
cd AI-powered-biography-copilot
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to the **SQL Editor** and run the contents of `supabase/schema.sql` to create all tables, RLS policies, triggers, and the storage bucket
3. In **Authentication > Sign In / Providers**, optionally disable "Confirm email" for development

### 3. Configure Environment Variables

Create a `.env.local` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

Find these values in your Supabase project under **Connect > API Keys**.

### 4. Deploy Edge Functions

Install the Supabase CLI and link your project:

```bash
npx supabase link --project-ref your-project-ref
```

Set the OpenAI API key as a secret:

```bash
npx supabase secrets set --env-file .env.secrets
```

Where `.env.secrets` contains:

```env
OPENAI_API_KEY=sk-your-key-here
```

Deploy all 5 Edge Functions:

```bash
npx supabase functions deploy transcribe --no-verify-jwt
npx supabase functions deploy ai-chat --no-verify-jwt
npx supabase functions deploy ai-rephrase --no-verify-jwt
npx supabase functions deploy ai-condense --no-verify-jwt
npx supabase functions deploy ai-to-prose --no-verify-jwt
```

### 5. Start Development Server

```bash
npm run dev
```

Open [http://localhost:8080](http://localhost:8080) and create an account to get started.

## Project Structure

```
src/
  components/        # UI components (RecordingsList, TextEditor, AIAssistant, etc.)
  contexts/          # AuthContext for authentication state
  hooks/             # Data hooks (useRecordings, useDocument, useChatThreads, etc.)
  lib/               # Supabase client configuration
  pages/             # Route pages (Auth, Dashboard, Project, NotFound)
  types/             # TypeScript type definitions
supabase/
  functions/         # Edge Functions (transcribe, ai-chat, ai-rephrase, ai-condense, ai-to-prose)
  schema.sql         # Full database schema with RLS policies
```

## Database Schema

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles (extends auth.users) |
| `projects` | Biography projects with title, subject name, description |
| `recordings` | Audio recordings with transcription status |
| `transcripts` | Timestamped transcript segments from Whisper |
| `documents` | Rich text document content (TipTap JSON) |
| `chat_threads` | AI assistant conversation threads |
| `messages` | Individual chat messages (user + assistant) |
| `bookmarks` | Timestamp bookmarks on recordings |

All tables have Row Level Security (RLS) policies ensuring users can only access their own data.

## Edge Functions

| Function | Purpose |
|----------|---------|
| `transcribe` | Downloads audio from Storage, sends to Whisper API, saves timestamped segments |
| `ai-chat` | GPT-4o biography writing assistant with project context |
| `ai-rephrase` | Returns 3 rephrasing options for selected text |
| `ai-condense` | Returns a condensed version of selected text |
| `ai-to-prose` | Converts transcript segments into narrative prose |

## License

This project is private and proprietary.
