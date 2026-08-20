import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import JournalEditor from './JournalEditor';
import { journalService } from '@/services/journalService';
import { aiService } from '@/services/aiService';

vi.mock('@/services/journalService', () => ({
  journalService: {
    createJournal: vi.fn(),
    updateJournal: vi.fn(),
  },
}));

vi.mock('@/services/aiService', () => ({
  aiService: {
    detectMood: vi.fn(),
    rephrase: vi.fn(),
    fixGrammar: vi.fn(),
    chat: vi.fn(),
    summarize: vi.fn(),
    generateTags: vi.fn(),
  },
}));

vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

const mockedCreateJournal = vi.mocked(journalService.createJournal);
const mockedUpdateJournal = vi.mocked(journalService.updateJournal);
const mockedDetectMood = vi.mocked(aiService.detectMood);
const mockedRephrase = vi.mocked(aiService.rephrase);

describe('JournalEditor', () => {
  beforeEach(() => {
    mockedCreateJournal.mockReset();
    mockedUpdateJournal.mockReset();
    mockedDetectMood.mockReset();
    mockedRephrase.mockReset();
    // No primaryMood by default, so the 250ms debounced AI sync effect is a no-op
    // unless a test overrides it - keeps unrelated tests from racing against it.
    mockedDetectMood.mockResolvedValue({ data: {} } as any);
    delete (window as any).SpeechRecognition;
    delete (window as any).webkitSpeechRecognition;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shows "Create Journal Entry" with no initialData, and "Edit Journal Entry" with some', () => {
    const { unmount } = render(<JournalEditor onClose={vi.fn()} onSaveSuccess={vi.fn()} />);
    expect(screen.getByText('Create Journal Entry')).toBeInTheDocument();
    unmount();

    render(
      <JournalEditor
        initialData={{ id: 1, title: 'Old', content: 'Old content', mood: 'HAPPY', tags: [] }}
        onClose={vi.fn()}
        onSaveSuccess={vi.fn()}
      />
    );
    expect(screen.getByText('Edit Journal Entry')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Old')).toBeInTheDocument();
  });

  it('detects mood instantly from keywords as you type, without waiting for AI', async () => {
    const user = userEvent.setup();
    render(<JournalEditor onClose={vi.fn()} onSaveSuccess={vi.fn()} />);

    await user.type(
      screen.getByPlaceholderText(/Write your thoughts/),
      'I am so angry and furious right now'
    );

    expect(await screen.findByText('ANGRY 😠')).toBeInTheDocument();
  });

  it('does not mistake the word "made" for anger (regression: "mad" is a substring of "made")', async () => {
    // Real bug found live: naive .includes('mad') matched inside "made",
    // silently flagging any entry containing that extremely common word as
    // ANGRY - including this exact grateful/happy sentence.
    const user = userEvent.setup();
    render(<JournalEditor onClose={vi.fn()} onSaveSuccess={vi.fn()} />);

    await user.type(
      screen.getByPlaceholderText(/Write your thoughts/),
      'What made me feel grateful today: my happy little dog'
    );

    expect(await screen.findByText('GRATEFUL 🙏')).toBeInTheDocument();
    expect(screen.queryByText('ANGRY 😠')).not.toBeInTheDocument();
  });

  it('requires a whole-word match for short keywords that are also common word prefixes', async () => {
    // "win" (EXCITED) is a literal prefix of "window" and "winter" - an
    // entry just mentioning the weather or opening an app must not be
    // misread as excitement.
    const user = userEvent.setup();
    render(<JournalEditor onClose={vi.fn()} onSaveSuccess={vi.fn()} />);

    await user.type(
      screen.getByPlaceholderText(/Write your thoughts/),
      'I opened the window to feel the winter air'
    );

    expect(screen.queryByText('EXCITED 🤩')).not.toBeInTheDocument();
  });

  it('applies a template to title and content', async () => {
    const user = userEvent.setup();
    render(<JournalEditor onClose={vi.fn()} onSaveSuccess={vi.fn()} />);

    await user.click(screen.getByText('Gratitude Log'));

    expect(screen.getByDisplayValue('Gratitude & Positive Focus')).toBeInTheDocument();
  });

  it('requires title and content before saving', async () => {
    const user = userEvent.setup();
    render(<JournalEditor onClose={vi.fn()} onSaveSuccess={vi.fn()} />);

    // Whitespace-only content satisfies the native HTML `required` attribute
    // (it isn't empty), but should still fail the component's own .trim() check.
    await user.type(screen.getByPlaceholderText(/Completing SaaS UI Redesign/), 'A title');
    await user.type(screen.getByPlaceholderText(/Write your thoughts/), '   ');
    await user.click(screen.getByText('Save Journal Entry'));

    expect(await screen.findByText('Title and Content are required.')).toBeInTheDocument();
    expect(mockedCreateJournal).not.toHaveBeenCalled();
  });

  it('creates a new journal entry on save', async () => {
    mockedCreateJournal.mockResolvedValue({} as any);
    const onSaveSuccess = vi.fn();
    const showToast = vi.fn();
    const user = userEvent.setup();
    render(<JournalEditor onClose={vi.fn()} onSaveSuccess={onSaveSuccess} showToast={showToast} />);

    await user.type(screen.getByPlaceholderText(/Completing SaaS UI Redesign/), 'My Title');
    await user.type(screen.getByPlaceholderText(/Write your thoughts/), 'My content for today');
    await user.click(screen.getByText('Save Journal Entry'));

    await waitFor(() => expect(mockedCreateJournal).toHaveBeenCalledTimes(1));
    const [payload] = mockedCreateJournal.mock.calls[0];
    expect(payload).toMatchObject({ title: 'My Title', content: 'My content for today' });
    expect(onSaveSuccess).toHaveBeenCalledTimes(1);
  });

  it('updates an existing journal entry when initialData has an id', async () => {
    mockedUpdateJournal.mockResolvedValue({} as any);
    const onSaveSuccess = vi.fn();
    const user = userEvent.setup();
    render(
      <JournalEditor
        initialData={{ id: 42, title: 'Existing', content: 'Existing content', mood: 'HAPPY', tags: [] }}
        onClose={vi.fn()}
        onSaveSuccess={onSaveSuccess}
      />
    );

    await user.click(screen.getByText('Save Journal Entry'));

    await waitFor(() => expect(mockedUpdateJournal).toHaveBeenCalledTimes(1));
    expect(mockedUpdateJournal.mock.calls[0][0]).toBe(42);
    expect(mockedCreateJournal).not.toHaveBeenCalled();
    expect(onSaveSuccess).toHaveBeenCalledTimes(1);
  });

  it('adds a tag on Enter and removes it via its close icon, without duplicates', async () => {
    const user = userEvent.setup();
    const { container } = render(<JournalEditor onClose={vi.fn()} onSaveSuccess={vi.fn()} />);

    const tagInput = screen.getByPlaceholderText(/Add tag and hit enter/);
    await user.type(tagInput, 'mindfulness{Enter}');
    expect(screen.getByText('#mindfulness')).toBeInTheDocument();

    // duplicate of an existing default tag should not create a second pill
    await user.type(tagInput, 'reflection{Enter}');
    expect(container.querySelectorAll('span').length).toBeGreaterThan(0);

    const removeIcons = container.querySelectorAll('svg.cursor-pointer');
    expect(removeIcons.length).toBeGreaterThan(0);
  });

  it('rephrases content via the AI toolbar', async () => {
    mockedRephrase.mockResolvedValue({ data: { data: { rephrased: 'A nicer version of the text.' } } } as any);
    const user = userEvent.setup();
    render(<JournalEditor onClose={vi.fn()} onSaveSuccess={vi.fn()} />);

    await user.type(screen.getByPlaceholderText(/Write your thoughts/), 'rough draft text');
    await user.click(screen.getByText('Rephrase Text'));

    expect(await screen.findByDisplayValue('A nicer version of the text.')).toBeInTheDocument();
  });

  it('shows a toast when voice dictation is unsupported in this browser', async () => {
    const user = userEvent.setup();
    const showToast = vi.fn();
    render(<JournalEditor onClose={vi.fn()} onSaveSuccess={vi.fn()} showToast={showToast} />);

    await user.click(screen.getByText('Voice Dictation'));

    expect(showToast).toHaveBeenCalledWith('Speech recognition is not supported in this browser.', 'error');
  });

  it('calls onClose when Cancel is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<JournalEditor onClose={onClose} onSaveSuccess={vi.fn()} />);

    await user.click(screen.getByText('Cancel'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
