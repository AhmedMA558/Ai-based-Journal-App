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

// Permissive shape for navigating to JournalEditorScreen - both a full Journal
// and a SearchResult (optional mood/tags) satisfy this without a cast.
export interface JournalRef {
  id?: string | number;
  title?: string;
  content?: string;
  mood?: string;
  tags?: string[];
}

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
  emailVerified?: boolean;
}

export interface MoodDetectionResult {
  primaryMood: string;
  emoji?: string;
}

export interface SearchResult {
  id: string | number;
  title?: string;
  content?: string;
  mood?: string;
  tags?: string[];
  createdAt?: string;
}

export interface ProfileData {
  bio?: string;
  avatarUrl?: string;
  phoneNumber?: string;
  country?: string;
  city?: string;
}

export interface MfaSetupData {
  secret: string;
  otpAuthUri: string;
}

export interface MfaEnableResult {
  mfaEnabled: boolean;
  recoveryCodes: string[];
}

export interface Insights {
  longestStreakDays: number;
  writingFrequency: string;
  mostProductiveDays: string[];
  topTopics: string[];
}

export interface LoginHistoryEntry {
  id: number;
  loginTime: string;
  ipAddress?: string;
  userAgent?: string;
  status: string;
}

export interface LoginHistoryPage {
  content: LoginHistoryEntry[];
}

export interface NotificationItem {
  id: number;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
}
