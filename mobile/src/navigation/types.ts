import type { NavigatorScreenParams } from '@react-navigation/native';
import type { JournalRef } from '@/types';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  MfaChallenge: { challengeToken: string };
};

export type MainTabParamList = {
  Dashboard: undefined;
  Journals: undefined;
  Calendar: undefined;
  Search: undefined;
  Chat: undefined;
  Analytics: undefined;
  Settings: undefined;
};

export type MainStackParamList = {
  Tabs: NavigatorScreenParams<MainTabParamList> | undefined;
  JournalEditor: { journal?: JournalRef } | undefined;
  Achievements: undefined;
  Notifications: undefined;
  CommandPalette: undefined;
};
