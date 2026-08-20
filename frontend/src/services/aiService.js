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

  // Rephrase Text
  rephrase: async (content) => {
    return await api.post('/api/v1/ai/rephrase', { content });
  },

  // Fix Grammar & Spelling
  fixGrammar: async (content) => {
    return await api.post('/api/v1/ai/grammar', { content });
  },

  // Chat with Journal AI - context is optional recent-journal text so the
  // reply can be aware of what the user has actually been writing about.
  chat: async (query, context) => {
    return await api.post('/api/v1/ai/chat', { query, context: context || '' });
  },

  // Generate Tags
  generateTags: async (content) => {
    return await api.post('/api/v1/ai/tags', { content });
  },

  // Get Personal Recommendations
  getRecommendations: async (mood, content) => {
    return await api.post('/api/v1/ai/recommendations', { mood, content });
  },
};
