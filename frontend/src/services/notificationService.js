import api from './api';

export const notificationService = {
  // Fixed single-page fetch rather than building pagination UI - same
  // demo-scale simplification adminService/SearchView already use.
  list: async (page = 0, size = 20) => {
    return await api.get(`/api/v1/notifications?page=${page}&size=${size}`);
  },

  markAllRead: async () => {
    return await api.put('/api/v1/notifications/read-all');
  },
};
