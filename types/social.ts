export type LeaderboardEntry = {
  rank: number;
  userId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  weeklySeconds: number;
  isCurrentUser: boolean;
};

export type FriendRequest = {
  id: string;
  requester: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  createdAt: string;
};

export type Friend = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
};
