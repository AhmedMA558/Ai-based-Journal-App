import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import JournalFeed from './JournalFeed';
import { journalService } from '@/services/journalService';

vi.mock('@/services/journalService', () => ({
  journalService: {
    getAllJournals: vi.fn(),
    deleteJournal: vi.fn(),
  },
}));

const mockedGetAllJournals = vi.mocked(journalService.getAllJournals);
const mockedDeleteJournal = vi.mocked(journalService.deleteJournal);

const SAMPLE_JOURNALS = [
  { id: 1, title: 'Hackathon Day', content: 'We built something great', mood: 'HAPPY', tags: ['coding'], createdAt: '2024-01-01' },
  { id: 2, title: 'Stressful Week', content: 'Deadlines everywhere', mood: 'STRESSED', tags: [], createdAt: '2024-02-01' },
];

describe('JournalFeed', () => {
  beforeEach(() => {
    mockedGetAllJournals.mockReset();
    mockedDeleteJournal.mockReset();
    mockedGetAllJournals.mockResolvedValue(SAMPLE_JOURNALS as any);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    (URL as any).createObjectURL = vi.fn(() => 'blob:mock-url');
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  });

  it('loads and displays journals', async () => {
    render(<JournalFeed onNewJournal={vi.fn()} onEditJournal={vi.fn()} />);
    expect(await screen.findByText('Hackathon Day')).toBeInTheDocument();
    expect(screen.getByText('Stressful Week')).toBeInTheDocument();
  });

  it('shows the empty state when there are no journals', async () => {
    mockedGetAllJournals.mockResolvedValue([]);
    render(<JournalFeed onNewJournal={vi.fn()} onEditJournal={vi.fn()} />);
    expect(await screen.findByText('No Journal Entries Found')).toBeInTheDocument();
  });

  it('filters by mood pill', async () => {
    const user = userEvent.setup();
    render(<JournalFeed onNewJournal={vi.fn()} onEditJournal={vi.fn()} />);
    await screen.findByText('Hackathon Day');

    await user.click(screen.getByText('STRESSED 😰'));

    expect(screen.getByText('Stressful Week')).toBeInTheDocument();
    expect(screen.queryByText('Hackathon Day')).not.toBeInTheDocument();

    await user.click(screen.getByText('All Entries'));
    expect(screen.getByText('Hackathon Day')).toBeInTheDocument();
  });

  it('calls onEditJournal when a journal card is clicked or its edit button is used', async () => {
    const user = userEvent.setup();
    const onEditJournal = vi.fn();
    render(<JournalFeed onNewJournal={vi.fn()} onEditJournal={onEditJournal} />);
    await screen.findByText('Hackathon Day');

    await user.click(screen.getByText('Hackathon Day'));
    expect(onEditJournal).toHaveBeenCalledWith(SAMPLE_JOURNALS[0]);
  });

  it('deletes a journal after confirmation and shows a toast', async () => {
    mockedDeleteJournal.mockResolvedValue(undefined as any);
    const showToast = vi.fn();
    const user = userEvent.setup();
    render(<JournalFeed onNewJournal={vi.fn()} onEditJournal={vi.fn()} showToast={showToast} />);
    await screen.findByText('Hackathon Day');

    const deleteButtons = screen.getAllByTitle('Delete Entry');
    await user.click(deleteButtons[0]);

    expect(mockedDeleteJournal).toHaveBeenCalledWith(1);
    expect(screen.queryByText('Hackathon Day')).not.toBeInTheDocument();
    expect(showToast).toHaveBeenCalledWith('Journal entry deleted.', 'info');
  });

  it('calls onNewJournal when "New Entry" is clicked', async () => {
    const user = userEvent.setup();
    const onNewJournal = vi.fn();
    render(<JournalFeed onNewJournal={onNewJournal} onEditJournal={vi.fn()} />);
    await screen.findByText('Hackathon Day');

    await user.click(screen.getByText('New Entry'));
    expect(onNewJournal).toHaveBeenCalledTimes(1);
  });

  it('exports to Markdown, JSON, and CSV, triggering a download each time', async () => {
    const showToast = vi.fn();
    const user = userEvent.setup();
    render(<JournalFeed onNewJournal={vi.fn()} onEditJournal={vi.fn()} showToast={showToast} />);
    await screen.findByText('Hackathon Day');

    await user.click(screen.getByText('Export MD'));
    await user.click(screen.getByText('Export JSON'));
    await user.click(screen.getByText('Export CSV'));

    expect(URL.createObjectURL).toHaveBeenCalledTimes(3);
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledTimes(3);
    expect(showToast).toHaveBeenCalledWith('Exported entries to Markdown (.md)', 'success');
    expect(showToast).toHaveBeenCalledWith('Exported entries to JSON (.json)', 'success');
    expect(showToast).toHaveBeenCalledWith('Exported entries to CSV (.csv)', 'success');
  });
});
