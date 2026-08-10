import { useState, type FormEvent } from 'react';
import { Sparkles, Lock, Mail, User, ArrowRight, ShieldCheck, KeyRound } from 'lucide-react';
import { authService } from '@/services/authService';

interface AuthViewProps {
  onLoginSuccess: () => void;
}

interface AuthFormData {
  username: string;
  email: string;
  password: string;
  fullName: string;
}

type AuthStep = 'credentials' | 'mfa-challenge';

const LABEL_CLASS = 'block text-[0.85rem] text-[#cbd5e1] mb-[0.4rem] font-medium';
const ICON_CLASS = 'absolute left-[0.85rem] top-1/2 -translate-y-1/2';

export default function AuthView({ onLoginSuccess }: AuthViewProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState<AuthFormData>({
    username: '',
    email: '',
    password: '',
    fullName: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [authStep, setAuthStep] = useState<AuthStep>('credentials');
  const [challengeToken, setChallengeToken] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [useRecoveryCode, setUseRecoveryCode] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = isLogin
        ? await authService.login(formData.username, formData.password)
        : await authService.register(formData.username, formData.email, formData.password, formData.fullName);

      const data = res?.data?.data;
      if (data?.mfaRequired) {
        setChallengeToken(data.challengeToken);
        setAuthStep('mfa-challenge');
        return;
      }

      onLoginSuccess();
    } catch (err: any) {
      console.error('Auth Exception:', err);
      setError(err?.message || err?.error || 'Authentication failed. Please check credentials or gateway status.');
    } finally {
      setLoading(false);
    }
  };

  const handleMfaSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authService.verifyMfa(
        challengeToken,
        useRecoveryCode ? undefined : mfaCode,
        useRecoveryCode ? mfaCode : undefined
      );
      onLoginSuccess();
    } catch (err: any) {
      console.error('MFA Verification Exception:', err);
      setError(err?.message || err?.error || 'Verification failed. Check the code and try again.');
    } finally {
      setLoading(false);
    }
  };

  const backToCredentials = () => {
    setAuthStep('credentials');
    setChallengeToken('');
    setMfaCode('');
    setUseRecoveryCode(false);
    setError('');
  };

  if (authStep === 'mfa-challenge') {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 relative overflow-hidden">
        <div className="absolute top-[15%] left-[20%] w-[350px] h-[350px] rounded-full bg-[rgba(99,102,241,0.15)] blur-[90px] pointer-events-none" />
        <div className="absolute bottom-[15%] right-[20%] w-[400px] h-[400px] rounded-full bg-[rgba(168,85,247,0.15)] blur-[100px] pointer-events-none" />

        <div className="glass-panel glass-panel-glow animate-fade-in w-full max-w-[460px] p-10">
          <div className="text-center mb-8">
            <div className="inline-flex p-3 rounded-2xl bg-[linear-gradient(135deg,#6366f1,#a855f7)] shadow-[0_8px_24px_rgba(99,102,241,0.4)] mb-4">
              <ShieldCheck size={32} color="#ffffff" />
            </div>
            <h1 className="text-[2rem] font-extrabold mb-2">Two-Factor Verification</h1>
            <p className="text-[#94a3b8] text-[0.9rem]">
              {useRecoveryCode
                ? 'Enter one of your saved recovery codes'
                : 'Enter the 6-digit code from your authenticator app'}
            </p>
          </div>

          {error && (
            <div className="bg-[rgba(239,68,68,0.15)] border border-[rgba(239,68,68,0.3)] text-[#f87171] py-3 px-4 rounded-xl mb-6 text-[0.85rem] leading-[1.4]">
              {error}
            </div>
          )}

          <form onSubmit={handleMfaSubmit} className="flex flex-col gap-[1.2rem]">
            <div>
              <label className={LABEL_CLASS}>{useRecoveryCode ? 'Recovery Code' : 'Authenticator Code'}</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  autoFocus
                  className="glass-input pl-[2.6rem]"
                  placeholder={useRecoveryCode ? 'XXXXX-XXXXX' : '123456'}
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                />
                <KeyRound size={18} color="#64748b" className={ICON_CLASS} />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2 p-[0.85rem]">
              {loading ? (
                <span>Verifying...</span>
              ) : (
                <>
                  <span>Verify</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="text-center mt-6 pt-[1.2rem] border-t border-t-white/[0.08] flex flex-col gap-2">
            <button
              onClick={() => {
                setUseRecoveryCode(!useRecoveryCode);
                setMfaCode('');
                setError('');
              }}
              className="bg-transparent border-0 text-[#94a3b8] cursor-pointer text-[0.9rem]"
            >
              {useRecoveryCode ? 'Use an authenticator code instead' : 'Use a recovery code instead'}
            </button>
            <button onClick={backToCredentials} className="bg-transparent border-0 text-[#64748b] cursor-pointer text-[0.85rem]">
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8 relative overflow-hidden">
      {/* Background Glow Spheres */}
      <div className="absolute top-[15%] left-[20%] w-[350px] h-[350px] rounded-full bg-[rgba(99,102,241,0.15)] blur-[90px] pointer-events-none" />
      <div className="absolute bottom-[15%] right-[20%] w-[400px] h-[400px] rounded-full bg-[rgba(168,85,247,0.15)] blur-[100px] pointer-events-none" />

      <div className="glass-panel glass-panel-glow animate-fade-in w-full max-w-[460px] p-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-2xl bg-[linear-gradient(135deg,#6366f1,#a855f7)] shadow-[0_8px_24px_rgba(99,102,241,0.4)] mb-4">
            <Sparkles size={32} color="#ffffff" />
          </div>
          <h1 className="text-[2rem] font-extrabold mb-2">
            {isLogin ? 'Welcome Back to AURA' : 'Create Your AURA Account'}
          </h1>
          <p className="text-[#94a3b8] text-[0.9rem]">
            {isLogin ? 'Sign in to access your AI-powered journals & insights' : 'Join the next-generation intelligent journaling platform'}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-[rgba(239,68,68,0.15)] border border-[rgba(239,68,68,0.3)] text-[#f87171] py-3 px-4 rounded-xl mb-6 text-[0.85rem] leading-[1.4]">
            {error}
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-[1.2rem]">
          {!isLogin && (
            <div>
              <label className={LABEL_CLASS}>Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  className="glass-input pl-[2.6rem]"
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                />
                <User size={18} color="#64748b" className={ICON_CLASS} />
              </div>
            </div>
          )}

          <div>
            <label className={LABEL_CLASS}>{isLogin ? 'Username or Email' : 'Username'}</label>
            <div className="relative">
              <input
                type="text"
                required
                className="glass-input pl-[2.6rem]"
                placeholder={isLogin ? 'alex_dev or alex@example.com' : 'alex_dev'}
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
              <User size={18} color="#64748b" className={ICON_CLASS} />
            </div>
          </div>

          {!isLogin && (
            <div>
              <label className={LABEL_CLASS}>Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  className="glass-input pl-[2.6rem]"
                  placeholder="alex@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                <Mail size={18} color="#64748b" className={ICON_CLASS} />
              </div>
            </div>
          )}

          <div>
            <label className={LABEL_CLASS}>Password</label>
            <div className="relative">
              <input
                type="password"
                required
                className="glass-input pl-[2.6rem]"
                placeholder="••••••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
              <Lock size={18} color="#64748b" className={ICON_CLASS} />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full mt-2 p-[0.85rem]">
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
        <div className="text-center mt-6 pt-[1.2rem] border-t border-t-white/[0.08]">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="bg-transparent border-0 text-[#94a3b8] cursor-pointer text-[0.9rem]"
          >
            {isLogin ? (
              <span>
                Don't have an account? <strong className="text-[#6366f1]">Sign Up</strong>
              </span>
            ) : (
              <span>
                Already have an account? <strong className="text-[#6366f1]">Sign In</strong>
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
