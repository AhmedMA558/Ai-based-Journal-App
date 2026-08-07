import React from 'react';

export default function MoodWheel({ selectedMood, onSelectMood }) {
  const moods = [
    { key: 'HAPPY', label: 'Happy', emoji: '😊', bg: 'rgba(74, 222, 128, 0.15)', border: 'rgba(74, 222, 128, 0.4)', text: '#4ade80' },
    { key: 'EXCITED', label: 'Excited', emoji: '🤩', bg: 'rgba(253, 224, 71, 0.15)', border: 'rgba(253, 224, 71, 0.4)', text: '#fde047' },
    { key: 'RELAXED', label: 'Relaxed', emoji: '😌', bg: 'rgba(56, 189, 248, 0.15)', border: 'rgba(56, 189, 248, 0.4)', text: '#38bdf8' },
    { key: 'STRESSED', label: 'Stressed', emoji: '😰', bg: 'rgba(248, 113, 113, 0.15)', border: 'rgba(248, 113, 113, 0.4)', text: '#f87171' },
    { key: 'SAD', label: 'Sad', emoji: '🥺', bg: 'rgba(192, 132, 252, 0.15)', border: 'rgba(192, 132, 252, 0.4)', text: '#c084fc' },
    { key: 'GRATEFUL', label: 'Grateful', emoji: '🙏', bg: 'rgba(251, 113, 133, 0.15)', border: 'rgba(251, 113, 133, 0.4)', text: '#fb7185' },
    { key: 'ANGRY', label: 'Angry', emoji: '😠', bg: 'rgba(239, 68, 68, 0.2)', border: 'rgba(239, 68, 68, 0.5)', text: '#ef4444' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <label style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: '600' }}>Select Active Mood Aura</label>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '0.6rem' }}>
        {moods.map((m) => {
          const isSelected = selectedMood === m.key;
          return (
            <button
              key={m.key}
              type="button"
              onClick={() => onSelectMood(m.key, m.emoji)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.35rem',
                padding: '0.65rem 0.5rem',
                borderRadius: '14px',
                background: isSelected ? m.bg : 'rgba(255, 255, 255, 0.03)',
                border: isSelected ? `2px solid ${m.text}` : '1px solid rgba(255, 255, 255, 0.08)',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: isSelected ? `0 0 16px ${m.bg}` : 'none',
                transform: isSelected ? 'scale(1.03)' : 'scale(1)'
              }}
            >
              <span style={{ fontSize: '1.4rem' }}>{m.emoji}</span>
              <span style={{ fontSize: '0.75rem', fontWeight: isSelected ? '700' : '500', color: isSelected ? m.text : 'var(--text-secondary)' }}>
                {m.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
