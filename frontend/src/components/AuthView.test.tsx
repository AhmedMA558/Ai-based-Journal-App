import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AuthView from './AuthView';
import { authService } from '@/services/authService';

vi.mock('@/services/authService', () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    verifyMfa: vi.fn(),
  },
}));

const mockedLogin = vi.mocked(authService.login);
const mockedRegister = vi.mocked(authService.register);
const mockedVerifyMfa = vi.mocked(authService.verifyMfa);

describe('AuthView', () => {
  beforeEach(() => {
    mockedLogin.mockReset();
    mockedRegister.mockReset();
    mockedVerifyMfa.mockReset();
  });

  it('shows the login form by default', () => {
    render(<AuthView onLoginSuccess={vi.fn()} />);
    expect(screen.getByText('Welcome Back to AURA')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('alex_dev or alex@example.com')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('John Doe')).not.toBeInTheDocument();
  });

  it('switches to the register form, revealing full name and email fields', async () => {
    const user = userEvent.setup();
    render(<AuthView onLoginSuccess={vi.fn()} />);

    await user.click(screen.getByText(/Don't have an account\?/));

    expect(screen.getByText('Create Your AURA Account')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('John Doe')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('alex@example.com')).toBeInTheDocument();
  });

  it('logs in with the entered credentials and calls onLoginSuccess', async () => {
    mockedLogin.mockResolvedValue({ data: { data: { accessToken: 'tok', mfaRequired: false } } } as any);
    const user = userEvent.setup();
    const onLoginSuccess = vi.fn();
    render(<AuthView onLoginSuccess={onLoginSuccess} />);

    await user.type(screen.getByPlaceholderText('alex_dev or alex@example.com'), 'alex_dev');
    await user.type(screen.getByPlaceholderText('••••••••••••'), 'hunter2');
    await user.click(screen.getByRole('button', { name: /Sign In/ }));

    expect(mockedLogin).toHaveBeenCalledWith('alex_dev', 'hunter2');
    expect(onLoginSuccess).toHaveBeenCalledTimes(1);
  });

  it('shows an error message and does not call onLoginSuccess when login fails', async () => {
    mockedLogin.mockRejectedValue(new Error('Invalid credentials'));
    const user = userEvent.setup();
    const onLoginSuccess = vi.fn();
    render(<AuthView onLoginSuccess={onLoginSuccess} />);

    await user.type(screen.getByPlaceholderText('alex_dev or alex@example.com'), 'alex_dev');
    await user.type(screen.getByPlaceholderText('••••••••••••'), 'wrong');
    await user.click(screen.getByRole('button', { name: /Sign In/ }));

    expect(await screen.findByText('Invalid credentials')).toBeInTheDocument();
    expect(onLoginSuccess).not.toHaveBeenCalled();
  });

  it('registers with all four fields when in register mode', async () => {
    mockedRegister.mockResolvedValue({ data: { data: { accessToken: 'tok', mfaRequired: false } } } as any);
    const user = userEvent.setup();
    const onLoginSuccess = vi.fn();
    render(<AuthView onLoginSuccess={onLoginSuccess} />);

    await user.click(screen.getByText(/Don't have an account\?/));
    await user.type(screen.getByPlaceholderText('John Doe'), 'Alex Example');
    await user.type(screen.getByPlaceholderText('alex_dev'), 'alex_dev');
    await user.type(screen.getByPlaceholderText('alex@example.com'), 'alex@example.com');
    await user.type(screen.getByPlaceholderText('••••••••••••'), 'hunter2');
    await user.click(screen.getByRole('button', { name: /Create Account/ }));

    expect(mockedRegister).toHaveBeenCalledWith('alex_dev', 'alex@example.com', 'hunter2', 'Alex Example');
    expect(onLoginSuccess).toHaveBeenCalledTimes(1);
  });

  it('switches to the MFA challenge step when login requires it, without calling onLoginSuccess', async () => {
    mockedLogin.mockResolvedValue({
      data: { data: { mfaRequired: true, challengeToken: 'challenge-123' } },
    } as any);
    const user = userEvent.setup();
    const onLoginSuccess = vi.fn();
    render(<AuthView onLoginSuccess={onLoginSuccess} />);

    await user.type(screen.getByPlaceholderText('alex_dev or alex@example.com'), 'alex_dev');
    await user.type(screen.getByPlaceholderText('••••••••••••'), 'hunter2');
    await user.click(screen.getByRole('button', { name: /Sign In/ }));

    expect(await screen.findByText('Two-Factor Verification')).toBeInTheDocument();
    expect(onLoginSuccess).not.toHaveBeenCalled();
  });

  it('verifies a TOTP code and calls onLoginSuccess', async () => {
    mockedLogin.mockResolvedValue({
      data: { data: { mfaRequired: true, challengeToken: 'challenge-123' } },
    } as any);
    mockedVerifyMfa.mockResolvedValue({ data: { data: { accessToken: 'tok' } } } as any);
    const user = userEvent.setup();
    const onLoginSuccess = vi.fn();
    render(<AuthView onLoginSuccess={onLoginSuccess} />);

    await user.type(screen.getByPlaceholderText('alex_dev or alex@example.com'), 'alex_dev');
    await user.type(screen.getByPlaceholderText('••••••••••••'), 'hunter2');
    await user.click(screen.getByRole('button', { name: /Sign In/ }));
    await screen.findByText('Two-Factor Verification');

    await user.type(screen.getByPlaceholderText('123456'), '654321');
    await user.click(screen.getByRole('button', { name: /Verify/ }));

    expect(mockedVerifyMfa).toHaveBeenCalledWith('challenge-123', '654321', undefined);
    expect(onLoginSuccess).toHaveBeenCalledTimes(1);
  });

  it('shows an error and stays on the MFA step when the code is invalid', async () => {
    mockedLogin.mockResolvedValue({
      data: { data: { mfaRequired: true, challengeToken: 'challenge-123' } },
    } as any);
    mockedVerifyMfa.mockRejectedValue(new Error('Invalid verification code'));
    const user = userEvent.setup();
    const onLoginSuccess = vi.fn();
    render(<AuthView onLoginSuccess={onLoginSuccess} />);

    await user.type(screen.getByPlaceholderText('alex_dev or alex@example.com'), 'alex_dev');
    await user.type(screen.getByPlaceholderText('••••••••••••'), 'hunter2');
    await user.click(screen.getByRole('button', { name: /Sign In/ }));
    await screen.findByText('Two-Factor Verification');

    await user.type(screen.getByPlaceholderText('123456'), '000000');
    await user.click(screen.getByRole('button', { name: /Verify/ }));

    expect(await screen.findByText('Invalid verification code')).toBeInTheDocument();
    expect(onLoginSuccess).not.toHaveBeenCalled();
    expect(screen.getByText('Two-Factor Verification')).toBeInTheDocument();
  });

  it('switches to recovery-code entry and sends it as recoveryCode', async () => {
    mockedLogin.mockResolvedValue({
      data: { data: { mfaRequired: true, challengeToken: 'challenge-123' } },
    } as any);
    mockedVerifyMfa.mockResolvedValue({ data: { data: { accessToken: 'tok' } } } as any);
    const user = userEvent.setup();
    render(<AuthView onLoginSuccess={vi.fn()} />);

    await user.type(screen.getByPlaceholderText('alex_dev or alex@example.com'), 'alex_dev');
    await user.type(screen.getByPlaceholderText('••••••••••••'), 'hunter2');
    await user.click(screen.getByRole('button', { name: /Sign In/ }));
    await screen.findByText('Two-Factor Verification');

    await user.click(screen.getByText('Use a recovery code instead'));
    await user.type(screen.getByPlaceholderText('XXXXX-XXXXX'), 'ABCDE-12345');
    await user.click(screen.getByRole('button', { name: /Verify/ }));

    expect(mockedVerifyMfa).toHaveBeenCalledWith('challenge-123', undefined, 'ABCDE-12345');
  });

  it('returns to the credentials step from the MFA challenge', async () => {
    mockedLogin.mockResolvedValue({
      data: { data: { mfaRequired: true, challengeToken: 'challenge-123' } },
    } as any);
    const user = userEvent.setup();
    render(<AuthView onLoginSuccess={vi.fn()} />);

    await user.type(screen.getByPlaceholderText('alex_dev or alex@example.com'), 'alex_dev');
    await user.type(screen.getByPlaceholderText('••••••••••••'), 'hunter2');
    await user.click(screen.getByRole('button', { name: /Sign In/ }));
    await screen.findByText('Two-Factor Verification');

    await user.click(screen.getByText('Back to Sign In'));

    expect(screen.getByText('Welcome Back to AURA')).toBeInTheDocument();
  });
});
