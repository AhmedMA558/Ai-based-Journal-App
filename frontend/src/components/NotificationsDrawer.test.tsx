import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NotificationsDrawer from './NotificationsDrawer';

describe('NotificationsDrawer', () => {
  it('renders nothing when closed', () => {
    const { container } = render(<NotificationsDrawer isOpen={false} onClose={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('falls back to the default notifications when none are passed', () => {
    render(<NotificationsDrawer isOpen onClose={vi.fn()} />);
    expect(screen.getByText('AI Daily Wellness Suggestion')).toBeInTheDocument();
    expect(screen.getByText('3-Day Journaling Streak Unlocked! 🔥')).toBeInTheDocument();
    expect(screen.getByText('Session Security Active')).toBeInTheDocument();
  });

  it('renders custom notifications instead of the defaults when provided', () => {
    render(
      <NotificationsDrawer
        isOpen
        onClose={vi.fn()}
        notifications={[
          { id: 99, title: 'Custom Alert', message: 'Something happened', time: 'now', type: 'ai', icon: null },
        ]}
      />
    );
    expect(screen.getByText('Custom Alert')).toBeInTheDocument();
    expect(screen.queryByText('AI Daily Wellness Suggestion')).not.toBeInTheDocument();
  });

  it('calls onMarkAllRead when the mark-all button is clicked', async () => {
    const user = userEvent.setup();
    const onMarkAllRead = vi.fn();
    render(<NotificationsDrawer isOpen onClose={vi.fn()} onMarkAllRead={onMarkAllRead} />);

    await user.click(screen.getByText('Mark all as read'));

    expect(onMarkAllRead).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when the close button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<NotificationsDrawer isOpen onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: '' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose on backdrop click but not on drawer content click', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<NotificationsDrawer isOpen onClose={onClose} />);

    await user.click(screen.getByText('Notifications'));
    expect(onClose).not.toHaveBeenCalled();

    await user.click(screen.getByText('Notifications').closest('.glass-panel')!.parentElement!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
