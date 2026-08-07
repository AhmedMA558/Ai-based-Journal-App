import React, { useState } from 'react';
import { Sparkles, Lock, Mail, User, ArrowRight, ShieldCheck, Cookie } from 'lucide-react';
import { authService } from '../services/authService';

export default function AuthView({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    fullName: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await authService.login(formData.username, formData.password);
      } else {
        await authService.register(formData.username, formData.email, formData.password, formData.fullName);
      }
      onLoginSuccess();
    } catch (err) {
      console.error('Auth Exception:', err);
      setError(err?.message || err?.error || 'Authentication failed. Please check credentials or gateway status.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Glow Spheres */}
      <div style={{ position: 'absolute', top: '15%', left: '20%', width: '350px', height: '350px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.15)', filter: 'blur(90px)', pointerEvents: 'none' }}></div>
      <div style={{ position: 'absolute', bottom: '15%', right: '20%', width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(168, 85, 247, 0.15)', filter: 'blur(100px)', pointerEvents: 'none' }}></div>

      <div className="glass-panel glass-panel-glow animate-fade-in" style={{ width: '100%', maxWidth: '460px', padding: '2.5rem' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', padding: '0.75rem', borderRadius: '16px', background: 'linear-gradient(135deg, #6366f1, #a855f7)', boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)', marginBottom: '1rem' }}>
            <Sparkles size={32} color="#ffffff" />
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.5rem' }}>
            {isLogin ? 'Welcome Back to AURA' : 'Create Your AURA Account'}
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
            {isLogin ? 'Sign in to access your AI-powered journals & insights' : 'Join the next-generation intelligent journaling platform'}
          </p>
        </div>

        {/* Cookie Security Indicator */}
        <div style={{
          background: 'rgba(6, 182, 212, 0.1)',
          border: '1px solid rgba(6, 182, 212, 0.25)',
          borderRadius: '12px',
          padding: '0.65rem 0.85rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          fontSize: '0.8rem',
          color: '#38bdf8'
        }}>
          <Cookie size={18} />
          <span>JWT Access Tokens stored in <strong>Browser Cookies</strong> (1-Hour Expiration).</span>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171',
            padding: '0.75rem 1rem',
            borderRadius: '12px',
            marginBottom: '1.5rem',
            fontSize: '0.85rem',
            lineHeight: '1.4'
          }}>
            {error}
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          {!isLogin && (
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: '500' }}>Full Name</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  required
                  className="glass-input"
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  style={{ paddingLeft: '2.6rem' }}
                />
                <User size={18} color="#64748b" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: '500' }}>
              {isLogin ? 'Username or Email' : 'Username'}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                required
                className="glass-input"
                placeholder={isLogin ? "alex_dev or alex@example.com" : "alex_dev"}
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                style={{ paddingLeft: '2.6rem' }}
              />
              <User size={18} color="#64748b" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          {!isLogin && (
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: '500' }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  required
                  className="glass-input"
                  placeholder="alex@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  style={{ paddingLeft: '2.6rem' }}
                />
                <Mail size={18} color="#64748b" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: '500' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                required
                className="glass-input"
                placeholder="••••••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                style={{ paddingLeft: '2.6rem' }}
              />
              <Lock size={18} color="#64748b" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', marginTop: '0.5rem', padding: '0.85rem' }}>
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Tab Toggle Footer */}
        <div style={{ textAlign: 'center', marginTop: '1.5rem', paddingTop: '1.2rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <button
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.9rem' }}
          >
            {isLogin ? (
              <span>Don't have an account? <strong style={{ color: '#6366f1' }}>Sign Up</strong></span>
            ) : (
              <span>Already have an account? <strong style={{ color: '#6366f1' }}>Sign In</strong></span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
