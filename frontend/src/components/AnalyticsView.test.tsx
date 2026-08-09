import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AnalyticsView from './AnalyticsView';
import { journalService } from '@/services/journalService';

vi.mock('@/services/journalService', () => ({
  journalService: {
    getAllJournals: vi.fn(),
  },
}));

const mockedGetAllJournals = vi.mocked(journalService.getAllJournals);

describe('AnalyticsView', () => {
  beforeEach(() => {
    mockedGetAllJournals.mockReset();
  });

  it('renders the header and chart section titles', async () => {
    mockedGetAllJournals.mockResolvedValue([]);
    render(<AnalyticsView />);

    expect(screen.getByText('Real-Time Data Analytics')).toBeInTheDocument();
    expect(await screen.findByText('0 Entries')).toBeInTheDocument();
    expect(screen.getByText('Live Positivity Stream')).toBeInTheDocument();
    expect(screen.getByText('Emotional Balance Radar Wheel')).toBeInTheDocument();
    expect(screen.getByText('Real-Time Mood Frequency Breakdown')).toBeInTheDocument();
  });

  it('shows 100% positivity and HAPPY as dominant mood with no entries', async () => {
    mockedGetAllJournals.mockResolvedValue([]);
    render(<AnalyticsView />);

    await screen.findByText('0 Entries');
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText(/HAPPY/)).toBeInTheDocument();
  });

  it('computes totals and positivity rate from loaded journals', async () => {
    mockedGetAllJournals.mockResolvedValue([
      { id: 1, mood: 'HAPPY' },
      { id: 2, mood: 'HAPPY' },
      { id: 3, mood: 'STRESSED' },
      { id: 4, mood: 'ANGRY' },
    ] as any);
    render(<AnalyticsView />);

    // 4 entries, 2 positive (HAPPY) out of 4 => 50%
    expect(await screen.findByText('4 Entries')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('re-fetches analytics when the refresh button is clicked', async () => {
    mockedGetAllJournals.mockResolvedValue([]);
    const user = userEvent.setup();
    render(<AnalyticsView />);

    await screen.findByText('0 Entries');
    await user.click(screen.getByText('Refresh Data'));

    expect(mockedGetAllJournals).toHaveBeenCalledTimes(2);
  });
});
