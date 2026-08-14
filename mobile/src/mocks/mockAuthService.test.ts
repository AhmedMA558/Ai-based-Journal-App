import { mockAuthService, __resetMfaOverrideForTests, __resetEmailVerifiedOverrideForTests } from './mockAuthService';
import { MOCK_MFA_CODE, mockUser } from './fixtures';

// mockAuthService keeps MFA enrollment state in a module-level variable (not
// per-require, since session.ts's AsyncStorage/SecureStore imports don't
// survive jest.resetModules() outside jest-expo's own mock setup) - reset it
// explicitly between tests instead.
beforeEach(() => {
  __resetMfaOverrideForTests();
  __resetEmailVerifiedOverrideForTests();
});

describe('mockAuthService MFA flow', () => {
  it('starts with 2FA disabled by default (no session set)', async () => {
    const status = await mockAuthService.getMfaStatus();
    expect(status).toEqual({ mfaEnabled: false });
  });

  it('setupMfa returns a secret and a valid otpauth:// URI', async () => {
    const data = await mockAuthService.setupMfa();
    expect(data.secret).toBeTruthy();
    expect(data.otpAuthUri).toMatch(/^otpauth:\/\/totp\//);
    expect(data.otpAuthUri).toContain(data.secret);
  });

  it('enableMfa with the correct code enables 2FA and returns 10 recovery codes', async () => {
    const result = await mockAuthService.enableMfa(MOCK_MFA_CODE);
    expect(result.mfaEnabled).toBe(true);
    expect(result.recoveryCodes).toHaveLength(10);

    const status = await mockAuthService.getMfaStatus();
    expect(status.mfaEnabled).toBe(true);
  });

  it('enableMfa with an incorrect code throws and leaves 2FA disabled', async () => {
    await expect(mockAuthService.enableMfa('000000')).rejects.toThrow('Invalid code');
    const status = await mockAuthService.getMfaStatus();
    expect(status.mfaEnabled).toBe(false);
  });

  it('disableMfa with a valid password and code disables 2FA', async () => {
    await mockAuthService.enableMfa(MOCK_MFA_CODE);
    await mockAuthService.disableMfa(mockUser.password, MOCK_MFA_CODE);
    const status = await mockAuthService.getMfaStatus();
    expect(status.mfaEnabled).toBe(false);
  });

  it('disableMfa with an incorrect code throws', async () => {
    await mockAuthService.enableMfa(MOCK_MFA_CODE);
    await expect(mockAuthService.disableMfa(mockUser.password, '000000')).rejects.toThrow('Failed to disable');
  });
});

describe('mockAuthService.changePassword', () => {
  it('resolves for a known fixture user password', async () => {
    await expect(mockAuthService.changePassword(mockUser.password, 'NewPass123!')).resolves.toBeUndefined();
  });

  it('rejects for an unknown current password', async () => {
    await expect(mockAuthService.changePassword('wrong-password', 'NewPass123!')).rejects.toThrow('Current password is incorrect');
  });
});

describe('mockAuthService forgot/reset password flow', () => {
  it('forgotPassword always resolves regardless of the email given', async () => {
    await expect(mockAuthService.forgotPassword('anyone@example.com')).resolves.toBeUndefined();
  });

  it('resetPassword with the fixture reset code resolves', async () => {
    await expect(mockAuthService.resetPassword('RESET-12345', 'NewPass123!')).resolves.toBeUndefined();
  });

  it('resetPassword with an unknown code rejects', async () => {
    await expect(mockAuthService.resetPassword('WRONG-CODE', 'NewPass123!')).rejects.toThrow('Invalid or expired reset code');
  });
});

describe('mockAuthService email verification flow', () => {
  it('starts unverified by default', async () => {
    const user = await mockAuthService.getCurrentUser();
    expect(user.emailVerified).toBe(false);
  });

  it('verifyEmail with the fixture code marks the account verified', async () => {
    await mockAuthService.verifyEmail('VERIFY-12345');
    const user = await mockAuthService.getCurrentUser();
    expect(user.emailVerified).toBe(true);
  });

  it('verifyEmail with an unknown code rejects and leaves the account unverified', async () => {
    await expect(mockAuthService.verifyEmail('WRONG-CODE')).rejects.toThrow('Invalid or expired verification code');
    const user = await mockAuthService.getCurrentUser();
    expect(user.emailVerified).toBe(false);
  });

  it('resendVerificationEmail resolves', async () => {
    await expect(mockAuthService.resendVerificationEmail()).resolves.toBeUndefined();
  });
});
