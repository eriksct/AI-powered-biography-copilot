import * as Sentry from '@sentry/react';

// DSN is a public client key (like Stripe publishable key) — safe to embed in source.
const SENTRY_DSN = 'https://88c1b8c70c22188e7fb6ac8403f16481@o4510986103554048.ingest.de.sentry.io/4510986133569616';

Sentry.init({
  dsn: SENTRY_DSN,
  environment: import.meta.env.MODE,
  enabled: import.meta.env.PROD,

  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],

  // Performance monitoring
  tracesSampleRate: import.meta.env.PROD ? 0.2 : 1.0,

  // Session replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

export default Sentry;
