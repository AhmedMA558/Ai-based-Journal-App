import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DashboardView from './DashboardView';
import { journalService } from '@/services/journalService';
import { aiService } from '@/services/aiService';

vi.mock('@/services/journalService', () => ({
  journalService: {
    getAllJournals: vi.fn(),
    deleteJournal: vi.fn(),
  },
}));

vi.mock('@/services/aiService', () => ({
  aiService: {
    getRecommendations: vi.fn(),
  },
}));

const mockedGetAllJournals = vi.mocked(journalService.getAllJournals);
const mockedDeleteJournal = vi.mocked(journalService.deleteJournal);
const mockedGetRecommendations = vi.mocked(aiService.getRecommendations);

const today = new Date();
const yesterday = new Date(today);
yesterday.setDate(yesterday.getDate() - 1);

const SAMPLE_JOURNALS = [
  { id: 1, title: 'First Entry', content: 'Some content here', mood: 'HAPPY', tags: ['life'], createdAt: today.toISOString() },
  { id: 2, title: 'Second Entry', content: 'More content', mood: 'STRESSED', tags: [], createdAt: yesterday.toISOString() },
];

describe('DashboardView', () => {
  beforeEach(() => {
    mockedGetAllJournals.mockReset();
    mockedDeleteJournal.mockReset();
    mockedGetRecommendations.mockReset();
    mockedGetRecommendations.mockResolvedValue({ data: { data: [] } } as any);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  it('shows journal counts and entries once loaded', async () => {
    mockedGetAllJournals.mockResolvedValue(SAMPLE_JOURNALS as any);
    render(<DashboardView onNewJournal={vi.fn()} onSelectJournal={vi.fn()} />);

    expect(await screen.findByText('First Entry')).toBeInTheDocument();
    expect(screen.getByText('2 Entries')).toBeInTheDocument();
    expect(screen.getByText('2 Days')).toBeInTheDocument();
  });

  it('shows the empty state and can trigger a new journal from it', async () => {
    mockedGetAllJournals.mockResolvedValue([]);
    const onNewJournal = vi.fn();
    const user = userEvent.setup();
    render(<DashboardView onNewJournal={onNewJournal} onSelectJournal={vi.fn()} />);

    expect(await screen.findByText('No Journal Entries Yet')).toBeInTheDocument();
    await user.click(screen.getByText('Create First Entry'));
    expect(onNewJournal).toHaveBeenCalledTimes(1);
  });

  it('shows an AI recommendation when the service returns one', async () => {
    mockedGetAllJournals.mockResolvedValue([]);
    // Real ApiResponse<T> envelope shape ({success, message, data, timestamp})
    // - aiRes.data is that envelope, not the array itself. A test mocking
    // { data: [...] } directly would pass even with the envelope-unwrap bug
    // this fix addresses (aiRes?.data vs aiRes?.data?.data), which is exactly
    // how that bug went undetected the first time.
    mockedGetRecommendations.mockResolvedValue({ data: { data: ['Try a 10-minute walk today.'] } } as any);
    render(<DashboardView onNewJournal={vi.fn()} onSelectJournal={vi.fn()} />);

    expect(await screen.findByText('"Try a 10-minute walk today."')).toBeInTheDocument();
  });

  it('requests recommendations for the most recent journal entry\'s real mood, not a hardcoded value', async () => {
    mockedGetAllJournals.mockResolvedValue(SAMPLE_JOURNALS as any);
    render(<DashboardView onNewJournal={vi.fn()} onSelectJournal={vi.fn()} />);

    await screen.findByText('First Entry');
    expect(mockedGetRecommendations).toHaveBeenCalledWith('HAPPY', 'Some content here');
  });

  it('requests NEUTRAL recommendations when the user has no journal entries yet', async () => {
    mockedGetAllJournals.mockResolvedValue([]);
    render(<DashboardView onNewJournal={vi.fn()} onSelectJournal={vi.fn()} />);

    await screen.findByText('No Journal Entries Yet');
    expect(mockedGetRecommendations).toHaveBeenCalledWith('NEUTRAL', undefined);
  });

  it('falls back to the default recommendation when the AI service fails', async () => {
    mockedGetAllJournals.mockResolvedValue([]);
    mockedGetRecommendations.mockRejectedValue(new Error('down'));
    render(<DashboardView onNewJournal={vi.fn()} onSelectJournal={vi.fn()} />);

    expect(await screen.findByText('"Take 5 deep breaths and reflect on 3 good things today."')).toBeInTheDocument();
  });

  it('calls onSelectJournal when a journal card is clicked', async () => {
    mockedGetAllJournals.mockResolvedValue(SAMPLE_JOURNALS as any);
    const onSelectJournal = vi.fn();
    const user = userEvent.setup();
    render(<DashboardView onNewJournal={vi.fn()} onSelectJournal={onSelectJournal} />);

    await screen.findByText('First Entry');
    await user.click(screen.getByText('First Entry'));

    expect(onSelectJournal).toHaveBeenCalledWith(SAMPLE_JOURNALS[0]);
  });

  it('deletes a journal after confirmation and shows a toast', async () => {
    mockedGetAllJournals.mockResolvedValue(SAMPLE_JOURNALS as any);
    mockedDeleteJournal.mockResolvedValue(undefined as any);
    const showToast = vi.fn();
    const user = userEvent.setup();
    render(<DashboardView onNewJournal={vi.fn()} onSelectJournal={vi.fn()} showToast={showToast} />);

    await screen.findByText('First Entry');
    const deleteButtons = screen.getAllByTitle('Delete Entry');
    await user.click(deleteButtons[0]);

    expect(window.confirm).toHaveBeenCalled();
    expect(mockedDeleteJournal).toHaveBeenCalledWith(1);
    expect(await screen.findByText('Second Entry')).toBeInTheDocument();
    expect(screen.queryByText('First Entry')).not.toBeInTheDocument();
    expect(showToast).toHaveBeenCalledWith('Journal entry deleted.', 'info');
  });

  it('shows an error toast (not just a silent console.error) when delete fails', async () => {
    mockedGetAllJournals.mockResolvedValue(SAMPLE_JOURNALS as any);
    mockedDeleteJournal.mockRejectedValue(new Error('network error'));
    const showToast = vi.fn();
    const user = userEvent.setup();
    render(<DashboardView onNewJournal={vi.fn()} onSelectJournal={vi.fn()} showToast={showToast} />);

    await screen.findByText('First Entry');
    const deleteButtons = screen.getAllByTitle('Delete Entry');
    await user.click(deleteButtons[0]);

    expect(mockedDeleteJournal).toHaveBeenCalledWith(1);
    expect(showToast).toHaveBeenCalledWith('Failed to delete journal entry. Please try again.', 'error');
    // The entry must still be visible - the failed delete was never applied to local state.
    expect(await screen.findByText('First Entry')).toBeInTheDocument();
  });

  it('shows a styled error banner when journals fail to load', async () => {
    mockedGetAllJournals.mockRejectedValue(new Error('network down'));
    render(<DashboardView onNewJournal={vi.fn()} onSelectJournal={vi.fn()} />);

    expect(await screen.findByText('Could not load your dashboard. Please try refreshing.')).toBeInTheDocument();
    expect(screen.queryByText('No Journal Entries Yet')).not.toBeInTheDocument();
  });

  it('re-fetches journals when the refresh button is clicked', async () => {
    mockedGetAllJournals.mockResolvedValue(SAMPLE_JOURNALS as any);
    const user = userEvent.setup();
    render(<DashboardView onNewJournal={vi.fn()} onSelectJournal={vi.fn()} />);

    await screen.findByText('First Entry');
    await user.click(screen.getByText('Refresh'));

    expect(mockedGetAllJournals).toHaveBeenCalledTimes(2);
  });
});
