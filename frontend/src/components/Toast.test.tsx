import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Toast from './Toast';

describe('Toast', () => {
  it('renders nothing when toast is null', () => {
    const { container } = render(<Toast toast={null} onClose={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the message for a given toast', () => {
    render(<Toast toast={{ message: 'Saved successfully', type: 'success' }} onClose={vi.fn()} />);
    expect(screen.getByText('Saved successfully')).toBeInTheDocument();
  });

  it('falls back to the info variant for an unknown/missing type', () => {
    render(<Toast toast={{ message: 'Hello' }} onClose={vi.fn()} />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('calls onClose when the close button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<Toast toast={{ message: 'Bye', type: 'error' }} onClose={onClose} />);

    await user.click(screen.getByRole('button'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('auto-dismisses after 4 seconds', () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    render(<Toast toast={{ message: 'Auto', type: 'info' }} onClose={onClose} />);

    vi.advanceTimersByTime(4000);

    expect(onClose).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });
});
