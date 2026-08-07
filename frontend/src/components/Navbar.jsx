import React from 'react';
import { LayoutDashboard, BookOpen, Sparkles, Search, BarChart3, Calendar, LogOut, User } from 'lucide-react';
import ThemeCustomizer from './ThemeCustomizer';

export default function Navbar({ activeTab, setActiveTab, user, onLogout }) {
  const username = localStorage.getItem('user_name') || 'Journaler';

  return (
    <aside className="glass-panel" style={{ margin: '1rem', padding: '1.5rem', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 2rem)' }}>
      {/* Brand Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--accent-indigo, #6366f1), var(--accent-purple, #a855f7))',
            borderRadius: '12px',
            width: '42px',
            height: '42px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)'
          }}>
            <Sparkles size={24} color="#ffffff" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', background: 'linear-gradient(135deg, #ffffff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              AURA
            </h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--accent-indigo, #6366f1)', fontWeight: '600', letterSpacing: '0.05em' }}>AI PLATFORM</span>
          </div>
        </div>

        {/* Theme Customizer Palette Selector */}
        <ThemeCustomizer />
      </div>

      {/* Navigation Items */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
        <NavItem
          icon={<LayoutDashboard size={20} />}
          label="Dashboard"
          active={activeTab === 'dashboard'}
          onClick={() => setActiveTab('dashboard')}
        />
        <NavItem
          icon={<BookOpen size={20} />}
          label="My Journals"
          active={activeTab === 'journals'}
          onClick={() => setActiveTab('journals')}
        />
        <NavItem
          icon={<Calendar size={20} />}
          label="Mood Calendar"
          active={activeTab === 'calendar'}
          onClick={() => setActiveTab('calendar')}
        />
        <NavItem
          icon={<Sparkles size={20} />}
          label="AI Assistant"
          active={activeTab === 'ai-chat'}
          badge="Python AI"
          onClick={() => setActiveTab('ai-chat')}
        />
        <NavItem
          icon={<Search size={20} />}
          label="Elastic Search"
          active={activeTab === 'search'}
          badge="ES 8.x"
          onClick={() => setActiveTab('search')}
        />
        <NavItem
          icon={<BarChart3 size={20} />}
          label="Mood Analytics"
          active={activeTab === 'analytics'}
          onClick={() => setActiveTab('analytics')}
        />
      </nav>

      {/* Profile Footer */}
      <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={18} color="#f8fafc" />
            </div>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#f8fafc' }}>{username}</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Active Session</div>
            </div>
          </div>
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
        </div>
      </div>
    </aside>
  );
}

function NavItem({ icon, label, active, badge, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.85rem',
        padding: '0.85rem 1rem',
        borderRadius: '12px',
        border: 'none',
        background: active ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.15))' : 'transparent',
        color: active ? '#ffffff' : '#94a3b8',
        fontWeight: active ? '600' : '500',
        fontSize: '0.95rem',
        cursor: 'pointer',
        width: '100%',
        textAlign: 'left',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative'
      }}
    >
      <span style={{ color: active ? 'var(--accent-indigo, #6366f1)' : 'inherit' }}>{icon}</span>
      <span style={{ flex: 1 }}>{label}</span>
      {badge && (
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
