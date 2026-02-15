import { useProfile } from './useProfile';
import { useProjects } from './useProjects';

export function useSubscription() {
  const { data: profile, isLoading } = useProfile();
  const { data: projects } = useProjects();

  const plan = profile?.plan ?? 'free';
  const isPro = plan === 'pro';
  const projectCount = projects?.length ?? 0;

  const canCreateProject = isPro || projectCount < (profile?.max_projects ?? 1);

  const transcriptionSecondsUsed = profile?.transcription_seconds_used ?? 0;
  const maxTranscriptionSeconds = profile?.max_transcription_seconds ?? 7200;
  const transcriptionSecondsRemaining = maxTranscriptionSeconds - transcriptionSecondsUsed;
  const canTranscribe = transcriptionSecondsRemaining > 0;

  return {
    profile,
    plan,
    isPro,
    isLoading,
    canCreateProject,
    canTranscribe,
    transcriptionSecondsUsed,
    transcriptionSecondsRemaining,
    maxTranscriptionSeconds,
    projectCount,
    maxProjects: profile?.max_projects ?? 1,
  };
}
