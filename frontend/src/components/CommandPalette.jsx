import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Sparkles, BookOpen, Calendar, BarChart3, Moon, Sun, Download, Command, X, Mic } from 'lucide-react';

export default function CommandPalette({ isOpen, onClose, onSelectAction }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const actions = [
    { id: 'new-journal', label: 'Create New Journal Entry', category: 'Actions', icon: <Plus size={18} color="#818cf8" />, shortcut: 'N' },
    { id: 'voice-dictation', label: 'Start Voice Dictation', category: 'Actions', icon: <Mic size={18} color="#4ade80" />, shortcut: 'V' },
    { id: 'ai-chat', label: 'Open AI Conversational Assistant', category: 'AI Tools', icon: <Sparkles size={18} color="#c084fc" />, shortcut: 'A' },
    { id: 'journals', label: 'View All Journal Entries', category: 'Navigation', icon: <BookOpen size={18} color="#38bdf8" />, shortcut: 'J' },
    { id: 'calendar', label: 'Open Mood Heatmap Calendar', category: 'Navigation', icon: <Calendar size={18} color="#fde047" />, shortcut: 'C' },
    { id: 'search', label: 'Type-Ahead Deep Search', category: 'Navigation', icon: <Search size={18} color="#fb7185" />, shortcut: 'S' },
    { id: 'analytics', label: 'View Real-Time Data Analytics', category: 'Navigation', icon: <BarChart3 size={18} color="#4ade80" />, shortcut: 'R' },
    { id: 'toggle-theme', label: 'Toggle Light / Dark Mode', category: 'Preferences', icon: <Sun size={18} color="#f59e0b" />, shortcut: 'T' },
  ];

  const filteredActions = actions.filter(act =>
    act.label.toLowerCase().includes(query.toLowerCase()) ||
    act.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % (filteredActions.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredActions.length) % (filteredActions.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredActions[selectedIndex]) {
          handleExecute(filteredActions[selectedIndex].id);
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredActions]);

  const handleExecute = (actionId) => {
    onSelectAction(actionId);
    onClose();
    setQuery('');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(8px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          paddingTop: '10vh'
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          onClick={(e) => e.stopPropagation()}
          className="glass-panel"
          style={{
            width: '100%',
            maxWidth: '640px',
            overflow: 'hidden',
            boxShadow: '0 24px 48px rgba(0, 0, 0, 0.5)',
            border: '1px solid rgba(255, 255, 255, 0.15)'
          }}
        >
          {/* Command Search Header */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)', gap: '0.85rem' }}>
            <Search size={22} color="var(--accent-indigo, #6366f1)" />
            <input
              type="text"
              autoFocus
              placeholder="Type a command or search actions..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text-primary, #ffffff)',
                fontSize: '1.1rem',
                width: '100%',
                fontWeight: '500'
              }}
            />
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}>
              <X size={20} />
            </button>
          </div>

          {/* Action List */}
          <div style={{ maxHeight: '380px', overflowY: 'auto', padding: '0.75rem' }}>
            {filteredActions.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>
                No commands matching "{query}"
              </div>
            ) : (
              filteredActions.map((act, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <div
                    key={act.id}
                    onClick={() => handleExecute(act.id)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.85rem 1rem',
                      borderRadius: '12px',
                      background: isSelected ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(168, 85, 247, 0.15))' : 'transparent',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      {act.icon}
                      <div>
                        <div style={{ fontSize: '0.95rem', fontWeight: '600', color: isSelected ? '#ffffff' : 'var(--text-primary)' }}>
                          {act.label}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{act.category}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span style={{ fontSize: '0.7rem', color: '#818cf8', background: 'rgba(99,102,241,0.15)', padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: '700' }}>
                        {act.shortcut}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Bar */}
          <div style={{ padding: '0.75rem 1.5rem', background: 'rgba(0, 0, 0, 0.2)', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span><strong style={{ color: '#94a3b8' }}>↑↓</strong> Navigate</span>
              <span><strong style={{ color: '#94a3b8' }}>↵</strong> Select</span>
              <span><strong style={{ color: '#94a3b8' }}>ESC</strong> Close</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Command size={12} />
              <span>Raycast Command Palette</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
