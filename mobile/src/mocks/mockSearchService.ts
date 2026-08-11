import { mockJournals } from './fixtures';
import type { MoodFilter } from '@/lib/moods';
import type { SearchResult } from '@/types';

interface SearchOptions {
  query?: string;
  mood?: MoodFilter;
  page?: number;
  size?: number;
}

const ARTIFICIAL_DELAY_MS = 300;

// Same signature as searchService.ts's search() - simple substring match over
// the fixture data instead of a real Elasticsearch query, close enough to
// exercise the query/mood-filter/debounce UI without a live backend.
export const mockSearchService = {
  async search({ query, mood }: SearchOptions): Promise<SearchResult[]> {
    const needle = (query || '').trim().toLowerCase();
    const results = mockJournals.filter((j) => {
      const matchesQuery = !needle || j.title.toLowerCase().includes(needle) || j.content.toLowerCase().includes(needle);
      const matchesMood = !mood || mood === 'ALL' || j.mood === mood;
      return matchesQuery && matchesMood;
    });
    return new Promise((resolve) => setTimeout(() => resolve(results), ARTIFICIAL_DELAY_MS));
  },
};
