import api from './api';

export const searchService = {
  // Full text search
  search: async (query) => {
    return await api.get(`/api/v1/search?query=${encodeURIComponent(query)}`);
  },

  // Semantic search via Elasticsearch
  semanticSearch: async (query) => {
    return await api.get(`/api/v1/search/semantic?query=${encodeURIComponent(query)}`);
  },
};
