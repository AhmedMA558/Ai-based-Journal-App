import api from './api';
import type { Journal, JournalInput } from '@/types';

export const journalService = {
  async getAllJournals(): Promise<Journal[]> {
    const res = await api.get('/api/v1/journals');
    const content = res?.data?.data?.content;
    if (Array.isArray(content)) return content;
    if (Array.isArray(res?.data?.content)) return res.data.content;
    if (Array.isArray(res?.data)) return res.data;
    return [];
  },

  async getJournalById(id: Journal['id']): Promise<Journal> {
    const res = await api.get(`/api/v1/journals/${id}`);
    return res?.data?.data;
  },

  async createJournal(journalData: JournalInput): Promise<Journal> {
    const payload = {
      title: journalData.title,
      content: journalData.content,
      mood: journalData.mood || 'HAPPY',
      tags: journalData.tags || [],
      isDraft: false,
      isPinned: false,
      isFavorite: false,
      isArchived: false,
      contentEncrypted: false,
    };
    const res = await api.post('/api/v1/journals', payload);
    return res?.data?.data;
  },

  async updateJournal(id: Journal['id'], journalData: JournalInput): Promise<Journal> {
    const payload = {
      title: journalData.title,
      content: journalData.content,
      mood: journalData.mood || 'HAPPY',
      tags: journalData.tags || [],
      isDraft: false,
      isPinned: false,
      isFavorite: false,
      isArchived: false,
      contentEncrypted: false,
    };
    const res = await api.put(`/api/v1/journals/${id}`, payload);
    return res?.data?.data;
  },

  async deleteJournal(id: Journal['id']): Promise<void> {
    await api.delete(`/api/v1/journals/${id}`);
  },
};
