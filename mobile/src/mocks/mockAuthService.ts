import { session } from '@/services/session';
import { mockUser, mockMfaUser, MOCK_MFA_CODE, type MockUser } from './fixtures';
import type { AuthResult, CurrentUser, MfaSetupData, MfaEnableResult } from '@/types';

// Mirrors the real authService's exported function signatures exactly (see
// services/authService.ts) so screens/services/index.ts can swap between the two
// with zero screen-level changes, per the Phase 11 plan's two-pass build order.
const KNOWN_USERS: MockUser[] = [mockUser, mockMfaUser];
const MOCK_CHALLENGE_TOKEN = 'mock-challenge-token';
const MOCK_RECOVERY_CODE = 'ABCDE-12345';
const MOCK_PASSWORD_RESET_CODE = 'RESET-12345';
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

// Overridable MFA state for the Settings screen's setup/enable/disable flow -
// null means "not yet touched this session", falling back to whichever
// fixture user is currently logged in (mockMfaUser starts enabled, demo
// starts disabled). Once setup/enable/disable runs, the override wins
// regardless of user, so either fixture account can walk the full flow.
let mfaEnabledOverride: boolean | null = null;
const MOCK_MFA_SECRET = 'JBSWY3DPEHPK3PXP';
const MOCK_RECOVERY_CODES = Array.from({ length: 10 }, (_, i) => `MOCK${(i + 1).toString().padStart(2, '0')}-RECVR`);

// Test-only: resets the module-level MFA override between test cases without
// re-requiring the module (a fresh require would re-import session.ts's
// AsyncStorage/SecureStore native modules outside jest-expo's normal mock
// setup and crash - session.ts itself has no per-user state to reset).
export function __resetMfaOverrideForTests() {
  mfaEnabledOverride = null;
}

async function effectiveMfaEnabled(): Promise<boolean> {
  if (mfaEnabledOverride !== null) return mfaEnabledOverride;
  const username = await session.getUserName();
  return username === mockMfaUser.username;
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

  async changePassword(currentPassword: string, _newPassword: string): Promise<void> {
    if (currentPassword !== mockUser.password && currentPassword !== mockMfaUser.password) {
      return delay(undefined).then(() => {
        throw new Error('Current password is incorrect.');
      });
    }
    return delay(undefined);
  },

  async getMfaStatus(): Promise<{ mfaEnabled: boolean }> {
    return delay({ mfaEnabled: await effectiveMfaEnabled() });
  },

  async setupMfa(): Promise<MfaSetupData> {
    const username = await session.getUserName();
    return delay({
      secret: MOCK_MFA_SECRET,
      otpAuthUri: `otpauth://totp/Mindora:${encodeURIComponent(username)}?secret=${MOCK_MFA_SECRET}&issuer=Mindora`,
    });
  },

  async enableMfa(code: string): Promise<MfaEnableResult> {
    if (code !== MOCK_MFA_CODE) {
      return delay(undefined).then(() => {
        throw new Error('Invalid code. Please try again.');
      });
    }
    mfaEnabledOverride = true;
    return delay({ mfaEnabled: true, recoveryCodes: MOCK_RECOVERY_CODES });
  },

  async disableMfa(password: string, code: string): Promise<void> {
    if (code !== MOCK_MFA_CODE) {
      return delay(undefined).then(() => {
        throw new Error('Failed to disable 2FA.');
      });
    }
    if (password !== mockUser.password && password !== mockMfaUser.password) {
      return delay(undefined).then(() => {
        throw new Error('Failed to disable 2FA.');
      });
    }
    mfaEnabledOverride = false;
    return delay(undefined);
  },

  async logout(): Promise<void> {
    await session.clear();
  },

  // Pass A has no real email to check against - always "succeeds" (same
  // no-op-success shape as register()), matching the real service's own
  // enumeration-safe "always the same response" behavior.
  async forgotPassword(_email: string): Promise<void> {
    return delay(undefined);
  },

  async resetPassword(resetCode: string, _newPassword: string): Promise<void> {
    if (resetCode !== MOCK_PASSWORD_RESET_CODE) {
      return delay(undefined).then(() => {
        throw new Error('Invalid or expired reset code.');
      });
    }
    return delay(undefined);
  },

  isAuthenticated: () => session.isAuthenticated(),
  touchSession: () => session.touchSession(),
};
