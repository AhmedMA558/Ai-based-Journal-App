import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, BookOpen, Sparkles, Search, BarChart3, Calendar, LogOut, User, ShieldCheck, ChevronLeft, ChevronRight, Award, Settings } from 'lucide-react';
import ThemeCustomizer from './ThemeCustomizer';

export default function Navbar({ activeTab, setActiveTab, user, onLogout, onOpenAchievements, onOpenSettings }) {
  const [collapsed, setCollapsed] = useState(false);
  const username = localStorage.getItem('user_name') || 'Journaler';

  return (
    <motion.aside
      animate={{ width: collapsed ? '80px' : '260px' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="glass-panel"
      style={{
        margin: '1rem',
        padding: collapsed ? '1.25rem 0.75rem' : '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 2rem)',
        position: 'relative',
        zIndex: 20,
        overflow: 'hidden'
      }}
    >
      {/* Collapse Toggle Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{
          position: 'absolute',
          top: '1.25rem',
          right: collapsed ? '1.25rem' : '1rem',
          background: 'rgba(255, 255, 255, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          color: '#94a3b8',
          borderRadius: '50%',
          width: '28px',
          height: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 5
        }}
        title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      {/* Brand Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.25rem' }}>
        <div style={{
          background: 'linear-gradient(135deg, var(--accent-indigo, #6366f1), var(--accent-purple, #a855f7))',
          borderRadius: '12px',
          width: '42px',
          height: '42px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)'
        }}>
          <Sparkles size={24} color="#ffffff" />
        </div>
        {!collapsed && (
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', background: 'linear-gradient(135deg, #ffffff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              AURA
            </h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--accent-indigo, #6366f1)', fontWeight: '600', letterSpacing: '0.05em' }}>AI SAAS PLATFORM</span>
          </div>
        )}
      </div>

      {/* Navigation Items */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
        <NavItem
          icon={<LayoutDashboard size={20} />}
          label="Dashboard"
          active={activeTab === 'dashboard'}
          collapsed={collapsed}
          onClick={() => setActiveTab('dashboard')}
        />
        <NavItem
          icon={<BookOpen size={20} />}
          label="My Journals"
          active={activeTab === 'journals'}
          collapsed={collapsed}
          onClick={() => setActiveTab('journals')}
        />
        <NavItem
          icon={<Calendar size={20} />}
          label="Mood Calendar"
          active={activeTab === 'calendar'}
          collapsed={collapsed}
          onClick={() => setActiveTab('calendar')}
        />
        <NavItem
          icon={<Sparkles size={20} />}
          label="AI Assistant"
          active={activeTab === 'ai-chat'}
          badge="Python AI"
          collapsed={collapsed}
          onClick={() => setActiveTab('ai-chat')}
        />
        <NavItem
          icon={<Search size={20} />}
          label="Elastic Search"
          active={activeTab === 'search'}
          badge="ES 8.x"
          collapsed={collapsed}
          onClick={() => setActiveTab('search')}
        />
        <NavItem
          icon={<BarChart3 size={20} />}
          label="Mood Analytics"
          active={activeTab === 'analytics'}
          collapsed={collapsed}
          onClick={() => setActiveTab('analytics')}
        />
      </nav>

      {/* Gamified Achievements & Settings Triggers */}
      {!collapsed && (
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <button
            onClick={onOpenAchievements}
            className="btn-secondary"
            style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem', justifyContent: 'center' }}
          >
            <Award size={14} color="#fde047" />
            <span>Badges</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="btn-secondary"
            style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem', justifyContent: 'center' }}
          >
            <Settings size={14} color="#38bdf8" />
            <span>Settings</span>
          </button>
        </div>
      )}

      {/* Profile Footer */}
      <div style={{ paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '700', flexShrink: 0 }}>
              {username.charAt(0).toUpperCase()}
            </div>
            {!collapsed && (
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#f8fafc' }}>{username}</div>
                <div style={{ fontSize: '0.75rem', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80' }}></span>
                  <span>10-Min Session</span>
                </div>
              </div>
            )}
          </div>
          {!collapsed && (
            <button
              onClick={onLogout}
              title="Logout"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '0.5rem',
                borderRadius: '8px',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.color = '#ef4444'}
              onMouseOut={(e) => e.currentTarget.style.color = '#94a3b8'}
            >
              <LogOut size={18} />
            </button>
          )}
        </div>
      </div>
    </motion.aside>
  );
}

function NavItem({ icon, label, active, badge, collapsed, onClick }) {
  return (
    <button
      onClick={onClick}
      title={collapsed ? label : ''}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.85rem',
        padding: collapsed ? '0.75rem 0' : '0.85rem 1rem',
        justifyContent: collapsed ? 'center' : 'flex-start',
        borderRadius: '12px',
        border: 'none',
        background: active ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(168, 85, 247, 0.15))' : 'transparent',
        color: active ? '#ffffff' : '#94a3b8',
        fontWeight: active ? '600' : '500',
        fontSize: '0.95rem',
        cursor: 'pointer',
        width: '100%',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative'
      }}
    >
      <span style={{ color: active ? 'var(--accent-indigo, #6366f1)' : 'inherit' }}>{icon}</span>
      {!collapsed && <span style={{ flex: 1, textAlign: 'left' }}>{label}</span>}
      {!collapsed && badge && (
        <span style={{
          fontSize: '0.65rem',
          padding: '0.2rem 0.4rem',
          borderRadius: '6px',
          background: 'rgba(99, 102, 241, 0.25)',
          color: '#818cf8',
          fontWeight: '700'
        }}>
          {badge}
        </span>
      )}
    </button>
  );
}
