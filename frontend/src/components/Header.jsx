import React from 'react';
import { Search, Bell, Sparkles, Moon, Sun, Command, ShieldCheck, User } from 'lucide-react';

export default function Header({ onOpenCommandPalette, onToggleTheme, theme, onOpenNotifications, unreadCount = 2, onOpenSettings }) {
  const username = localStorage.getItem('user_name') || 'Journaler';

  return (
    <header className="glass-panel" style={{ margin: '1rem 1rem 0 1rem', padding: '0.85rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '20px', zIndex: 10 }}>
      {/* Search Bar / Raycast Command Palette Launcher */}
      <button
        onClick={onOpenCommandPalette}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '0.5rem 1rem',
          borderRadius: '12px',
          color: 'var(--text-secondary, #94a3b8)',
          fontSize: '0.9rem',
          cursor: 'pointer',
          width: '320px',
          maxWidth: '100%',
          transition: 'all 0.2s ease'
        }}
      >
        <Search size={16} color="var(--accent-indigo, #6366f1)" />
        <span style={{ flex: 1, textAlign: 'left' }}>Search commands, actions...</span>
        <span style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.2rem',
          fontSize: '0.7rem',
          background: 'rgba(255, 255, 255, 0.1)',
          padding: '0.15rem 0.45rem',
          borderRadius: '6px',
          color: 'var(--text-primary)',
          fontWeight: '600'
        }}>
          <Command size={10} /> K
        </span>
      </button>

      {/* Right Controls Suite */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        {/* 10-Min Active Session Security Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          background: 'rgba(99, 102, 241, 0.12)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          padding: '0.4rem 0.75rem',
          borderRadius: '12px',
          fontSize: '0.75rem',
          color: '#38bdf8',
          fontWeight: '600'
        }}>
          <ShieldCheck size={14} color="#38bdf8" />
          <span>10-Min Session Active</span>
        </div>

        {/* Notifications Drawer Button */}
        <button
          onClick={onOpenNotifications}
          style={{
            position: 'relative',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '0.5rem',
            borderRadius: '12px',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              background: '#ef4444',
              color: '#ffffff',
              fontSize: '0.65rem',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {unreadCount}
            </span>
          )}
        </button>

        {/* Theme Toggle Button */}
        <button
          onClick={onToggleTheme}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '0.5rem',
            borderRadius: '12px',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Toggle Dark / Light Theme"
        >
          {theme === 'light' ? <Moon size={18} color="#6366f1" /> : <Sun size={18} color="#f59e0b" />}
        </button>

        {/* User Profile Pill */}
        <div
          onClick={onOpenSettings}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '0.35rem 0.75rem 0.35rem 0.4rem',
            borderRadius: '16px',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--accent-indigo, #6366f1), var(--accent-purple, #a855f7))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontWeight: '700',
            fontSize: '0.85rem'
          }}>
            {username.charAt(0).toUpperCase()}
          </div>
          <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)' }}>
            {username}
          </span>
        </div>
      </div>
    </header>
  );
}
