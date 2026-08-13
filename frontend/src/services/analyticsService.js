import api from './api';

export const analyticsService = {
  getInsights: async () => {
    return await api.get('/api/v1/analytics/insights');
  },
};
