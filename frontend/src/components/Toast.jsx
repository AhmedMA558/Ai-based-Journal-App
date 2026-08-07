import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const icons = {
    success: <CheckCircle2 size={18} color="#4ade80" />,
    error: <AlertCircle size={18} color="#f87171" />,
    info: <Info size={18} color="#38bdf8" />
  };

  const borders = {
    success: 'rgba(34, 197, 94, 0.4)',
    error: 'rgba(239, 68, 68, 0.4)',
    info: 'rgba(56, 189, 248, 0.4)'
  };

  return (
    <div
      className="glass-panel animate-fade-in"
      style={{
        position: 'fixed',
        bottom: '2rem',
        right: '2rem',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.85rem 1.25rem',
        borderRadius: '14px',
        borderColor: borders[toast.type] || 'rgba(255,255,255,0.1)',
        background: 'rgba(16, 20, 38, 0.95)',
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
        minWidth: '280px'
      }}
    >
      {icons[toast.type] || <Info size={18} color="#38bdf8" />}
      <span style={{ fontSize: '0.9rem', color: '#f8fafc', fontWeight: '500', flex: 1 }}>
        {toast.message}
      </span>
      <button
        onClick={onClose}
        style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
      >
        <X size={16} />
      </button>
    </div>
  );
}
