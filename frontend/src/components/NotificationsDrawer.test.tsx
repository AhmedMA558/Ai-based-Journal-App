import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NotificationsDrawer from './NotificationsDrawer';

describe('NotificationsDrawer', () => {
  it('renders nothing when closed', () => {
    const { container } = render(<NotificationsDrawer isOpen={false} onClose={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows a genuine empty state when no notifications are passed', () => {
    render(<NotificationsDrawer isOpen onClose={vi.fn()} />);
    expect(screen.getByText('No notifications yet')).toBeInTheDocument();
    expect(screen.queryByText('Mark all as read')).not.toBeInTheDocument();
  });

  it('renders real notifications with a type-derived label', () => {
    render(
      <NotificationsDrawer
        isOpen
        onClose={vi.fn()}
        notifications={[
          { id: 1, type: 'SECURITY', message: 'Your password was changed.', read: false, createdAt: new Date().toISOString() },
        ]}
      />
    );
    expect(screen.getByText('Account Security')).toBeInTheDocument();
    expect(screen.getByText('Your password was changed.')).toBeInTheDocument();
    expect(screen.queryByText('No notifications yet')).not.toBeInTheDocument();
  });

  it('falls back to a generic label for an unknown notification type', () => {
    render(
      <NotificationsDrawer
        isOpen
        onClose={vi.fn()}
        notifications={[
          { id: 2, type: 'SOMETHING_NEW', message: 'A new kind of event.', read: false, createdAt: new Date().toISOString() },
        ]}
      />
    );
    expect(screen.getByText('Notification')).toBeInTheDocument();
    expect(screen.getByText('A new kind of event.')).toBeInTheDocument();
  });

  it('calls onMarkAllRead when the mark-all button is clicked', async () => {
    const user = userEvent.setup();
    const onMarkAllRead = vi.fn();
    render(
      <NotificationsDrawer
        isOpen
        onClose={vi.fn()}
        onMarkAllRead={onMarkAllRead}
        notifications={[{ id: 1, type: 'SECURITY', message: 'msg', read: false, createdAt: new Date().toISOString() }]}
      />
    );

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
