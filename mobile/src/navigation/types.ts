import type { Journal } from '@/types';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  MfaChallenge: { challengeToken: string };
};

export type MainTabParamList = {
  Dashboard: undefined;
  Journals: undefined;
};

export type MainStackParamList = {
  Tabs: undefined;
  JournalEditor: { journal?: Journal } | undefined;
};
