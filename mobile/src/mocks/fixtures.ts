import type { Mood } from '@/lib/moods';

export interface MockJournal {
  id: string;
  title: string;
  content: string;
  mood: Mood;
  tags: string[];
  createdAt: string;
}

export interface MockUser {
  id: number;
  username: string;
  password: string;
  email: string;
  fullName: string;
  mfaEnabled: boolean;
}

// Standard demo user - no MFA, used for the main happy-path prototype flow.
export const mockUser: MockUser = {
  id: 1,
  username: 'demo',
  password: 'password123',
  email: 'demo@mindora.app',
  fullName: 'Demo Journaler',
  mfaEnabled: false,
};

// Second fixture user with MFA enabled, so the MfaChallengeScreen path is
// reachable in the prototype without a live TOTP backend.
export const mockMfaUser: MockUser = {
  id: 2,
  username: 'mfa_demo',
  password: 'password123',
  email: 'mfa.demo@mindora.app',
  fullName: 'Secure Demo User',
  mfaEnabled: true,
};

// The one code that always verifies in the mock MFA challenge - keeps the
// prototype fully tappable without generating a real TOTP code.
export const MOCK_MFA_CODE = '123456';

function daysAgoIso(days: number, hour = 9): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

// Spans a real 3-day consecutive streak (today, yesterday, 2 days ago) plus
// older scattered entries, so Dashboard's streak card, mood badges, and list
// scrolling all look like a real, lived-in account rather than an empty demo.
export const mockJournals: MockJournal[] = [
  {
    id: 'mock-1',
    title: 'Shipped the new onboarding flow',
    content: 'Finally got the onboarding redesign live today. The team was thrilled with how smooth it felt in testing.',
    mood: 'EXCITED',
    tags: ['work', 'milestone'],
    createdAt: daysAgoIso(0, 8),
  },
  {
    id: 'mock-2',
    title: 'Quiet morning walk',
    content: 'Took a slow walk before the day got busy. Felt calm and present, watched the fog lift over the park.',
    mood: 'RELAXED',
    tags: ['mindfulness', 'morning'],
    createdAt: daysAgoIso(1, 7),
  },
  {
    id: 'mock-3',
    title: 'Overwhelmed by the deadline crunch',
    content: 'Three deliverables due the same day. Feeling stretched thin and a little anxious about the workload.',
    mood: 'STRESSED',
    tags: ['work', 'deadline'],
    createdAt: daysAgoIso(2, 21),
  },
  {
    id: 'mock-4',
    title: 'Grateful for an old friend calling',
    content: 'Didn\'t expect to hear from her after all these years. Made me appreciate how good it feels to reconnect.',
    mood: 'GRATEFUL',
    tags: ['friendship', 'gratitude'],
    createdAt: daysAgoIso(4, 19),
  },
  {
    id: 'mock-5',
    title: 'Rough day after the setback',
    content: 'The launch got pushed back again. Trying not to let it get to me but it stings a bit tonight.',
    mood: 'SAD',
    tags: ['work', 'reflection'],
    createdAt: daysAgoIso(6, 22),
  },
  {
    id: 'mock-6',
    title: 'Frustrated with the flaky CI pipeline',
    content: 'Same test failed for the fourth time today for no real reason. Losing patience with the build system.',
    mood: 'ANGRY',
    tags: ['work', 'engineering'],
    createdAt: daysAgoIso(8, 15),
  },
  {
    id: 'mock-7',
    title: 'Weekend trip planning',
    content: 'Booked a cabin for next month. Already looking forward to disconnecting for a few days.',
    mood: 'HAPPY',
    tags: ['travel', 'plans'],
    createdAt: daysAgoIso(10, 12),
  },
  {
    id: 'mock-8',
    title: 'Concert night',
    content: 'First live show in ages tonight. The energy in the room was unreal, still buzzing from it.',
    mood: 'EXCITED',
    tags: ['music', 'friends'],
    createdAt: daysAgoIso(13, 23),
  },
  {
    id: 'mock-9',
    title: 'Slow Sunday reset',
    content: 'Made tea, read for a while, didn\'t look at my phone much. Exactly what I needed.',
    mood: 'RELAXED',
    tags: ['self-care', 'weekend'],
    createdAt: daysAgoIso(15, 10),
  },
];
