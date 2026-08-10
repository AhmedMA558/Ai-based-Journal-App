import api from './api';

export const userService = {
  getProfile: async () => (await api.get('/api/v1/users/profile'))?.data?.data,

  // Sends the full profile shape (bio/avatarUrl/phoneNumber/country/city) -
  // user-service overwrites all five unconditionally, so a partial object
  // would null out fields not included.
  updateProfile: async (profile) => (await api.put('/api/v1/users/profile', profile))?.data?.data,

  getPreferences: async () => (await api.get('/api/v1/users/preferences'))?.data?.data,

  updatePreferences: async (preferences) =>
    (await api.put('/api/v1/users/preferences', preferences))?.data?.data,

  deleteAccount: async () => (await api.delete('/api/v1/users/account'))?.data?.data,
};
