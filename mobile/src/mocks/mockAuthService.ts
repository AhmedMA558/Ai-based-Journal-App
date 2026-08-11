import { session } from '@/services/session';
import { mockUser, mockMfaUser, MOCK_MFA_CODE, type MockUser } from './fixtures';
import type { AuthResult, CurrentUser } from '@/types';

// Mirrors the real authService's exported function signatures exactly (see
// services/authService.ts) so screens/services/index.ts can swap between the two
// with zero screen-level changes, per the Phase 11 plan's two-pass build order.
const KNOWN_USERS: MockUser[] = [mockUser, mockMfaUser];
const MOCK_CHALLENGE_TOKEN = 'mock-challenge-token';
const MOCK_RECOVERY_CODE = 'ABCDE-12345';
const ARTIFICIAL_DELAY_MS = 450;

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ARTIFICIAL_DELAY_MS));
}

function findUser(usernameOrEmail: string): MockUser | undefined {
  const needle = usernameOrEmail.trim().toLowerCase();
  return KNOWN_USERS.find((u) => u.username.toLowerCase() === needle || u.email.toLowerCase() === needle);
}

function fakeToken(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2)}`;
}

async function issueSession(user: MockUser): Promise<AuthResult> {
  const result: AuthResult = {
    accessToken: fakeToken('mock-access'),
    refreshToken: fakeToken('mock-refresh'),
    userId: user.id,
    username: user.username,
  };
  await session.setSession(result.accessToken!, result.refreshToken, result.userId, result.username);
  return result;
}

export const mockAuthService = {
  async login(usernameOrEmail: string, password: string): Promise<AuthResult> {
    const user = findUser(usernameOrEmail);
    if (!user || user.password !== password) {
      return delay(undefined).then(() => {
        throw new Error('Invalid username/email or password.');
      });
    }
    if (user.mfaEnabled) {
      return delay({ mfaRequired: true, challengeToken: MOCK_CHALLENGE_TOKEN });
    }
    return delay(await issueSession(user));
  },

  async register(username: string, _email: string, _password: string, _fullName: string): Promise<AuthResult> {
    // Prototype registration always succeeds and logs straight in as a fresh
    // (non-MFA) session - there's no persistent mock user store to write to.
    const result: AuthResult = {
      accessToken: fakeToken('mock-access'),
      refreshToken: fakeToken('mock-refresh'),
      userId: 999,
      username,
    };
    await session.setSession(result.accessToken!, result.refreshToken, result.userId, result.username);
    return delay(result);
  },

  async verifyMfa(challengeToken: string, code?: string, recoveryCode?: string): Promise<AuthResult> {
    if (challengeToken !== MOCK_CHALLENGE_TOKEN) {
      return delay(undefined).then(() => {
        throw new Error('This verification session has expired. Please sign in again.');
      });
    }
    const codeOk = code === MOCK_MFA_CODE;
    const recoveryOk = recoveryCode === MOCK_RECOVERY_CODE;
    if (!codeOk && !recoveryOk) {
      return delay(undefined).then(() => {
        throw new Error('Incorrect code. Please try again.');
      });
    }
    return delay(await issueSession(mockMfaUser));
  },

  async refreshAccessToken(): Promise<string> {
    const newToken = fakeToken('mock-access');
    const username = await session.getUserName();
    await session.setSession(newToken, fakeToken('mock-refresh'), undefined, username);
    return newToken;
  },

  async getCurrentUser(): Promise<CurrentUser> {
    const username = await session.getUserName();
    const user = KNOWN_USERS.find((u) => u.username === username) || mockUser;
    return delay({ id: user.id, username: user.username, email: user.email, fullName: user.fullName });
  },

  async logout(): Promise<void> {
    await session.clear();
  },

  isAuthenticated: () => session.isAuthenticated(),
  touchSession: () => session.touchSession(),
};
