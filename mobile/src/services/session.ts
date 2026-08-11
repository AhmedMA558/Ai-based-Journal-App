import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Same 10-minute client-side sliding-expiry model as frontend/src/services/authService.js,
// just with the storage layer swapped: SecureStore (Keystore-backed) for the two JWTs,
// AsyncStorage for everything else. One store per sensitivity tier, unlike the web app's
// redundant cookie+localStorage dual-write for the access token.
const SESSION_DURATION_MS = 10 * 60 * 1000;

const KEYS = {
  token: 'jwt_token',
  refreshToken: 'jwt_refresh_token',
  userId: 'user_id',
  userName: 'user_name',
  sessionExpiry: 'session_expiry',
} as const;

export const session = {
  async setSession(token: string, refreshToken: string | undefined, userId: number | string | undefined, username: string | undefined) {
    const expiryTime = Date.now() + SESSION_DURATION_MS;
    await SecureStore.setItemAsync(KEYS.token, token);
    if (refreshToken) {
      await SecureStore.setItemAsync(KEYS.refreshToken, refreshToken);
    }
    await AsyncStorage.setItem(KEYS.userId, String(userId ?? '1'));
    const existingName = (await AsyncStorage.getItem(KEYS.userName)) || 'Journaler';
    await AsyncStorage.setItem(KEYS.userName, username || existingName);
    await AsyncStorage.setItem(KEYS.sessionExpiry, String(expiryTime));
  },

  async touchSession() {
    const expiry = await AsyncStorage.getItem(KEYS.sessionExpiry);
    if (expiry && Date.now() < parseInt(expiry, 10)) {
      await AsyncStorage.setItem(KEYS.sessionExpiry, String(Date.now() + SESSION_DURATION_MS));
    }
  },

  async getToken(): Promise<string | null> {
    if (!(await session.isAuthenticated())) return null;
    return SecureStore.getItemAsync(KEYS.token);
  },

  async getRefreshToken(): Promise<string | null> {
    return SecureStore.getItemAsync(KEYS.refreshToken);
  },

  async getUserName(): Promise<string> {
    return (await AsyncStorage.getItem(KEYS.userName)) || 'Journaler';
  },

  async isAuthenticated(): Promise<boolean> {
    const token = await SecureStore.getItemAsync(KEYS.token);
    const expiry = await AsyncStorage.getItem(KEYS.sessionExpiry);
    if (!token || !expiry) return false;

    if (Date.now() > parseInt(expiry, 10)) {
      await session.clear();
      return false;
    }
    return true;
  },

  async clear() {
    await SecureStore.deleteItemAsync(KEYS.token);
    await SecureStore.deleteItemAsync(KEYS.refreshToken);
    await AsyncStorage.multiRemove([KEYS.userId, KEYS.userName, KEYS.sessionExpiry]);
  },
};
