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
  // history is prior conversation turns ([{role: 'user'|'assistant',
  // content}], oldest first) - without it, a real LLM provider has no
  // memory of the conversation and every message gets evaluated in
  // isolation, which is what let the old canned-reply fallback repeat the
  // same response for unrelated messages.
  chat: async (query, context, history) => {
    return await api.post('/api/v1/ai/chat', { query, context: context || '', history: history || [] });
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
