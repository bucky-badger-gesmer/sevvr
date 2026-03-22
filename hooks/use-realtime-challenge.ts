import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Challenge } from '@/types/social';

type OpponentStatus = 'waiting' | 'active' | 'completed';

export function useRealtimeChallenge(challengeId: string | null): {
  challenge: Challenge | null;
  opponentStatus: OpponentStatus;
} {
  const [challenge, setChallenge] = useState<Challenge | null>(null);

  // Initial fetch
  useEffect(() => {
    if (!challengeId) return;
    supabase
      .from('challenges')
      .select('*')
      .eq('id', challengeId)
      .single()
      .then(({ data }) => { if (data) setChallenge(data); });
  }, [challengeId]);

  // Realtime subscription
  useEffect(() => {
    if (!challengeId) return;

    const channel = supabase
      .channel(`challenge:${challengeId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'challenges',
          filter: `id=eq.${challengeId}`,
        },
        (payload) => {
          setChallenge(payload.new as Challenge);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [challengeId]);

  const opponentStatus: OpponentStatus = (() => {
    if (!challenge) return 'waiting';
    if (challenge.status === 'completed') return 'completed';
    if (challenge.status === 'active') return 'active';
    return 'waiting';
  })();

  return { challenge, opponentStatus };
}
