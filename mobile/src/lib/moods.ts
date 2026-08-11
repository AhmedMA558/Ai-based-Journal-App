// Ported near-verbatim from frontend/src/lib/moods.ts - pure TypeScript, no
// DOM dependency, single source of truth shared conceptually with the web app.
export type Mood =
  | 'HAPPY'
  | 'EXCITED'
  | 'RELAXED'
  | 'STRESSED'
  | 'SAD'
  | 'GRATEFUL'
  | 'ANGRY';

export interface MoodMeta {
  key: Mood;
  label: string;
  emoji: string;
  bg: string;
  border: string;
  text: string;
}

export const MOODS: Mood[] = [
  'HAPPY',
  'EXCITED',
  'RELAXED',
  'STRESSED',
  'SAD',
  'GRATEFUL',
  'ANGRY',
];

export type MoodFilter = 'ALL' | Mood;

export const MOOD_FILTERS: MoodFilter[] = ['ALL', ...MOODS];

export const MOOD_META: Record<Mood, MoodMeta> = {
  HAPPY: {
    key: 'HAPPY',
    label: 'Happy',
    emoji: '😊',
    bg: 'rgba(74, 222, 128, 0.15)',
    border: 'rgba(74, 222, 128, 0.4)',
    text: '#4ade80',
  },
  EXCITED: {
    key: 'EXCITED',
    label: 'Excited',
    emoji: '🤩',
    bg: 'rgba(253, 224, 71, 0.15)',
    border: 'rgba(253, 224, 71, 0.4)',
    text: '#fde047',
  },
  RELAXED: {
    key: 'RELAXED',
    label: 'Relaxed',
    emoji: '😌',
    bg: 'rgba(56, 189, 248, 0.15)',
    border: 'rgba(56, 189, 248, 0.4)',
    text: '#38bdf8',
  },
  STRESSED: {
    key: 'STRESSED',
    label: 'Stressed',
    emoji: '😰',
    bg: 'rgba(248, 113, 113, 0.15)',
    border: 'rgba(248, 113, 113, 0.4)',
    text: '#f87171',
  },
  SAD: {
    key: 'SAD',
    label: 'Sad',
    emoji: '🥺',
    bg: 'rgba(192, 132, 252, 0.15)',
    border: 'rgba(192, 132, 252, 0.4)',
    text: '#c084fc',
  },
  GRATEFUL: {
    key: 'GRATEFUL',
    label: 'Grateful',
    emoji: '🙏',
    bg: 'rgba(251, 113, 133, 0.15)',
    border: 'rgba(251, 113, 133, 0.4)',
    text: '#fb7185',
  },
  ANGRY: {
    key: 'ANGRY',
    label: 'Angry',
    emoji: '😠',
    bg: 'rgba(239, 68, 68, 0.2)',
    border: 'rgba(239, 68, 68, 0.5)',
    text: '#ef4444',
  },
};
