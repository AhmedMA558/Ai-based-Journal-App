import type { Insights } from '@/types';

const ARTIFICIAL_DELAY_MS = 300;

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ARTIFICIAL_DELAY_MS));
}

// Pass A has no backend for this either - canned values shaped to look
// realistic against the mock journal fixtures, matching the real service's
// response shape exactly.
export const mockAnalyticsService = {
  async getInsights(): Promise<Insights | null> {
    return delay({
      longestStreakDays: 4,
      writingFrequency: '3.2 entries / week',
      mostProductiveDays: ['Sunday'],
      topTopics: ['gratitude', 'work', 'family'],
    });
  },
};
