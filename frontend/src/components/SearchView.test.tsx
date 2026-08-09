import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchView from './SearchView';
import { journalService } from '@/services/journalService';

vi.mock('@/services/journalService', () => ({
  journalService: {
    getAllJournals: vi.fn(),
  },
}));

const mockedGetAllJournals = vi.mocked(journalService.getAllJournals);

const SAMPLE_JOURNALS = [
  { id: 1, title: 'Hackathon Day', content: 'We built something great', mood: 'HAPPY', tags: ['coding'], createdAt: '2024-01-01' },
  { id: 2, title: 'Stressful Week', content: 'Deadlines everywhere', mood: 'STRESSED', tags: ['work'], createdAt: '2024-02-01' },
  { id: 3, title: 'Gratitude Journal', content: 'Thankful for friends', mood: 'GRATEFUL', tags: ['gratitude'], createdAt: '2024-03-01' },
];

describe('SearchView', () => {
  beforeEach(() => {
    mockedGetAllJournals.mockReset();
    mockedGetAllJournals.mockResolvedValue(SAMPLE_JOURNALS as any);
  });

  it('renders the header and loads all journals initially', async () => {
    render(<SearchView />);
    expect(screen.getByText('Deep Type-Ahead Elasticsearch')).toBeInTheDocument();
    expect(await screen.findByText('Hackathon Day')).toBeInTheDocument();
    expect(screen.getByText(/Found/)).toHaveTextContent('Found 3 matching entries');
  });

  it('filters by search query across title/content/mood/tags', async () => {
    const user = userEvent.setup();
    render(<SearchView />);
    await screen.findByText('Hackathon Day');

    await user.type(
      screen.getByPlaceholderText('Type anything to search in real-time (e.g. hackathon, stressed, gratitude)...'),
      'gratitude'
    );

    expect(await screen.findByText('Gratitude Journal')).toBeInTheDocument();
    expect(screen.queryByText('Hackathon Day')).not.toBeInTheDocument();
    expect(screen.queryByText('Stressful Week')).not.toBeInTheDocument();
  });

  it('filters by mood pill selection', async () => {
    const user = userEvent.setup();
    render(<SearchView />);
    await screen.findByText('Hackathon Day');

    await user.click(screen.getByText('STRESSED 😰'));

    expect(await screen.findByText('Stressful Week')).toBeInTheDocument();
    expect(screen.queryByText('Hackathon Day')).not.toBeInTheDocument();
  });

  it('sorts newest first by default and re-sorts oldest first on demand', async () => {
    const user = userEvent.setup();
    render(<SearchView />);
    await screen.findByText('Hackathon Day');

    // The fetch-completion render and the sort-effect render are two separate commits
    // (fetchAllJournals sets filteredResults to the raw fetch order first; the sort
    // effect re-sorts and re-renders right after) - wait for the settled, sorted order
    // rather than asserting immediately after the first text appears.
    await waitFor(() => {
      const titles = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
      expect(titles).toEqual(['Gratitude Journal', 'Stressful Week', 'Hackathon Day']);
    });

    await user.selectOptions(screen.getByDisplayValue('Newest First'), 'oldest');

    await waitFor(() => {
      const titles = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
      expect(titles).toEqual(['Hackathon Day', 'Stressful Week', 'Gratitude Journal']);
    });
  });

  it('shows the empty state when nothing matches', async () => {
    const user = userEvent.setup();
    render(<SearchView />);
    await screen.findByText('Hackathon Day');

    await user.type(
      screen.getByPlaceholderText('Type anything to search in real-time (e.g. hackathon, stressed, gratitude)...'),
      'zzzznomatch'
    );

    expect(await screen.findByText('No Matching Entries')).toBeInTheDocument();
  });
});
