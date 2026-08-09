import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SettingsModal from './SettingsModal';

describe('SettingsModal', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('renders nothing when closed', () => {
    const { container } = render(<SettingsModal isOpen={false} onClose={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the profile tab by default with the stored username and user id', () => {
    localStorage.setItem('user_name', 'Alex');
    localStorage.setItem('user_id', '42');
    render(<SettingsModal isOpen onClose={vi.fn()} />);

    expect(screen.getByText('User Profile')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Alex')).toBeInTheDocument();
    expect(screen.getByDisplayValue('42')).toBeInTheDocument();
  });

  it('switches to the security tab', async () => {
    const user = userEvent.setup();
    render(<SettingsModal isOpen onClose={vi.fn()} />);

    await user.click(screen.getByText('Security & Sessions'));

    expect(screen.getByText('10-Minute Active Session Enforced')).toBeInTheDocument();
    expect(screen.getByText('Two-Factor Authentication (2FA)')).toBeInTheDocument();
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
