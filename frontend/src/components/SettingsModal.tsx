import { useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, ShieldCheck, Palette, Server } from 'lucide-react';
import { cn } from '@/lib/utils';
import ThemeCustomizer from './ThemeCustomizer';

type SettingsTab = 'profile' | 'security' | 'appearance' | 'services';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const username = localStorage.getItem('user_name') || 'Journaler';
  const userId = localStorage.getItem('user_id') || '1';

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/65 backdrop-blur-[8px] z-[9999] flex items-center justify-center p-6"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          className="glass-panel w-full max-w-[780px] max-h-[85vh] flex flex-col overflow-hidden shadow-[0_24px_48px_rgba(0,0,0,0.5)]"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between py-5 px-6 border-b border-b-white/[0.08]">
            <h2 className="text-[1.3rem] font-bold">Account & System Settings</h2>
            <button onClick={onClose} className="bg-transparent border-0 text-[#64748b] cursor-pointer">
              <X size={20} />
            </button>
          </div>

          {/* Modal Body: Sidebar Tabs + Main View */}
          <div className="flex flex-1 overflow-hidden">
            {/* Inner Settings Sidebar */}
            <div className="w-[220px] border-r border-r-white/[0.08] p-4 flex flex-col gap-[0.35rem]">
              <SettingsTabBtn icon={<User size={16} />} label="Profile & User" active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
              <SettingsTabBtn icon={<ShieldCheck size={16} />} label="Security & Sessions" active={activeTab === 'security'} onClick={() => setActiveTab('security')} />
              <SettingsTabBtn icon={<Palette size={16} />} label="Appearance & Themes" active={activeTab === 'appearance'} onClick={() => setActiveTab('appearance')} />
              <SettingsTabBtn icon={<Server size={16} />} label="Connected Services" active={activeTab === 'services'} onClick={() => setActiveTab('services')} />
            </div>

            {/* Inner Tab Content */}
            <div className="flex-1 p-6 overflow-y-auto">
              {activeTab === 'profile' && (
                <div className="flex flex-col gap-5">
                  <h3 className="text-[1.1rem] font-bold">User Profile</h3>
                  <div>
                    <label className="text-[0.8rem] text-[#94a3b8] block mb-[0.35rem]">Username</label>
                    <input type="text" className="glass-input" defaultValue={username} readOnly />
                  </div>
                  <div>
                    <label className="text-[0.8rem] text-[#94a3b8] block mb-[0.35rem]">User ID</label>
                    <input type="text" className="glass-input" defaultValue={userId} readOnly />
                  </div>
                  <div>
                    <label className="text-[0.8rem] text-[#94a3b8] block mb-[0.35rem]">Primary Email</label>
                    <input type="email" className="glass-input" defaultValue="user@journaler.ai" readOnly />
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="flex flex-col gap-5">
                  <h3 className="text-[1.1rem] font-bold">Security & Sessions</h3>
                  <div className="bg-[rgba(99,102,241,0.1)] border border-[rgba(99,102,241,0.25)] p-4 rounded-xl">
                    <div className="text-[0.9rem] font-semibold text-[#38bdf8] mb-[0.2rem]">10-Minute Active Session Enforced</div>
                    <div className="text-[0.8rem] text-[#94a3b8]">
                      Session tokens are signed with JWT and automatically expire after 10 minutes of inactivity.
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-[0.85rem] bg-white/[0.03] rounded-xl">
                    <div>
                      <div className="text-[0.9rem] font-semibold">Two-Factor Authentication (2FA)</div>
                      <div className="text-xs text-[#64748b]">Add an extra layer of security using TOTP apps.</div>
                    </div>
                    <span className="text-xs bg-[rgba(34,197,94,0.15)] text-[#4ade80] py-[0.2rem] px-2 rounded-md font-bold">
                      Enabled
                    </span>
                  </div>
                </div>
              )}

              {activeTab === 'appearance' && (
                <div className="flex flex-col gap-5">
                  <h3 className="text-[1.1rem] font-bold">Appearance & Theme Palettes</h3>
                  <p className="text-[0.85rem] text-[#94a3b8]">
                    Choose your preferred color accent palette for glassmorphism panels.
                  </p>
                  <ThemeCustomizer />
                </div>
              )}

              {activeTab === 'services' && (
                <div className="flex flex-col gap-4">
                  <h3 className="text-[1.1rem] font-bold">Microservices Status</h3>
                  <ServiceRow name="Spring Cloud API Gateway" port="8080" status="Online" />
                  <ServiceRow name="Python Flask AI Engine" port="5000" status="Online (96% Accuracy)" />
                  <ServiceRow name="Journal Microservice" port="8083" status="Online" />
                  <ServiceRow name="Elasticsearch Search Service" port="8085 / 9200" status="Online" />
                  <ServiceRow name="RabbitMQ Event Bus" port="5672" status="Online" />
                  <ServiceRow name="MySQL Relational DB" port="3307" status="Online" />
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

interface SettingsTabBtnProps {
  icon: ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}

function SettingsTabBtn({ icon, label, active, onClick }: SettingsTabBtnProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-[0.65rem] py-[0.65rem] px-[0.85rem] rounded-[10px] border-0 text-[0.85rem] cursor-pointer text-left w-full',
        active
          ? 'bg-[linear-gradient(135deg,rgba(99,102,241,0.25),rgba(168,85,247,0.15))] text-white font-semibold'
          : 'bg-transparent text-[#94a3b8] font-medium'
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

interface ServiceRowProps {
  name: string;
  port: string;
  status: string;
}

function ServiceRow({ name, port, status }: ServiceRowProps) {
  return (
    <div className="flex items-center justify-between py-3 px-4 bg-white/[0.03] rounded-xl border border-white/[0.06]">
      <div>
        <div className="text-[0.85rem] font-semibold text-[#f8fafc]">{name}</div>
        <div className="text-xs text-[#64748b]">Port: :{port}</div>
      </div>
      <span className="text-[0.7rem] text-[#4ade80] bg-[rgba(74,222,128,0.15)] py-[0.2rem] px-[0.55rem] rounded-md font-bold">
        {status}
      </span>
    </div>
  );
}
