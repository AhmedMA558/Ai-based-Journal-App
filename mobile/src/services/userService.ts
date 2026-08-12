import api from './api';
import type { ProfileData } from '@/types';

// Ported from frontend/src/services/userService.js - only getProfile/updateProfile
// (the two SettingsModal.tsx's Profile tab actually calls; preferences/deleteAccount
// aren't part of this phase's scope).
export const userService = {
  async getProfile(): Promise<ProfileData> {
    const res = await api.get('/api/v1/users/profile');
    return res?.data?.data || {};
  },

  // Sends the full profile shape (bio/avatarUrl/phoneNumber/country/city) -
  // user-service overwrites all five unconditionally, so a partial object
  // would null out fields not included.
  async updateProfile(profile: ProfileData): Promise<ProfileData> {
    const res = await api.put('/api/v1/users/profile', profile);
    return res?.data?.data || profile;
  },
};
