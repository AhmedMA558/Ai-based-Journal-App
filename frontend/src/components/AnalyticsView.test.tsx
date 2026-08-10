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

  it('renders the header and chart section titles once there is real data', async () => {
    mockedGetAllJournals.mockResolvedValue([{ id: 1, mood: 'HAPPY' }] as any);
    render(<AnalyticsView />);

    expect(screen.getByText('Real-Time Data Analytics')).toBeInTheDocument();
    expect(await screen.findByText('1 Entries')).toBeInTheDocument();
    expect(screen.getByText('Live Positivity Stream')).toBeInTheDocument();
    expect(screen.getByText('Emotional Balance Radar Wheel')).toBeInTheDocument();
    expect(screen.getByText('Real-Time Mood Frequency Breakdown')).toBeInTheDocument();
  });

  it('shows a real empty state instead of fabricated chart data with no entries', async () => {
    mockedGetAllJournals.mockResolvedValue([]);
    render(<AnalyticsView />);

    await screen.findByText('0 Entries');
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText('No data yet')).toBeInTheDocument();
    expect(screen.getByText('No Data to Analyze Yet')).toBeInTheDocument();
    expect(screen.queryByText('Live Positivity Stream')).not.toBeInTheDocument();
    expect(screen.queryByText('Emotional Balance Radar Wheel')).not.toBeInTheDocument();
  });

  it('shows a styled error banner when analytics fail to load', async () => {
    mockedGetAllJournals.mockRejectedValue(new Error('network down'));
    render(<AnalyticsView />);

    expect(await screen.findByText('Could not load analytics data. Please try refreshing.')).toBeInTheDocument();
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
