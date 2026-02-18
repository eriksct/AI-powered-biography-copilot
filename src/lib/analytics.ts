/**
 * Amplitude Analytics - Biograph Custom Event Tracking
 *
 * This module provides type-safe wrappers around the Amplitude Browser SDK
 * which is loaded via CDN script in index.html.
 *
 * Events taxonomy:
 * - Signup Completed       → User created an account
 * - Login                  → User logged in
 * - Project Created        → New biography project started
 * - Project Deleted        → Project removed
 * - Recording Started      → Audio recording begun
 * - Recording Completed    → Audio recording saved & uploaded
 * - Transcription Completed→ Whisper finished processing audio
 * - Search Used            → User searched transcripts (Cmd+K)
 * - AI Chat Sent           → User sent a message to AI assistant
 * - Document Saved         → Auto-save triggered on editor
 * - Document Exported      → User exported to DOCX
 * - Upgrade Dialog Shown   → Free user hit a limit (project or transcription)
 * - Checkout Started       → User clicked upgrade & Stripe checkout opened
 * - Subscription Active    → User successfully subscribed to Pro
 */

// Amplitude is loaded globally via CDN script in index.html
declare global {
  interface Window {
    amplitude?: {
      track: (eventName: string, eventProperties?: Record<string, unknown>) => void;
      setUserId: (userId: string | undefined) => void;
      identify: (identify: AmplitudeIdentify) => void;
      Identify: new () => AmplitudeIdentify;
      reset: () => void;
    };
  }
}

interface AmplitudeIdentify {
  set: (key: string, value: unknown) => AmplitudeIdentify;
}

function getAmplitude() {
  return window.amplitude;
}

// ─── User Identity ───────────────────────────────────────────────

export function identifyUser(userId: string, properties?: {
  email?: string;
  full_name?: string;
  plan?: string;
  signup_date?: string;
}) {
  const amp = getAmplitude();
  if (!amp) return;

  amp.setUserId(userId);

  if (properties) {
    const identify = new amp.Identify();
    if (properties.email) identify.set('email', properties.email);
    if (properties.full_name) identify.set('full_name', properties.full_name);
    if (properties.plan) identify.set('plan', properties.plan);
    if (properties.signup_date) identify.set('signup_date', properties.signup_date);
    amp.identify(identify);
  }
}

export function resetUser() {
  const amp = getAmplitude();
  if (!amp) return;
  amp.reset();
}

export function updateUserPlan(plan: string) {
  const amp = getAmplitude();
  if (!amp) return;
  const identify = new amp.Identify();
  identify.set('plan', plan);
  amp.identify(identify);
}

// ─── Event Tracking ──────────────────────────────────────────────

function track(eventName: string, properties?: Record<string, unknown>) {
  const amp = getAmplitude();
  if (!amp) return;
  amp.track(eventName, properties);
}

// Auth events
export function trackSignupCompleted(method: string = 'email') {
  track('Signup Completed', { method });
}

export function trackLogin(method: string = 'email') {
  track('Login', { method });
}

// Project events
export function trackProjectCreated(projectId: string, hasSubjectName: boolean) {
  track('Project Created', { project_id: projectId, has_subject_name: hasSubjectName });
}

export function trackProjectDeleted(projectId: string) {
  track('Project Deleted', { project_id: projectId });
}

// Recording events
export function trackRecordingStarted(projectId: string) {
  track('Recording Started', { project_id: projectId });
}

export function trackRecordingCompleted(projectId: string, durationSeconds: number, fileSizeBytes: number) {
  track('Recording Completed', {
    project_id: projectId,
    duration_seconds: durationSeconds,
    file_size_bytes: fileSizeBytes,
  });
}

export function trackTranscriptionCompleted(projectId: string, recordingId: string) {
  track('Transcription Completed', { project_id: projectId, recording_id: recordingId });
}

// Search events
export function trackSearchUsed(projectId: string, queryLength: number, resultCount: number) {
  track('Search Used', {
    project_id: projectId,
    query_length: queryLength,
    result_count: resultCount,
  });
}

// AI events
export function trackAIChatSent(projectId: string, messageLength: number, hasAttachments: boolean) {
  track('AI Chat Sent', {
    project_id: projectId,
    message_length: messageLength,
    has_attachments: hasAttachments,
  });
}

// Document events
export function trackDocumentExported(projectId: string, format: string = 'docx') {
  track('Document Exported', { project_id: projectId, format });
}

// Monetization events
export function trackUpgradeDialogShown(trigger: 'project_limit' | 'transcription_limit' | 'settings' | 'landing') {
  track('Upgrade Dialog Shown', { trigger });
}

export function trackCheckoutStarted(priceId: string) {
  track('Checkout Started', { price_id: priceId });
}

export function trackSubscriptionActive() {
  track('Subscription Active');
  updateUserPlan('pro');
}
