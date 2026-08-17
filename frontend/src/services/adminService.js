import api from './api';

export const adminService = {
  // Fixed larger single-page fetch rather than building pagination UI - same
  // demo-scale simplification SearchView already uses.
  listUsers: async (page = 0, size = 100) => {
    return await api.get(`/api/v1/auth/admin/users?page=${page}&size=${size}`);
  },

  updateRoles: async (userId, roles) => {
    return await api.put(`/api/v1/auth/admin/users/${userId}/roles`, { roles });
  },

  updateStatus: async (userId, enabled) => {
    return await api.put(`/api/v1/auth/admin/users/${userId}/status`, { enabled });
  },

  resetMfa: async (userId) => {
    return await api.post(`/api/v1/auth/admin/users/${userId}/mfa-reset`);
  },
};
