import api from './api';
import type { MoodFilter } from '@/lib/moods';
import type { SearchResult } from '@/types';

interface SearchOptions {
  query?: string;
  mood?: MoodFilter;
  page?: number;
  size?: number;
}

// Ported from frontend/src/services/searchService.js's search() - full-text,
// user-scoped, optional mood filter, real Elasticsearch relevance ranking via
// search-service. Requesting a larger single page (50) rather than building
// pagination controls, matching the web app's approach.
export const searchService = {
  async search({ query, mood, page = 0, size = 50 }: SearchOptions): Promise<SearchResult[]> {
    const params = new URLSearchParams();
    if (query) params.set('query', query);
    if (mood && mood !== 'ALL') params.set('mood', mood);
    params.set('page', String(page));
    params.set('size', String(size));
    const res = await api.get(`/api/v1/search?${params.toString()}`);
    const content = res?.data?.data?.content;
    return Array.isArray(content) ? content : [];
  },
};
