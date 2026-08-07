import React, { useState, useEffect } from 'react';
import { Palette, Check } from 'lucide-react';

export default function ThemeCustomizer() {
  const [theme, setTheme] = useState(localStorage.getItem('aura_theme') || 'indigo');
  const [isOpen, setIsOpen] = useState(false);

  const themes = [
    { id: 'indigo', name: 'Neon Indigo', primary: '#6366f1', purple: '#a855f7' },
    { id: 'cyan', name: 'Cyberpunk Cyan', primary: '#06b6d4', purple: '#3b82f6' },
    { id: 'emerald', name: 'Emerald Forest', primary: '#10b981', purple: '#059669' },
    { id: 'rose', name: 'Sunset Rose', primary: '#f43f5e', purple: '#ec4899' },
  ];

  const applyTheme = (themeId) => {
    setTheme(themeId);
    localStorage.setItem('aura_theme', themeId);
    const selected = themes.find(t => t.id === themeId);
    if (selected) {
      document.documentElement.style.setProperty('--accent-indigo', selected.primary);
      document.documentElement.style.setProperty('--accent-purple', selected.purple);
    }
  };

  useEffect(() => {
    applyTheme(theme);
  }, []);

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn-secondary"
        style={{ padding: '0.5rem 0.85rem', fontSize: '0.85rem' }}
        title="Customize Theme Palette"
      >
        <Palette size={16} color="#c084fc" />
        <span>Theme</span>
      </button>

      {isOpen && (
        <div
          className="glass-panel animate-fade-in"
          style={{
            position: 'absolute',
            top: '2.8rem',
            right: 0,
            zIndex: 999,
            padding: '1rem',
            width: '200px',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}
        >
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600', marginBottom: '0.2rem' }}>ACCENT PALETTE</div>
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => { applyTheme(t.id); setIsOpen(false); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.45rem 0.75rem',
                borderRadius: '8px',
                border: 'none',
                background: theme === t.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                color: '#f8fafc',
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: t.primary }}></span>
                <span>{t.name}</span>
              </div>
              {theme === t.id && <Check size={14} color="#4ade80" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
