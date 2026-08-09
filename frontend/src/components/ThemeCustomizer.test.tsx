import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ThemeCustomizer from './ThemeCustomizer';

describe('ThemeCustomizer', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.style.removeProperty('--accent-indigo');
    document.documentElement.style.removeProperty('--accent-purple');
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('applies the default (indigo) accent on mount', () => {
    render(<ThemeCustomizer />);
    expect(document.documentElement.style.getPropertyValue('--accent-indigo')).toBe('#6366f1');
  });

  it('opens the palette dropdown and lists all themes', async () => {
    const user = userEvent.setup();
    render(<ThemeCustomizer />);

    await user.click(screen.getByTitle('Customize Theme Palette'));

    expect(screen.getByText('Neon Indigo')).toBeInTheDocument();
    expect(screen.getByText('Cyberpunk Cyan')).toBeInTheDocument();
    expect(screen.getByText('Emerald Forest')).toBeInTheDocument();
    expect(screen.getByText('Sunset Rose')).toBeInTheDocument();
  });

  it('selecting a theme updates CSS variables, persists to localStorage, and closes the dropdown', async () => {
    const user = userEvent.setup();
    render(<ThemeCustomizer />);

    await user.click(screen.getByTitle('Customize Theme Palette'));
    await user.click(screen.getByText('Cyberpunk Cyan'));

    expect(document.documentElement.style.getPropertyValue('--accent-indigo')).toBe('#06b6d4');
    expect(document.documentElement.style.getPropertyValue('--accent-purple')).toBe('#3b82f6');
    expect(localStorage.getItem('aura_theme')).toBe('cyan');
    expect(screen.queryByText('Cyberpunk Cyan')).not.toBeInTheDocument();
  });
});
