import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MoodWheel from './MoodWheel';

describe('MoodWheel', () => {
  it('renders every mood option', () => {
    render(<MoodWheel selectedMood={null} onSelectMood={vi.fn()} />);

    expect(screen.getByText('Happy')).toBeInTheDocument();
    expect(screen.getByText('Excited')).toBeInTheDocument();
    expect(screen.getByText('Relaxed')).toBeInTheDocument();
    expect(screen.getByText('Stressed')).toBeInTheDocument();
    expect(screen.getByText('Sad')).toBeInTheDocument();
    expect(screen.getByText('Grateful')).toBeInTheDocument();
    expect(screen.getByText('Angry')).toBeInTheDocument();
  });

  it('marks the selected mood as visually selected via bold label text', () => {
    render(<MoodWheel selectedMood="HAPPY" onSelectMood={vi.fn()} />);

    expect(screen.getByText('Happy')).toHaveClass('font-bold');
    expect(screen.getByText('Excited')).toHaveClass('font-medium');
  });

  it('calls onSelectMood with the mood key and emoji when clicked', async () => {
    const user = userEvent.setup();
    const onSelectMood = vi.fn();
    render(<MoodWheel selectedMood={null} onSelectMood={onSelectMood} />);

    await user.click(screen.getByText('Grateful'));

    expect(onSelectMood).toHaveBeenCalledWith('GRATEFUL', '🙏');
  });
});
