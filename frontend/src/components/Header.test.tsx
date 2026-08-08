import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Header from './Header';

const baseProps = {
  onOpenCommandPalette: vi.fn(),
  onToggleTheme: vi.fn(),
  theme: 'dark',
  onOpenNotifications: vi.fn(),
  onOpenSettings: vi.fn(),
};

describe('Header', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('falls back to "Journaler" when no user_name is stored', () => {
    render(<Header {...baseProps} />);
    expect(screen.getByText('Journaler')).toBeInTheDocument();
  });

  it('shows the stored username and its initial avatar', () => {
    localStorage.setItem('user_name', 'Alex');
    render(<Header {...baseProps} />);
    expect(screen.getByText('Alex')).toBeInTheDocument();
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('calls onOpenCommandPalette when the search launcher is clicked', async () => {
    const user = userEvent.setup();
    render(<Header {...baseProps} />);

    await user.click(screen.getByText('Search commands, actions...'));

    expect(baseProps.onOpenCommandPalette).toHaveBeenCalledTimes(1);
  });

  it('defaults the unread badge to 2 when unreadCount is not passed', () => {
    render(<Header {...baseProps} />);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('hides the unread badge when unreadCount is 0', () => {
    render(<Header {...baseProps} unreadCount={0} />);
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('shows a custom unread count', () => {
    render(<Header {...baseProps} unreadCount={5} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('calls onOpenNotifications when the bell button is clicked', async () => {
    const user = userEvent.setup();
    render(<Header {...baseProps} />);

    await user.click(screen.getByRole('button', { name: 'Notifications' }));

    expect(baseProps.onOpenNotifications).toHaveBeenCalledTimes(1);
  });

  it('calls onToggleTheme when the theme button is clicked', async () => {
    const user = userEvent.setup();
    render(<Header {...baseProps} />);

    await user.click(screen.getByTitle('Toggle Dark / Light Theme'));

    expect(baseProps.onToggleTheme).toHaveBeenCalledTimes(1);
  });

  it('calls onOpenSettings when the profile pill is clicked', async () => {
    const user = userEvent.setup();
    render(<Header {...baseProps} />);

    await user.click(screen.getByText('Journaler'));

    expect(baseProps.onOpenSettings).toHaveBeenCalledTimes(1);
  });
});
