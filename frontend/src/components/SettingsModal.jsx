import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, ShieldCheck, Palette, Server, Download, Key, Lock } from 'lucide-react';
import ThemeCustomizer from './ThemeCustomizer';

export default function SettingsModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('profile');
  const username = localStorage.getItem('user_name') || 'Journaler';
  const userId = localStorage.getItem('user_id') || '1';

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
            maxWidth: '780px',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 24px 48px rgba(0, 0, 0, 0.5)'
          }}
        >
          {/* Modal Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: '700' }}>Account & System Settings</h2>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}>
              <X size={20} />
            </button>
          </div>

          {/* Modal Body: Sidebar Tabs + Main View */}
          <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
            {/* Inner Settings Sidebar */}
            <div style={{ width: '220px', borderRight: '1px solid rgba(255,255,255,0.08)', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <SettingsTabBtn icon={<User size={16} />} label="Profile & User" active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
              <SettingsTabBtn icon={<ShieldCheck size={16} />} label="Security & Sessions" active={activeTab === 'security'} onClick={() => setActiveTab('security')} />
              <SettingsTabBtn icon={<Palette size={16} />} label="Appearance & Themes" active={activeTab === 'appearance'} onClick={() => setActiveTab('appearance')} />
              <SettingsTabBtn icon={<Server size={16} />} label="Connected Services" active={activeTab === 'services'} onClick={() => setActiveTab('services')} />
            </div>

            {/* Inner Tab Content */}
            <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>
              {activeTab === 'profile' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>User Profile</h3>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '0.35rem' }}>Username</label>
                    <input type="text" className="glass-input" defaultValue={username} readOnly />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '0.35rem' }}>User ID</label>
                    <input type="text" className="glass-input" defaultValue={userId} readOnly />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '0.35rem' }}>Primary Email</label>
                    <input type="email" className="glass-input" defaultValue="user@journaler.ai" readOnly />
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Security & Sessions</h3>
                  <div style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.25)', padding: '1rem', borderRadius: '12px' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#38bdf8', marginBottom: '0.2rem' }}>10-Minute Active Session Enforced</div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Session tokens are signed with JWT and automatically expire after 10 minutes of inactivity.</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>Two-Factor Authentication (2FA)</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Add an extra layer of security using TOTP apps.</div>
                    </div>
                    <span style={{ fontSize: '0.75rem', background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: '700' }}>Enabled</span>
                  </div>
                </div>
              )}

              {activeTab === 'appearance' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Appearance & Theme Palettes</h3>
                  <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Choose your preferred color accent palette for glassmorphism panels.</p>
                  <ThemeCustomizer />
                </div>
              )}

              {activeTab === 'services' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Microservices Status</h3>
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

function SettingsTabBtn({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.65rem',
        padding: '0.65rem 0.85rem',
        borderRadius: '10px',
        border: 'none',
        background: active ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(168, 85, 247, 0.15))' : 'transparent',
        color: active ? '#ffffff' : '#94a3b8',
        fontSize: '0.85rem',
        fontWeight: active ? '600' : '500',
        cursor: 'pointer',
        textAlign: 'left',
        width: '100%'
      }}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function ServiceRow({ name, port, status }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div>
        <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#f8fafc' }}>{name}</div>
        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Port: :{port}</div>
      </div>
      <span style={{ fontSize: '0.7rem', color: '#4ade80', background: 'rgba(74, 222, 128, 0.15)', padding: '0.2rem 0.55rem', borderRadius: '6px', fontWeight: '700' }}>
        {status}
      </span>
    </div>
  );
}
