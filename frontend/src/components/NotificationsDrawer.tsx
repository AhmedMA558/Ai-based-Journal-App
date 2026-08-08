import type { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Sparkles, Flame, CheckCircle, X, ShieldCheck } from 'lucide-react';

interface NotificationItem {
  id: number;
  title: string;
  message: string;
  time: string;
  type: string;
  icon: ReactNode;
}

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications?: NotificationItem[];
  onMarkAllRead?: () => void;
}

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 1,
    title: 'AI Daily Wellness Suggestion',
    message: 'Take 5 deep breaths and write down 3 things you are grateful for today.',
    time: '10m ago',
    type: 'ai',
    icon: <Sparkles size={16} color="#c084fc" />,
  },
  {
    id: 2,
    title: '3-Day Journaling Streak Unlocked! 🔥',
    message: 'Awesome consistency! You have logged entries for 3 consecutive days.',
    time: '2h ago',
    type: 'streak',
    icon: <Flame size={16} color="#fde047" />,
  },
  {
    id: 3,
    title: 'Session Security Active',
    message: 'Your 10-minute active session is active and verified.',
    time: '1h ago',
    type: 'security',
    icon: <ShieldCheck size={16} color="#38bdf8" />,
  },
];

export default function NotificationsDrawer({
  isOpen,
  onClose,
  notifications = [],
  onMarkAllRead,
}: NotificationsDrawerProps) {
  if (!isOpen) return null;

  const displayList = notifications.length > 0 ? notifications : DEFAULT_NOTIFICATIONS;

  return (
    <AnimatePresence>
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-[4px] z-[9998] flex justify-end"
      >
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          onClick={(e) => e.stopPropagation()}
          className="glass-panel w-full max-w-[380px] h-screen rounded-none p-6 flex flex-col gap-5 shadow-[-12px_0_32px_rgba(0,0,0,0.4)] border-l border-l-white/10"
        >
          {/* Drawer Header */}
          <div className="flex items-center justify-between border-b border-b-white/[0.08] pb-4">
            <div className="flex items-center gap-[0.65rem]">
              <Bell size={20} color="var(--accent-indigo, #6366f1)" />
              <h2 className="text-[1.2rem] font-bold">Notifications</h2>
            </div>
            <button onClick={onClose} className="bg-transparent border-0 text-[#64748b] cursor-pointer">
              <X size={20} />
            </button>
          </div>

          {/* Action Bar */}
          <div className="flex justify-end">
            <button
              onClick={onMarkAllRead}
              className="bg-transparent border-0 text-[#818cf8] text-[0.8rem] font-semibold cursor-pointer flex items-center gap-[0.35rem]"
            >
              <CheckCircle size={14} />
              <span>Mark all as read</span>
            </button>
          </div>

          {/* Notifications Feed */}
          <div className="flex-1 overflow-y-auto flex flex-col gap-[0.85rem]">
            {displayList.map((item) => (
              <div
                key={item.id}
                className="bg-white/[0.04] border border-white/[0.08] p-4 rounded-2xl flex gap-3 transition-all duration-200"
              >
                <div className="p-2 rounded-[10px] bg-white/[0.06] h-fit">{item.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-[0.9rem] font-semibold text-[var(--text-primary)]">{item.title}</h4>
                    <span className="text-[0.7rem] text-[#64748b]">{item.time}</span>
                  </div>
                  <p className="text-[0.8rem] text-[var(--text-secondary)] leading-[1.4]">{item.message}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
