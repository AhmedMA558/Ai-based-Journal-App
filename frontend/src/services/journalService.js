import api from './api';

export const journalService = {
  getAllJournals: async () => {
    return await api.get('/api/v1/journals');
  },

  getJournalById: async (id) => {
    return await api.get(`/api/v1/journals/${id}`);
  },

  createJournal: async (journalData) => {
    return await api.post('/api/v1/journals', journalData);
  },

  updateJournal: async (id, journalData) => {
    return await api.put(`/api/v1/journals/${id}`, journalData);
  },

  deleteJournal: async (id) => {
    return await api.delete(`/api/v1/journals/${id}`);
  },
};
