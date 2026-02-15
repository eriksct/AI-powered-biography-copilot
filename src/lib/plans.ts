export const PLAN_LIMITS = {
  free: {
    maxProjects: 1,
    maxTranscriptionSeconds: 7200,
    label: 'Gratuit',
  },
  pro: {
    maxProjects: 999,
    maxTranscriptionSeconds: 54000,
    label: 'Professionnel',
  },
} as const;

export const STRIPE_PRICES = {
  monthly: import.meta.env.VITE_STRIPE_PRICE_MONTHLY || '',
};

export function formatTranscriptionTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`;
  }
  return `${minutes}min`;
}
