export type SessionState = 'idle' | 'holding' | 'countdown' | 'active' | 'ended';

export type MissedContent = {
  tweets: number;
  tiktoks: number;
  instagram_posts: number;
  youtube_videos: number;
};

export type ActiveSession = {
  id: string;
  startedAt: Date;
};

export type CompletedSession = {
  id: string;
  durationSeconds: number;
  missedContent: MissedContent;
  endedReason: 'unlock' | 'movement' | 'cancel';
};

export type SessionAction =
  | { type: 'START_HOLDING' }
  | { type: 'RELEASE_HOLD' }
  | { type: 'FILL_COMPLETE' }
  | { type: 'COUNTDOWN_COMPLETE' }
  | { type: 'CANCEL'; message?: string }
  | { type: 'SESSION_STARTED'; session: ActiveSession }
  | { type: 'SESSION_ENDED'; completed: CompletedSession }
  | { type: 'RESTORE_SESSION'; session: ActiveSession }
  | { type: 'DISMISS' };
