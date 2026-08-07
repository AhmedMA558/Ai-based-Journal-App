import React from 'react';
import { Smile, Zap, Coffee, Flame, Heart, RefreshCcw } from 'lucide-react';

export default function MoodWheel({ selectedMood, onSelectMood }) {
  const moods = [
    { id: 'HAPPY', label: 'Happy', emoji: '😊', color: '#4ade80', bg: 'rgba(74, 222, 128, 0.15)', border: '#4ade80' },
    { id: 'EXCITED', label: 'Excited', emoji: '🤩', color: '#fde047', bg: 'rgba(253, 224, 71, 0.15)', border: '#fde047' },
    { id: 'RELAXED', label: 'Relaxed', emoji: '😌', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)', border: '#38bdf8' },
    { id: 'STRESSED', label: 'Stressed', emoji: '😰', color: '#f87171', bg: 'rgba(248, 113, 113, 0.15)', border: '#f87171' },
    { id: 'SAD', label: 'Sad', emoji: '🥺', color: '#c084fc', bg: 'rgba(192, 132, 252, 0.15)', border: '#c084fc' },
    { id: 'GRATEFUL', label: 'Grateful', emoji: '🙏', color: '#fb7185', bg: 'rgba(251, 113, 133, 0.15)', border: '#fb7185' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <label style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: '600' }}>Select Active Mood Aura</label>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '0.75rem' }}>
        {moods.map((m) => {
          const isSelected = (selectedMood || '').toUpperCase() === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onSelectMood(m.id, m.emoji)}
              style={{
                background: isSelected ? m.bg : 'rgba(255, 255, 255, 0.04)',
                border: isSelected ? `2px solid ${m.border}` : '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: isSelected ? `0 0 20px ${m.bg}` : 'none',
                borderRadius: '16px',
                padding: '0.75rem 0.5rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.4rem',
                cursor: 'pointer',
                transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
                transform: isSelected ? 'scale(1.05)' : 'scale(1)'
              }}
            >
              <span style={{ fontSize: '1.75rem' }}>{m.emoji}</span>
              <span style={{ fontSize: '0.8rem', fontWeight: isSelected ? '700' : '500', color: isSelected ? m.color : '#94a3b8' }}>
                {m.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
