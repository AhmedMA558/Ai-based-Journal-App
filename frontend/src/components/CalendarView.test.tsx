import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CalendarView from './CalendarView';
import { journalService } from '@/services/journalService';

vi.mock('@/services/journalService', () => ({
  journalService: {
    getAllJournals: vi.fn(),
  },
}));

const mockedGetAllJournals = vi.mocked(journalService.getAllJournals);

describe('CalendarView', () => {
  beforeEach(() => {
    mockedGetAllJournals.mockReset();
  });

  it('renders the weekday header and the current month/year', async () => {
    mockedGetAllJournals.mockResolvedValue([]);
    render(<CalendarView onSelectJournal={vi.fn()} />);

    expect(screen.getByText('Sun')).toBeInTheDocument();
    expect(screen.getByText('Sat')).toBeInTheDocument();

    const now = new Date();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    await waitFor(() => {
      expect(screen.getByText(`${monthNames[now.getMonth()]} ${now.getFullYear()}`)).toBeInTheDocument();
    });
  });

  it('navigates to the next and previous month', async () => {
    mockedGetAllJournals.mockResolvedValue([]);
    const user = userEvent.setup();
    render(<CalendarView onSelectJournal={vi.fn()} />);

    const now = new Date();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const nextExpected = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const buttons = screen.getAllByRole('button');
    await user.click(buttons[1]); // next month is the second nav button

    await waitFor(() => {
      expect(screen.getByText(`${monthNames[nextExpected.getMonth()]} ${nextExpected.getFullYear()}`)).toBeInTheDocument();
    });
  });

  it('renders a mood emoji on a day with a journal entry and calls onSelectJournal when clicked', async () => {
    const today = new Date();
    const journal = { createdAt: today.toISOString(), mood: 'HAPPY' };
    mockedGetAllJournals.mockResolvedValue([journal]);
    const onSelectJournal = vi.fn();
    const user = userEvent.setup();

    render(<CalendarView onSelectJournal={onSelectJournal} />);

    const emoji = await screen.findByText('😊');
    await user.click(emoji);

    expect(onSelectJournal).toHaveBeenCalledWith(journal);
  });
});
