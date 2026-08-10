import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AIChatView from './AIChatView';
import { aiService } from '@/services/aiService';

vi.mock('@/services/aiService', () => ({
  aiService: {
    chat: vi.fn(),
  },
}));

const mockedChat = vi.mocked(aiService.chat);

const mockWriteText = vi.fn().mockResolvedValue(undefined);
Object.defineProperty(navigator, 'clipboard', {
  value: { writeText: mockWriteText },
  writable: true,
  configurable: true,
});

beforeEach(() => {
  mockedChat.mockReset();
  mockWriteText.mockClear();
  vi.spyOn(window, 'confirm').mockReturnValue(true);
  Element.prototype.scrollIntoView = vi.fn();
});

describe('AIChatView', () => {
  it('renders the initial greeting and preset prompts', () => {
    render(<AIChatView />);
    expect(screen.getByText(/personal AI Journal Companion/)).toBeInTheDocument();
    expect(screen.getByText('Suggest 3 daily journal prompts for mindfulness')).toBeInTheDocument();
  });

  it('disables the send button when the input is empty', () => {
    render(<AIChatView />);
    expect(screen.getByRole('button', { name: /Send/ })).toBeDisabled();
  });

  it('sends a typed message and displays the AI reply', async () => {
    mockedChat.mockResolvedValue({ data: { data: 'Here is a helpful reply.' } } as any);
    const user = userEvent.setup();
    render(<AIChatView />);

    await user.type(screen.getByPlaceholderText('Ask AI for advice, journaling prompts, rephrasing...'), 'Hello there');
    await user.click(screen.getByRole('button', { name: /Send/ }));

    expect(mockedChat).toHaveBeenCalledWith('Hello there');
    expect(screen.getByText('Hello there')).toBeInTheDocument();
    expect(await screen.findByText('Here is a helpful reply.')).toBeInTheDocument();
  });

  it('sends a preset prompt when clicked', async () => {
    mockedChat.mockResolvedValue({ data: { data: 'Sure, here are some prompts.' } } as any);
    const user = userEvent.setup();
    render(<AIChatView />);

    await user.click(screen.getByText('Summarize my emotional growth & wins'));

    expect(mockedChat).toHaveBeenCalledWith('Summarize my emotional growth & wins');
    expect(await screen.findByText('Sure, here are some prompts.')).toBeInTheDocument();
  });

  it('shows a fallback message when the chat request fails', async () => {
    mockedChat.mockRejectedValue(new Error('network down'));
    const user = userEvent.setup();
    render(<AIChatView />);

    await user.type(screen.getByPlaceholderText('Ask AI for advice, journaling prompts, rephrasing...'), 'Hi');
    await user.click(screen.getByRole('button', { name: /Send/ }));

    expect(await screen.findByText(/encountered an issue generating a response/)).toBeInTheDocument();
  });

  it('copies an AI message to the clipboard when the copy button is clicked', async () => {
    const user = userEvent.setup();
    // userEvent.setup() installs its own navigator.clipboard stub (for user.copy()/paste()
    // support), replacing the module-level mock defined above - so this test spies on
    // whatever clipboard object is live *after* setup() runs, not before.
    const writeTextSpy = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
    render(<AIChatView />);

    await user.click(screen.getByTitle('Copy text'));

    expect(writeTextSpy).toHaveBeenCalledWith(expect.stringContaining('personal AI Journal Companion'));
  });

  it('clears chat history after confirmation', async () => {
    const user = userEvent.setup();
    render(<AIChatView />);

    await user.click(screen.getByTitle('Clear Chat'));

    expect(window.confirm).toHaveBeenCalled();
    expect(screen.getByText('Chat history reset. How can I help you today?')).toBeInTheDocument();
    expect(screen.queryByText(/personal AI Journal Companion/)).not.toBeInTheDocument();
  });
});
