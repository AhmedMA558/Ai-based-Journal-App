import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Flame, Sparkles, Smile, BookOpen, X, CheckCircle2 } from 'lucide-react';

export default function AchievementsModal({ isOpen, onClose, journalCount = 5 }) {
  if (!isOpen) return null;

  const badges = [
    {
      id: 1,
      title: 'First Reflection 📝',
      desc: 'Logged your first AI-analyzed journal entry',
      unlocked: journalCount >= 1,
      icon: <BookOpen size={24} color="#38bdf8" />
    },
    {
      id: 2,
      title: '3-Day Streak 🔥',
      desc: 'Maintained a 3-day continuous journaling streak',
      unlocked: journalCount >= 3,
      icon: <Flame size={24} color="#fde047" />
    },
    {
      id: 3,
      title: 'AI Pioneer 🤖',
      desc: 'Used AI Assistant for reflection insights',
      unlocked: true,
      icon: <Sparkles size={24} color="#c084fc" />
    },
    {
      id: 4,
      title: 'Emotional Master 😌',
      desc: 'Recorded journals across 5 distinct mood categories',
      unlocked: journalCount >= 5,
      icon: <Smile size={24} color="#4ade80" />
    }
  ];

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
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem'
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          className="glass-panel"
          style={{
            width: '100%',
            maxWidth: '580px',
            padding: '1.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            boxShadow: '0 24px 48px rgba(0, 0, 0, 0.5)'
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{ padding: '0.5rem', borderRadius: '12px', background: 'rgba(234, 179, 8, 0.15)' }}>
                <Award size={22} color="#fde047" />
              </div>
              <div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: '700' }}>Journaling Achievements</h2>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Milestones unlocked as you reflect</span>
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}>
              <X size={20} />
            </button>
          </div>

          {/* Badges Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            {badges.map((b) => (
              <div
                key={b.id}
                style={{
                  background: b.unlocked ? 'rgba(99, 102, 241, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                  border: b.unlocked ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid rgba(255, 255, 255, 0.06)',
                  padding: '1.25rem',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.85rem',
                  opacity: b.unlocked ? 1 : 0.5
                }}
              >
                <div style={{ padding: '0.5rem', borderRadius: '12px', background: 'rgba(255,255,255,0.06)' }}>
                  {b.icon}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#f8fafc' }}>{b.title}</h4>
                    {b.unlocked && <CheckCircle2 size={14} color="#4ade80" />}
                  </div>
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8', lineHeight: '1.3' }}>{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
