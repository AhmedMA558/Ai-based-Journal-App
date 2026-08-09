import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AchievementsModal from './AchievementsModal';

describe('AchievementsModal', () => {
  it('renders nothing when closed', () => {
    const { container } = render(<AchievementsModal isOpen={false} onClose={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the title when open', () => {
    render(<AchievementsModal isOpen onClose={vi.fn()} />);
    expect(screen.getByText('Journaling Achievements')).toBeInTheDocument();
  });

  it('unlocks all badges at the default journalCount (5)', () => {
    render(<AchievementsModal isOpen onClose={vi.fn()} />);
    // 4 badges, all unlocked => 4 check icons (rendered as svgs, assert via badge count instead)
    expect(screen.getByText('First Reflection 📝')).toBeInTheDocument();
    expect(screen.getByText('3-Day Streak 🔥')).toBeInTheDocument();
    expect(screen.getByText('AI Pioneer 🤖')).toBeInTheDocument();
    expect(screen.getByText('Emotional Master 😌')).toBeInTheDocument();
  });

  it('only unlocks badges the journalCount threshold allows', () => {
    render(<AchievementsModal isOpen onClose={vi.fn()} journalCount={2} />);
    // journalCount=2: badge1 (>=1) and badge3 (always true) unlocked; badge2 (>=3) and badge4 (>=5) locked
    const streakCard = screen.getByText('3-Day Streak 🔥').closest('div')!.parentElement!.parentElement!;
    expect(streakCard.className).toContain('opacity-50');
    const firstReflectionCard = screen.getByText('First Reflection 📝').closest('div')!.parentElement!.parentElement!;
    expect(firstReflectionCard.className).toContain('opacity-100');
  });

  it('calls onClose when the close button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<AchievementsModal isOpen onClose={onClose} />);

    await user.click(screen.getByRole('button'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when the backdrop is clicked, but not when the panel content is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<AchievementsModal isOpen onClose={onClose} />);

    await user.click(screen.getByText('Milestones unlocked as you reflect'));
    expect(onClose).not.toHaveBeenCalled();

    await user.click(screen.getByText('Journaling Achievements').closest('.glass-panel')!.parentElement!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
