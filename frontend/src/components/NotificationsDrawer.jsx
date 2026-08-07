import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Sparkles, Flame, CheckCircle, X, ShieldCheck } from 'lucide-react';

export default function NotificationsDrawer({ isOpen, onClose, notifications = [], onMarkAllRead }) {
  if (!isOpen) return null;

  const defaultNotifications = [
    {
      id: 1,
      title: 'AI Daily Wellness Suggestion',
      message: 'Take 5 deep breaths and write down 3 things you are grateful for today.',
      time: '10m ago',
      type: 'ai',
      icon: <Sparkles size={16} color="#c084fc" />
    },
    {
      id: 2,
      title: '3-Day Journaling Streak Unlocked! 🔥',
      message: 'Awesome consistency! You have logged entries for 3 consecutive days.',
      time: '2h ago',
      type: 'streak',
      icon: <Flame size={16} color="#fde047" />
    },
    {
      id: 3,
      title: 'Session Security Active',
      message: 'Your 10-minute active session is active and verified.',
      time: '1h ago',
      type: 'security',
      icon: <ShieldCheck size={16} color="#38bdf8" />
    }
  ];

  const displayList = notifications.length > 0 ? notifications : defaultNotifications;

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
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(4px)',
          zIndex: 9998,
          display: 'flex',
          justifyContent: 'flex-end'
        }}
      >
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          onClick={(e) => e.stopPropagation()}
          className="glass-panel"
          style={{
            width: '100%',
            maxWidth: '380px',
            height: '100vh',
            borderRadius: 0,
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            boxShadow: '-12px 0 32px rgba(0,0,0,0.4)',
            borderLeft: '1px solid rgba(255,255,255,0.1)'
          }}
        >
          {/* Drawer Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <Bell size={20} color="var(--accent-indigo, #6366f1)" />
              <h2 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Notifications</h2>
            </div>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}>
              <X size={20} />
            </button>
          </div>

          {/* Action Bar */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={onMarkAllRead}
              style={{ background: 'transparent', border: 'none', color: '#818cf8', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <CheckCircle size={14} />
              <span>Mark all as read</span>
            </button>
          </div>

          {/* Notifications Feed */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {displayList.map((item) => (
              <div
                key={item.id}
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  padding: '1rem',
                  borderRadius: '16px',
                  display: 'flex',
                  gap: '0.75rem',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ padding: '0.5rem', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', height: 'fit-content' }}>
                  {item.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-primary)' }}>{item.title}</h4>
                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{item.time}</span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{item.message}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
