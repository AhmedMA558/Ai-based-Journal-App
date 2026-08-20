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

    expect(await screen.findByText('Sun')).toBeInTheDocument();
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

  it('shows a styled error banner when journals fail to load', async () => {
    mockedGetAllJournals.mockRejectedValue(new Error('network down'));
    render(<CalendarView onSelectJournal={vi.fn()} />);

    expect(await screen.findByText('Could not load your calendar. Please try again.')).toBeInTheDocument();
  });

  it('disables navigating earlier than the month of the user\'s first entry', async () => {
    const now = new Date();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    // First entry was two months ago - clicking "previous" twice should land
    // exactly on that month and then stop, never wandering further back into
    // months with no possible data (the real bug: it used to go arbitrarily
    // far back with nothing to show).
    const firstEntryDate = new Date(now.getFullYear(), now.getMonth() - 2, 15);
    mockedGetAllJournals.mockResolvedValue([{ createdAt: firstEntryDate.toISOString(), mood: 'HAPPY' }]);
    const user = userEvent.setup();
    render(<CalendarView onSelectJournal={vi.fn()} />);

    const buttons = await screen.findAllByRole('button');
    const prevButton = buttons[0];

    await user.click(prevButton);
    await user.click(prevButton);
    await waitFor(() => {
      expect(screen.getByText(`${monthNames[firstEntryDate.getMonth()]} ${firstEntryDate.getFullYear()}`)).toBeInTheDocument();
    });
    expect(prevButton).toBeDisabled();

    // A third click must not move any further back than the first entry's month.
    await user.click(prevButton);
    expect(screen.getByText(`${monthNames[firstEntryDate.getMonth()]} ${firstEntryDate.getFullYear()}`)).toBeInTheDocument();
  });

  it('disables navigating backward at all when the user has no entries yet', async () => {
    mockedGetAllJournals.mockResolvedValue([]);
    render(<CalendarView onSelectJournal={vi.fn()} />);

    const prevButton = (await screen.findAllByRole('button'))[0];
    await waitFor(() => expect(prevButton).toBeDisabled());
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
