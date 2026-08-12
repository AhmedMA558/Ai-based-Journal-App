import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AchievementsModal from './AchievementsModal';
import { journalService } from '@/services/journalService';
import { markAiUsed } from '@/lib/achievementTracking';

vi.mock('@/services/journalService', () => ({
  journalService: {
    getAllJournals: vi.fn(),
  },
}));

const mockedGetAllJournals = vi.mocked(journalService.getAllJournals);

describe('AchievementsModal', () => {
  beforeEach(() => {
    mockedGetAllJournals.mockReset();
    mockedGetAllJournals.mockResolvedValue([]);
  });

  it('renders nothing when closed', () => {
    const { container } = render(<AchievementsModal isOpen={false} onClose={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the title when open', async () => {
    render(<AchievementsModal isOpen onClose={vi.fn()} />);
    expect(screen.getByText('Journaling Achievements')).toBeInTheDocument();
    await waitFor(() => expect(mockedGetAllJournals).toHaveBeenCalled());
  });

  it('unlocks no badges for a brand-new account with zero journal entries', async () => {
    mockedGetAllJournals.mockResolvedValue([]);
    render(<AchievementsModal isOpen onClose={vi.fn()} />);

    await waitFor(() => expect(screen.getByText('First Reflection 📝')).toBeInTheDocument());

    const firstReflectionCard = screen.getByText('First Reflection 📝').closest('div')!.parentElement!.parentElement!;
    expect(firstReflectionCard.className).toContain('opacity-50');
    const emotionalMasterCard = screen.getByText('Emotional Master 😌').closest('div')!.parentElement!.parentElement!;
    expect(emotionalMasterCard.className).toContain('opacity-50');
  });

  it('unlocks "First Reflection" once a journal exists but keeps "Emotional Master" locked with too few distinct moods', async () => {
    mockedGetAllJournals.mockResolvedValue([
      { mood: 'HAPPY', createdAt: new Date().toISOString() },
      { mood: 'HAPPY', createdAt: new Date().toISOString() },
    ]);
    render(<AchievementsModal isOpen onClose={vi.fn()} />);

    await waitFor(() => {
      const firstReflectionCard = screen.getByText('First Reflection 📝').closest('div')!.parentElement!.parentElement!;
      expect(firstReflectionCard.className).toContain('opacity-100');
    });

    const emotionalMasterCard = screen.getByText('Emotional Master 😌').closest('div')!.parentElement!.parentElement!;
    expect(emotionalMasterCard.className).toContain('opacity-50');
  });

  it('unlocks "Emotional Master" only when journals span 5 distinct moods, not just 5 entries', async () => {
    mockedGetAllJournals.mockResolvedValue([
      { mood: 'HAPPY', createdAt: new Date().toISOString() },
      { mood: 'HAPPY', createdAt: new Date().toISOString() },
      { mood: 'HAPPY', createdAt: new Date().toISOString() },
      { mood: 'HAPPY', createdAt: new Date().toISOString() },
      { mood: 'HAPPY', createdAt: new Date().toISOString() },
    ]);
    render(<AchievementsModal isOpen onClose={vi.fn()} />);

    await waitFor(() => {
      const firstReflectionCard = screen.getByText('First Reflection 📝').closest('div')!.parentElement!.parentElement!;
      expect(firstReflectionCard.className).toContain('opacity-100');
    });

    // 5 entries, but all the same mood - "Emotional Master" describes 5
    // distinct mood categories, so it must stay locked here.
    const emotionalMasterCard = screen.getByText('Emotional Master 😌').closest('div')!.parentElement!.parentElement!;
    expect(emotionalMasterCard.className).toContain('opacity-50');
  });

  it('unlocks "Emotional Master" once 5 distinct moods are actually present', async () => {
    mockedGetAllJournals.mockResolvedValue([
      { mood: 'HAPPY', createdAt: new Date().toISOString() },
      { mood: 'SAD', createdAt: new Date().toISOString() },
      { mood: 'ANGRY', createdAt: new Date().toISOString() },
      { mood: 'EXCITED', createdAt: new Date().toISOString() },
      { mood: 'GRATEFUL', createdAt: new Date().toISOString() },
    ]);
    render(<AchievementsModal isOpen onClose={vi.fn()} />);

    await waitFor(() => {
      const emotionalMasterCard = screen.getByText('Emotional Master 😌').closest('div')!.parentElement!.parentElement!;
      expect(emotionalMasterCard.className).toContain('opacity-100');
    });
  });

  it('unlocks "AI Pioneer" only after a real AI chat reply has been received this session', async () => {
    const { unmount: unmountFirst } = render(<AchievementsModal isOpen onClose={vi.fn()} />);
    await waitFor(() => {
      const aiPioneerCard = screen.getByText('AI Pioneer 🤖').closest('div')!.parentElement!.parentElement!;
      expect(aiPioneerCard.className).toContain('opacity-50');
    });
    unmountFirst();

    markAiUsed();
    render(<AchievementsModal isOpen onClose={vi.fn()} />);
    await waitFor(() => {
      const aiPioneerCard = screen.getByText('AI Pioneer 🤖').closest('div')!.parentElement!.parentElement!;
      expect(aiPioneerCard.className).toContain('opacity-100');
    });
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
