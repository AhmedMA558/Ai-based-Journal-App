import type { Mood } from '@/lib/moods';

export interface Journal {
  id: string | number;
  title: string;
  content: string;
  mood: Mood;
  tags: string[];
  createdAt: string;
}

export type JournalInput = Pick<Journal, 'title' | 'content' | 'mood' | 'tags'>;

export interface AuthResult {
  accessToken?: string;
  refreshToken?: string;
  userId?: number;
  username?: string;
  mfaRequired?: boolean;
  challengeToken?: string;
}

export interface CurrentUser {
  id: number;
  username: string;
  email: string;
  fullName: string;
}

export interface MoodDetectionResult {
  primaryMood: string;
  emoji?: string;
}
