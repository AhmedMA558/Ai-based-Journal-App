import { Search, Bell, ShieldCheck, Moon, Sun, Command } from 'lucide-react';

interface HeaderProps {
  onOpenCommandPalette: () => void;
  onToggleTheme: () => void;
  theme: string;
  onOpenNotifications: () => void;
  unreadCount?: number;
  onOpenSettings: () => void;
}

export default function Header({
  onOpenCommandPalette,
  onToggleTheme,
  theme,
  onOpenNotifications,
  unreadCount = 2,
  onOpenSettings,
}: HeaderProps) {
  const username = localStorage.getItem('user_name') || 'Journaler';

  return (
    <header className="glass-panel mx-4 mt-4 mb-0 py-[0.85rem] px-6 flex flex-wrap items-center justify-between gap-3 z-10">
      {/* Search Bar / Raycast Command Palette Launcher */}
      <button
        onClick={onOpenCommandPalette}
        className="flex items-center gap-3 bg-white/5 border border-white/10 py-2 px-4 rounded-xl text-[var(--text-secondary,#94a3b8)] text-[0.9rem] cursor-pointer w-full sm:w-[320px] max-w-full transition-all duration-200"
      >
        <Search size={16} color="var(--accent-indigo, #6366f1)" />
        <span className="flex-1 text-left">Search commands, actions...</span>
        <span className="flex items-center gap-[0.2rem] text-[0.7rem] bg-white/10 py-[0.15rem] px-[0.45rem] rounded-md text-[var(--text-primary)] font-semibold">
          <Command size={10} /> K
        </span>
      </button>

      {/* Right Controls Suite */}
      <div className="flex items-center gap-[0.85rem]">
        {/* 10-Min Active Session Security Badge - text label hidden below sm: to avoid clipping */}
        <div className="flex items-center gap-[0.4rem] bg-[rgba(99,102,241,0.12)] border border-[rgba(99,102,241,0.25)] py-[0.4rem] px-3 rounded-xl text-xs text-[#38bdf8] font-semibold">
          <ShieldCheck size={14} color="#38bdf8" />
          <span className="hidden sm:inline">10-Min Session Active</span>
        </div>

        {/* Notifications Drawer Button */}
        <button
          onClick={onOpenNotifications}
          aria-label="Notifications"
          className="relative bg-white/5 border border-white/10 p-2 rounded-xl text-[var(--text-primary)] cursor-pointer flex items-center justify-center"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[0.65rem] font-bold flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Theme Toggle Button */}
        <button
          onClick={onToggleTheme}
          className="bg-white/5 border border-white/10 p-2 rounded-xl text-[var(--text-primary)] cursor-pointer flex items-center justify-center"
          title="Toggle Dark / Light Theme"
        >
          {theme === 'light' ? <Moon size={18} color="#6366f1" /> : <Sun size={18} color="#f59e0b" />}
        </button>

        {/* User Profile Pill */}
        <div
          onClick={onOpenSettings}
          className="flex items-center gap-[0.6rem] bg-white/5 border border-white/10 py-[0.35rem] pr-3 pl-[0.4rem] rounded-2xl cursor-pointer transition-all duration-200"
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-[0.85rem]"
            style={{
              background: 'linear-gradient(135deg, var(--accent-indigo, #6366f1), var(--accent-purple, #a855f7))',
            }}
          >
            {username.charAt(0).toUpperCase()}
          </div>
          <span className="text-[0.85rem] font-semibold text-[var(--text-primary)]">{username}</span>
        </div>
      </div>
    </header>
  );
}
