import api from './api';

export const aiService = {
  // Detect Mood with Emoji 😊
  detectMood: async (content) => {
    return await api.post('/api/v1/ai/mood', { content });
  },

  // Summarize Journal Entry
  summarize: async (content) => {
    return await api.post('/api/v1/ai/summarize', { content });
  },

  // Chat with Journal AI
  chat: async (query) => {
    return await api.post('/api/v1/ai/chat', { query });
  },

  // Generate Tags
  generateTags: async (content) => {
    return await api.post('/api/v1/ai/tags', { content });
  },

  // Get Personal Recommendations
  getRecommendations: async (mood) => {
    return await api.post('/api/v1/ai/recommendations', { mood });
  },
};
