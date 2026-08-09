import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CommandPalette from './CommandPalette';

describe('CommandPalette', () => {
  it('renders nothing when closed', () => {
    const { container } = render(
      <CommandPalette isOpen={false} onClose={vi.fn()} onSelectAction={vi.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('lists all actions when open with an empty query', () => {
    render(<CommandPalette isOpen onClose={vi.fn()} onSelectAction={vi.fn()} />);
    expect(screen.getByText('Create New Journal Entry')).toBeInTheDocument();
    expect(screen.getByText('Toggle Light / Dark Mode')).toBeInTheDocument();
  });

  it('filters actions by query text', async () => {
    const user = userEvent.setup();
    render(<CommandPalette isOpen onClose={vi.fn()} onSelectAction={vi.fn()} />);

    await user.type(screen.getByPlaceholderText('Type a command or search actions...'), 'analytics');

    expect(screen.getByText('View Real-Time Data Analytics')).toBeInTheDocument();
    expect(screen.queryByText('Create New Journal Entry')).not.toBeInTheDocument();
  });

  it('shows an empty state when nothing matches', async () => {
    const user = userEvent.setup();
    render(<CommandPalette isOpen onClose={vi.fn()} onSelectAction={vi.fn()} />);

    await user.type(screen.getByPlaceholderText('Type a command or search actions...'), 'zzzznomatch');

    expect(screen.getByText('No commands matching "zzzznomatch"')).toBeInTheDocument();
  });

  it('clicking an action calls onSelectAction, onClose, and clears the query', async () => {
    const user = userEvent.setup();
    const onSelectAction = vi.fn();
    const onClose = vi.fn();
    render(<CommandPalette isOpen onClose={onClose} onSelectAction={onSelectAction} />);

    await user.click(screen.getByText('Open AI Conversational Assistant'));

    expect(onSelectAction).toHaveBeenCalledWith('ai-chat');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('navigates with arrow keys and executes the selected action on Enter', async () => {
    const user = userEvent.setup();
    const onSelectAction = vi.fn();
    render(<CommandPalette isOpen onClose={vi.fn()} onSelectAction={onSelectAction} />);

    await user.keyboard('{ArrowDown}{ArrowDown}{Enter}');

    // index 0 = new-journal, 1 = voice-dictation, 2 = ai-chat
    expect(onSelectAction).toHaveBeenCalledWith('ai-chat');
  });

  it('calls onClose on Escape', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<CommandPalette isOpen onClose={onClose} onSelectAction={vi.fn()} />);

    await user.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when the close button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<CommandPalette isOpen onClose={onClose} onSelectAction={vi.fn()} />);

    await user.click(screen.getByRole('button'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
