import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Journal } from '@/types';

const CACHE_KEY = 'mindora_offline_journals_cache';

// Last-known-good journal list, used by journalService.getAllJournals() as a
// fallback when the live fetch fails - the read half of offline support.
export async function getCachedJournals(): Promise<Journal[] | null> {
  const raw = await AsyncStorage.getItem(CACHE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function setCachedJournals(list: Journal[]): Promise<void> {
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(list));
}
