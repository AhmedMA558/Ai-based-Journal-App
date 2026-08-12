import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCachedJournals, setCachedJournals } from './offlineCache';
import type { Journal } from '@/types';

const journal: Journal = {
  id: 1,
  title: 'Reflection',
  content: 'Today was good.',
  mood: 'HAPPY',
  tags: ['life'],
  createdAt: '2026-01-01T00:00:00.000Z',
};

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('offlineCache', () => {
  it('returns null when nothing has been cached yet', async () => {
    expect(await getCachedJournals()).toBeNull();
  });

  it('round-trips a journal list through setCachedJournals/getCachedJournals', async () => {
    await setCachedJournals([journal]);
    expect(await getCachedJournals()).toEqual([journal]);
  });

  it('overwrites the previous cache on a second write', async () => {
    await setCachedJournals([journal]);
    await setCachedJournals([]);
    expect(await getCachedJournals()).toEqual([]);
  });
});
