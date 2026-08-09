import { useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  BookOpen,
  Sparkles,
  Search,
  BarChart3,
  Calendar,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Award,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  onOpenAchievements: () => void;
  onOpenSettings: () => void;
}

export default function Navbar({ activeTab, setActiveTab, onLogout, onOpenAchievements, onOpenSettings }: NavbarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const username = localStorage.getItem('user_name') || 'Journaler';

  return (
    <motion.aside
      animate={{ width: collapsed ? '80px' : '260px' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className={cn(
        'glass-panel m-4 flex flex-col h-[calc(100vh-2rem)] relative z-20 overflow-hidden',
        collapsed ? 'py-5 px-3' : 'p-6'
      )}
    >
      {/* Collapse Toggle Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className={cn(
          'absolute top-5 bg-white/[0.08] border border-white/[0.12] text-[#94a3b8] rounded-full w-7 h-7 flex items-center justify-center cursor-pointer z-[5]',
          collapsed ? 'right-5' : 'right-4'
        )}
        title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      {/* Brand Header */}
      <div className="flex items-center gap-3 mb-9">
        <div className="bg-[linear-gradient(135deg,var(--accent-indigo,#6366f1),var(--accent-purple,#a855f7))] rounded-xl w-[42px] h-[42px] flex items-center justify-center shrink-0 shadow-[0_4px_12px_rgba(99,102,241,0.4)]">
          <Sparkles size={24} color="#ffffff" />
        </div>
        {!collapsed && (
          <div>
            <h2 className="text-[1.4rem] font-extrabold bg-[linear-gradient(135deg,#ffffff,#94a3b8)] bg-clip-text text-transparent">
              AURA
            </h2>
            <span className="text-xs text-[var(--accent-indigo,#6366f1)] font-semibold tracking-wider">
              AI SAAS PLATFORM
            </span>
          </div>
        )}
      </div>

      {/* Navigation Items */}
      <nav className="flex flex-col gap-2 flex-1">
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
        <div className="flex gap-2 mb-4">
          <button onClick={onOpenAchievements} className="btn-secondary flex-1 p-2 text-[0.8rem] justify-center">
            <Award size={14} color="#fde047" />
            <span>Badges</span>
          </button>

          <button onClick={onOpenSettings} className="btn-secondary flex-1 p-2 text-[0.8rem] justify-center">
            <Settings size={14} color="#38bdf8" />
            <span>Settings</span>
          </button>
        </div>
      )}

      {/* Profile Footer */}
      <div className="pt-4 border-t border-t-white/[0.08]">
        <div className={cn('flex items-center', collapsed ? 'justify-center' : 'justify-between')}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[linear-gradient(135deg,#6366f1,#a855f7)] flex items-center justify-center text-white font-bold shrink-0">
              {username.charAt(0).toUpperCase()}
            </div>
            {!collapsed && (
              <div>
                <div className="text-[0.9rem] font-semibold text-[#f8fafc]">{username}</div>
                <div className="text-xs text-[#4ade80] flex items-center gap-1">
                  <span className="w-[6px] h-[6px] rounded-full bg-[#4ade80]" />
                  <span>10-Min Session</span>
                </div>
              </div>
            )}
          </div>
          {!collapsed && (
            <button
              onClick={onLogout}
              title="Logout"
              className="bg-transparent border-0 text-[#94a3b8] hover:text-[#ef4444] cursor-pointer p-2 rounded-lg transition-all duration-200"
            >
              <LogOut size={18} />
            </button>
          )}
        </div>
      </div>
    </motion.aside>
  );
}

interface NavItemProps {
  icon: ReactNode;
  label: string;
  active: boolean;
  badge?: string;
  collapsed: boolean;
  onClick: () => void;
}

function NavItem({ icon, label, active, badge, collapsed, onClick }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      title={collapsed ? label : ''}
      className={cn(
        'flex items-center gap-[0.85rem] rounded-xl border-0 text-[0.95rem] cursor-pointer w-full transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] relative',
        collapsed ? 'py-3 justify-center' : 'py-[0.85rem] px-4 justify-start',
        active
          ? 'bg-[linear-gradient(135deg,rgba(99,102,241,0.25),rgba(168,85,247,0.15))] text-white font-semibold'
          : 'bg-transparent text-[#94a3b8] font-medium'
      )}
    >
      <span className={active ? 'text-[var(--accent-indigo,#6366f1)]' : 'text-inherit'}>{icon}</span>
      {!collapsed && <span className="flex-1 text-left">{label}</span>}
      {!collapsed && badge && (
        <span className="text-[0.65rem] py-[0.2rem] px-[0.4rem] rounded-md bg-[rgba(99,102,241,0.25)] text-[#818cf8] font-bold">
          {badge}
        </span>
      )}
    </button>
  );
}
