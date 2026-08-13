import api from './api';
import type { Insights } from '@/types';

export const analyticsService = {
  async getInsights(): Promise<Insights | null> {
    const res = await api.get('/api/v1/analytics/insights');
    const data = res?.data?.data;
    return data && typeof data === 'object' ? (data as Insights) : null;
  },
};
