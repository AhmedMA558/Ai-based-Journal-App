import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SettingsModal from './SettingsModal';
import { authService } from '@/services/authService';
import { userService } from '@/services/userService';

vi.mock('@/services/authService', () => ({
  authService: {
    getCurrentUser: vi.fn(),
    changePassword: vi.fn(),
    getMfaStatus: vi.fn(),
    setupMfa: vi.fn(),
    enableMfa: vi.fn(),
    disableMfa: vi.fn(),
  },
}));

vi.mock('@/services/userService', () => ({
  userService: {
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
  },
}));

const mockedGetCurrentUser = vi.mocked(authService.getCurrentUser);
const mockedChangePassword = vi.mocked(authService.changePassword);
const mockedGetMfaStatus = vi.mocked(authService.getMfaStatus);
const mockedSetupMfa = vi.mocked(authService.setupMfa);
const mockedEnableMfa = vi.mocked(authService.enableMfa);
const mockedDisableMfa = vi.mocked(authService.disableMfa);
const mockedGetProfile = vi.mocked(userService.getProfile);
const mockedUpdateProfile = vi.mocked(userService.updateProfile);

describe('SettingsModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetCurrentUser.mockResolvedValue({ username: 'Alex', email: 'alex@example.com', fullName: 'Alex Example' } as any);
    mockedGetProfile.mockResolvedValue({ bio: '', phoneNumber: '', country: '', city: '' } as any);
    mockedGetMfaStatus.mockResolvedValue({ mfaEnabled: false } as any);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('renders nothing when closed', () => {
    const { container } = render(<SettingsModal isOpen={false} onClose={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('loads and shows the real username and email on the profile tab', async () => {
    render(<SettingsModal isOpen onClose={vi.fn()} />);

    expect(await screen.findByDisplayValue('Alex')).toBeInTheDocument();
    expect(screen.getByDisplayValue('alex@example.com')).toBeInTheDocument();
    expect(mockedGetCurrentUser).toHaveBeenCalledTimes(1);
    expect(mockedGetProfile).toHaveBeenCalledTimes(1);
  });

  it('saves profile edits via updateProfile', async () => {
    mockedUpdateProfile.mockResolvedValue({ bio: 'Hello world', phoneNumber: '', country: '', city: '' } as any);
    const user = userEvent.setup();
    render(<SettingsModal isOpen onClose={vi.fn()} />);

    await screen.findByDisplayValue('Alex');
    const bioInput = document.querySelector('textarea')!;
    await user.type(bioInput, 'Hello world');
    await user.click(screen.getByRole('button', { name: /Save Profile/ }));

    await waitFor(() => expect(mockedUpdateProfile).toHaveBeenCalledWith(expect.objectContaining({ bio: 'Hello world' })));
  });

  it('switches to the security tab and shows disabled 2FA status', async () => {
    const user = userEvent.setup();
    render(<SettingsModal isOpen onClose={vi.fn()} />);

    await user.click(screen.getByText('Security & Sessions'));

    expect(screen.getByText('10-Minute Active Session Enforced')).toBeInTheDocument();
    expect(await screen.findByText('Disabled')).toBeInTheDocument();
    expect(mockedGetMfaStatus).toHaveBeenCalledTimes(1);
  });

  it('runs the full 2FA enrollment flow', async () => {
    mockedSetupMfa.mockResolvedValue({ secret: 'SECRET123', otpAuthUri: 'otpauth://totp/test' } as any);
    mockedEnableMfa.mockResolvedValue({ mfaEnabled: true, recoveryCodes: ['AAAAA-11111', 'BBBBB-22222'] } as any);
    const user = userEvent.setup();
    render(<SettingsModal isOpen onClose={vi.fn()} />);

    await user.click(screen.getByText('Security & Sessions'));
    await screen.findByText('Disabled');

    await user.click(screen.getByRole('button', { name: 'Set Up 2FA' }));
    expect(await screen.findByText(/SECRET123/)).toBeInTheDocument();
    expect(mockedSetupMfa).toHaveBeenCalledTimes(1);

    await user.type(screen.getByPlaceholderText('Enter the 6-digit code to confirm'), '123456');
    await user.click(screen.getByRole('button', { name: /Confirm & Enable/ }));

    expect(await screen.findByText('AAAAA-11111')).toBeInTheDocument();
    expect(mockedEnableMfa).toHaveBeenCalledWith('123456');

    const ackCheckbox = screen.getByRole('checkbox');
    await user.click(ackCheckbox);
    await user.click(screen.getByRole('button', { name: 'Done' }));

    expect(await screen.findByText('Enabled')).toBeInTheDocument();
  });

  it('runs the 2FA disable flow when already enabled', async () => {
    mockedGetMfaStatus.mockResolvedValue({ mfaEnabled: true } as any);
    const user = userEvent.setup();
    render(<SettingsModal isOpen onClose={vi.fn()} />);

    await user.click(screen.getByText('Security & Sessions'));
    await screen.findByText('Enabled');

    await user.click(screen.getByRole('button', { name: 'Disable 2FA' }));
    // "Current password" also appears in the password-change form above -
    // the disable form's copy is the second one in document order.
    const currentPasswordInputs = screen.getAllByPlaceholderText('Current password');
    await user.type(currentPasswordInputs[currentPasswordInputs.length - 1], 'password123');
    await user.type(screen.getByPlaceholderText('6-digit authenticator code'), '123456');
    await user.click(screen.getByRole('button', { name: /Confirm Disable/ }));

    await waitFor(() => expect(mockedDisableMfa).toHaveBeenCalledWith('password123', '123456'));
    expect(await screen.findByText('Disabled')).toBeInTheDocument();
  });

  it('changes the password via the security tab form', async () => {
    const user = userEvent.setup();
    render(<SettingsModal isOpen onClose={vi.fn()} />);

    await user.click(screen.getByText('Security & Sessions'));
    await screen.findByText('Disabled');

    await user.type(screen.getByPlaceholderText('Current password'), 'oldpass123');
    await user.type(screen.getByPlaceholderText('New password'), 'newpass123');
    await user.type(screen.getByPlaceholderText('Confirm new password'), 'newpass123');
    await user.click(screen.getByRole('button', { name: /Update Password/ }));

    await waitFor(() => expect(mockedChangePassword).toHaveBeenCalledWith('oldpass123', 'newpass123'));
  });

  it('shows a mismatch error without calling changePassword when passwords differ', async () => {
    const user = userEvent.setup();
    render(<SettingsModal isOpen onClose={vi.fn()} />);

    await user.click(screen.getByText('Security & Sessions'));
    await screen.findByText('Disabled');

    await user.type(screen.getByPlaceholderText('Current password'), 'oldpass123');
    await user.type(screen.getByPlaceholderText('New password'), 'newpass123');
    await user.type(screen.getByPlaceholderText('Confirm new password'), 'different');
    await user.click(screen.getByRole('button', { name: /Update Password/ }));

    expect(await screen.findByText('New passwords do not match.')).toBeInTheDocument();
    expect(mockedChangePassword).not.toHaveBeenCalled();
  });

  it('switches to the appearance tab and renders the theme customizer', async () => {
    const user = userEvent.setup();
    render(<SettingsModal isOpen onClose={vi.fn()} />);

    await user.click(screen.getByText('Appearance & Themes'));

    expect(screen.getByText('Appearance & Theme Palettes')).toBeInTheDocument();
    expect(screen.getByTitle('Customize Theme Palette')).toBeInTheDocument();
  });

  it('switches to the services tab and lists all microservices', async () => {
    const user = userEvent.setup();
    render(<SettingsModal isOpen onClose={vi.fn()} />);

    await user.click(screen.getByText('Connected Services'));

    expect(screen.getByText('Spring Cloud API Gateway')).toBeInTheDocument();
    expect(screen.getByText('Port: :8080')).toBeInTheDocument();
    expect(screen.getByText('MySQL Relational DB')).toBeInTheDocument();
  });

  it('calls onClose when the close button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<SettingsModal isOpen onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: '' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose on backdrop click but not on panel content click', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<SettingsModal isOpen onClose={onClose} />);

    await user.click(screen.getByText('Account & System Settings'));
    expect(onClose).not.toHaveBeenCalled();

    await user.click(screen.getByText('Account & System Settings').closest('.glass-panel')!.parentElement!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
