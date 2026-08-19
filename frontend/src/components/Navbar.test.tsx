import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Navbar from './Navbar';

const baseProps = {
  activeTab: 'dashboard',
  setActiveTab: vi.fn(),
  onLogout: vi.fn(),
  onOpenAchievements: vi.fn(),
  onOpenSettings: vi.fn(),
};

describe('Navbar', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders the brand and all navigation items', () => {
    render(<Navbar {...baseProps} />);
    expect(screen.getByText('Mindora')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('My Journals')).toBeInTheDocument();
    expect(screen.getByText('Mood Calendar')).toBeInTheDocument();
    expect(screen.getByText('AI Assistant')).toBeInTheDocument();
    expect(screen.getByText('Search')).toBeInTheDocument();
    expect(screen.getByText('Mood Analytics')).toBeInTheDocument();
  });

  it('falls back to "Journaler" when no user_name is stored, and shows a stored one', () => {
    const { unmount } = render(<Navbar {...baseProps} />);
    expect(screen.getByText('Journaler')).toBeInTheDocument();
    unmount();

    localStorage.setItem('user_name', 'Sam');
    render(<Navbar {...baseProps} />);
    expect(screen.getByText('Sam')).toBeInTheDocument();
  });

  it('calls setActiveTab with the right tab id when a nav item is clicked', async () => {
    const user = userEvent.setup();
    render(<Navbar {...baseProps} />);

    await user.click(screen.getByText('My Journals'));

    expect(baseProps.setActiveTab).toHaveBeenCalledWith('journals');
  });

  it('marks the active tab distinctly from inactive ones', () => {
    render(<Navbar {...baseProps} activeTab="calendar" />);
    expect(screen.getByText('Mood Calendar').closest('button')!.className).toContain('font-semibold');
    expect(screen.getByText('Dashboard').closest('button')!.className).toContain('font-medium');
  });

  it('collapsing the sidebar hides labels, brand text, and footer details', async () => {
    const user = userEvent.setup();
    render(<Navbar {...baseProps} />);

    await user.click(screen.getByTitle('Collapse Sidebar'));

    expect(screen.queryByText('Mindora')).not.toBeInTheDocument();
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    expect(screen.queryByText('Badges')).not.toBeInTheDocument();
    expect(screen.queryByText('Journaler')).not.toBeInTheDocument();
    expect(screen.getByTitle('Expand Sidebar')).toBeInTheDocument();
  });

  it('calls onOpenAchievements, onOpenSettings, and onLogout when clicked', async () => {
    const user = userEvent.setup();
    render(<Navbar {...baseProps} />);

    await user.click(screen.getByText('Badges'));
    expect(baseProps.onOpenAchievements).toHaveBeenCalledTimes(1);

    await user.click(screen.getByText('Settings'));
    expect(baseProps.onOpenSettings).toHaveBeenCalledTimes(1);

    await user.click(screen.getByTitle('Logout'));
    expect(baseProps.onLogout).toHaveBeenCalledTimes(1);
  });
});
