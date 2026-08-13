import api from './api';

export const recommendationService = {
  async getSuggestion(): Promise<string | null> {
    const res = await api.get('/api/v1/recommendations');
    const prompts = res?.data?.data?.recommendedPrompts;
    return Array.isArray(prompts) && prompts.length > 0 ? prompts[0] : null;
  },
};
