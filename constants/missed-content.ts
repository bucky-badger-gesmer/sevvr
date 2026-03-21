import type { MissedContent } from '@/types/session';

export const CONTENT_RATES_PER_HOUR = {
  tweets: 300,
  tiktoks: 34,
  instagram_posts: 42,
  youtube_videos: 12,
};

export function calculateMissedContent(durationSeconds: number): MissedContent {
  const hours = durationSeconds / 3600;
  return {
    tweets: Math.round(CONTENT_RATES_PER_HOUR.tweets * hours),
    tiktoks: Math.round(CONTENT_RATES_PER_HOUR.tiktoks * hours),
    instagram_posts: Math.round(CONTENT_RATES_PER_HOUR.instagram_posts * hours),
    youtube_videos: Math.round(CONTENT_RATES_PER_HOUR.youtube_videos * hours),
  };
}
