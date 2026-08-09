import api from './api';

export const searchService = {
  /**
   * Full-text search, user-scoped, with optional mood/tag filters and pagination.
   * @param {{ query?: string, mood?: string, tag?: string, page?: number, size?: number }} [options]
   */
  search: async ({ query, mood, tag, page = 0, size = 10 } = {}) => {
    const params = new URLSearchParams();
    if (query) params.set('query', query);
    if (mood && mood !== 'ALL') params.set('mood', mood);
    if (tag) params.set('tag', tag);
    params.set('page', String(page));
    params.set('size', String(size));
    return await api.get(`/api/v1/search?${params.toString()}`);
  },

  /**
   * Relevance-ranked, typo-tolerant search via Elasticsearch fuzzy matching.
   * @param {string} query
   * @param {{ page?: number, size?: number }} [options]
   */
  semanticSearch: async (query, { page = 0, size = 10 } = {}) => {
    const params = new URLSearchParams({ query, page: String(page), size: String(size) });
    return await api.get(`/api/v1/search/semantic?${params.toString()}`);
  },
};
