export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          display_name: string | null;
          avatar_url: string | null;
          push_token: string | null;
          streak_reminder_hour: number;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id: string;
          username: string;
          display_name?: string | null;
          avatar_url?: string | null;
          push_token?: string | null;
          streak_reminder_hour?: number;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          username?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          push_token?: string | null;
          streak_reminder_hour?: number;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      sessions: {
        Row: {
          id: string;
          user_id: string;
          started_at: string;
          ended_at: string | null;
          duration_seconds: number | null;
          ended_reason: 'unlock' | 'movement' | 'cancel' | null;
          challenge_id: string | null;
          missed_content: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          started_at: string;
          ended_at?: string | null;
          duration_seconds?: number | null;
          ended_reason?: 'unlock' | 'movement' | 'cancel' | null;
          challenge_id?: string | null;
          missed_content?: Json;
          created_at?: string;
        };
        Update: {
          ended_at?: string | null;
          duration_seconds?: number | null;
          ended_reason?: 'unlock' | 'movement' | 'cancel' | null;
          challenge_id?: string | null;
          missed_content?: Json;
        };
        Relationships: [];
      };
      streaks: {
        Row: {
          id: string;
          user_id: string;
          current_streak: number;
          longest_streak: number;
          last_session_date: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          current_streak?: number;
          longest_streak?: number;
          last_session_date?: string | null;
          updated_at?: string;
        };
        Update: {
          current_streak?: number;
          longest_streak?: number;
          last_session_date?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      friendships: {
        Row: {
          id: string;
          requester_id: string;
          addressee_id: string;
          status: 'pending' | 'accepted' | 'declined';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          requester_id: string;
          addressee_id: string;
          status?: 'pending' | 'accepted' | 'declined';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: 'pending' | 'accepted' | 'declined';
          updated_at?: string;
        };
        Relationships: [];
      };
      challenges: {
        Row: {
          id: string;
          challenger_id: string;
          challenged_id: string | null;
          status: 'pending' | 'accepted' | 'active' | 'completed' | 'expired' | 'declined';
          winner_id: string | null;
          challenger_duration: number | null;
          challenged_duration: number | null;
          invite_token: string;
          created_at: string;
          expires_at: string | null;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          challenger_id: string;
          challenged_id?: string | null;
          status?: 'pending' | 'accepted' | 'active' | 'completed' | 'expired' | 'declined';
          winner_id?: string | null;
          challenger_duration?: number | null;
          challenged_duration?: number | null;
          invite_token: string;
          created_at?: string;
          expires_at?: string | null;
          completed_at?: string | null;
        };
        Update: {
          status?: 'pending' | 'accepted' | 'active' | 'completed' | 'expired' | 'declined';
          winner_id?: string | null;
          challenger_duration?: number | null;
          challenged_duration?: number | null;
          completed_at?: string | null;
        };
        Relationships: [];
      };
      challenge_records: {
        Row: {
          user_id: string;
          wins: number;
          losses: number;
          total_challenges: number;
        };
        Insert: {
          user_id: string;
          wins?: number;
          losses?: number;
          total_challenges?: number;
        };
        Update: {
          wins?: number;
          losses?: number;
          total_challenges?: number;
        };
        Relationships: [];
      };
    };
    Views: {
      daily_session_totals: {
        Row: {
          user_id: string;
          session_date: string;
          session_count: number;
          total_seconds: number;
        };
        Relationships: [];
      };
      user_stats: {
        Row: {
          user_id: string;
          total_sever_seconds: number;
          best_session_seconds: number;
          total_sessions: number;
        };
        Relationships: [];
      };
    };
    Functions: {
      end_session: {
        Args: { p_session_id: string; p_ended_reason: string; p_missed_content?: Json };
        Returns: number;
      };
      update_streak: {
        Args: { p_user_id: string };
        Returns: undefined;
      };
      get_friends_leaderboard: {
        Args: { p_user_id: string };
        Returns: {
          user_id: string;
          username: string;
          display_name: string | null;
          avatar_url: string | null;
          weekly_seconds: number;
        }[];
      };
      get_global_leaderboard: {
        Args: Record<string, never>;
        Returns: {
          user_id: string;
          username: string;
          display_name: string | null;
          avatar_url: string | null;
          weekly_seconds: number;
        }[];
      };
      resolve_challenge: {
        Args: { p_challenge_id: string };
        Returns: undefined;
      };
    };
    Enums: {};
    CompositeTypes: {};
  };
};
