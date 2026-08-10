import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, ShieldCheck, Palette, Server, AlertCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { cn } from '@/lib/utils';
import { authService } from '@/services/authService';
import { userService } from '@/services/userService';
import ThemeCustomizer from './ThemeCustomizer';

type SettingsTab = 'profile' | 'security' | 'appearance' | 'services';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CurrentUser {
  username?: string;
  email?: string;
  fullName?: string;
}

interface ProfileData {
  bio?: string;
  avatarUrl?: string;
  phoneNumber?: string;
  country?: string;
  city?: string;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

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
          <div className="flex flex-col sm:flex-row flex-1 overflow-hidden">
            {/* Inner Settings Sidebar - horizontal scrollable tab row on mobile, vertical list from sm: up */}
            <div className="w-full sm:w-[220px] shrink-0 border-b sm:border-b-0 sm:border-r border-white/[0.08] p-4 flex flex-row sm:flex-col gap-[0.35rem] overflow-x-auto sm:overflow-x-visible">
              <SettingsTabBtn icon={<User size={16} />} label="Profile & User" active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
              <SettingsTabBtn icon={<ShieldCheck size={16} />} label="Security & Sessions" active={activeTab === 'security'} onClick={() => setActiveTab('security')} />
              <SettingsTabBtn icon={<Palette size={16} />} label="Appearance & Themes" active={activeTab === 'appearance'} onClick={() => setActiveTab('appearance')} />
              <SettingsTabBtn icon={<Server size={16} />} label="Connected Services" active={activeTab === 'services'} onClick={() => setActiveTab('services')} />
            </div>

            {/* Inner Tab Content */}
            <div className="flex-1 p-6 overflow-y-auto">
              {activeTab === 'profile' && <ProfileTab isOpen={isOpen} />}
              {activeTab === 'security' && <SecurityTab isOpen={isOpen} />}

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

function ProfileTab({ isOpen }: { isOpen: boolean }) {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [profile, setProfile] = useState<ProfileData>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setLoading(true);
    setLoadError('');
    Promise.all([authService.getCurrentUser(), userService.getProfile()])
      .then(([user, profileData]) => {
        if (cancelled) return;
        setCurrentUser(user || null);
        setProfile(profileData || {});
      })
      .catch(() => {
        if (!cancelled) setLoadError('Failed to load profile. Please try reopening Settings.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const updated = await userService.updateProfile(profile);
      setProfile(updated || profile);
      setMessage('Profile saved.');
    } catch (err: any) {
      setMessage(err?.message || 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-5">
        <div className="skeleton-pulse h-6 w-40 rounded-lg" />
        <div className="skeleton-pulse h-10 rounded-lg" />
        <div className="skeleton-pulse h-10 rounded-lg" />
        <div className="skeleton-pulse h-20 rounded-lg" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="bg-[rgba(239,68,68,0.15)] border border-[rgba(239,68,68,0.3)] text-[#f87171] py-3 px-4 rounded-xl flex items-center gap-2">
        <AlertCircle size={18} />
        <span>{loadError}</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-5">
      <h3 className="text-[1.1rem] font-bold">User Profile</h3>

      <div>
        <label className="text-[0.8rem] text-[#94a3b8] block mb-[0.35rem]">Username</label>
        <input type="text" className="glass-input" value={currentUser?.username || ''} readOnly />
      </div>
      <div>
        <label className="text-[0.8rem] text-[#94a3b8] block mb-[0.35rem]">Primary Email</label>
        <input type="email" className="glass-input" value={currentUser?.email || ''} readOnly />
      </div>
      <div>
        <label className="text-[0.8rem] text-[#94a3b8] block mb-[0.35rem]">Bio</label>
        <textarea
          className="glass-input"
          rows={3}
          value={profile.bio || ''}
          onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-[0.8rem] text-[#94a3b8] block mb-[0.35rem]">Phone Number</label>
          <input
            type="text"
            className="glass-input"
            value={profile.phoneNumber || ''}
            onChange={(e) => setProfile({ ...profile, phoneNumber: e.target.value })}
          />
        </div>
        <div>
          <label className="text-[0.8rem] text-[#94a3b8] block mb-[0.35rem]">Country</label>
          <input
            type="text"
            className="glass-input"
            value={profile.country || ''}
            onChange={(e) => setProfile({ ...profile, country: e.target.value })}
          />
        </div>
      </div>
      <div>
        <label className="text-[0.8rem] text-[#94a3b8] block mb-[0.35rem]">City</label>
        <input
          type="text"
          className="glass-input"
          value={profile.city || ''}
          onChange={(e) => setProfile({ ...profile, city: e.target.value })}
        />
      </div>

      {message && <p className="text-[0.8rem] text-[#94a3b8]">{message}</p>}

      <button type="submit" disabled={saving} className="btn-primary self-start px-6">
        {saving ? 'Saving...' : 'Save Profile'}
      </button>
    </form>
  );
}

function SecurityTab({ isOpen }: { isOpen: boolean }) {
  const [mfaEnabled, setMfaEnabled] = useState<boolean | null>(null);
  const [mfaLoadError, setMfaLoadError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setMfaLoadError('');
    authService
      .getMfaStatus()
      .then((status) => {
        if (!cancelled) setMfaEnabled(Boolean(status?.mfaEnabled));
      })
      .catch(() => {
        if (!cancelled) setMfaLoadError('Could not load 2FA status. Please try reopening Settings.');
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  return (
    <div className="flex flex-col gap-5">
      <h3 className="text-[1.1rem] font-bold">Security & Sessions</h3>
      <div className="bg-[rgba(99,102,241,0.1)] border border-[rgba(99,102,241,0.25)] p-4 rounded-xl">
        <div className="text-[0.9rem] font-semibold text-[#38bdf8] mb-[0.2rem]">10-Minute Active Session Enforced</div>
        <div className="text-[0.8rem] text-[#94a3b8]">
          Session tokens are signed with JWT and automatically expire after 10 minutes of inactivity.
        </div>
      </div>

      <PasswordChangeSection />

      {mfaLoadError ? (
        <div className="bg-[rgba(239,68,68,0.15)] border border-[rgba(239,68,68,0.3)] text-[#f87171] py-3 px-4 rounded-xl flex items-center gap-2">
          <AlertCircle size={18} />
          <span>{mfaLoadError}</span>
        </div>
      ) : mfaEnabled === null ? (
        <div className="skeleton-pulse h-16 rounded-xl" />
      ) : (
        <TwoFactorSection mfaEnabled={mfaEnabled} onStatusChange={setMfaEnabled} />
      )}
    </div>
  );
}

function PasswordChangeSection() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage('');
    if (newPassword !== confirmNewPassword) {
      setMessage('New passwords do not match.');
      return;
    }
    setSaving(true);
    try {
      await authService.changePassword(currentPassword, newPassword);
      setMessage('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      setMessage(err?.message || 'Failed to change password.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-[0.85rem] bg-white/[0.03] rounded-xl">
      <div className="text-[0.9rem] font-semibold">Change Password</div>
      <input
        type="password"
        required
        className="glass-input"
        placeholder="Current password"
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
      />
      <input
        type="password"
        required
        minLength={6}
        className="glass-input"
        placeholder="New password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
      />
      <input
        type="password"
        required
        className="glass-input"
        placeholder="Confirm new password"
        value={confirmNewPassword}
        onChange={(e) => setConfirmNewPassword(e.target.value)}
      />
      {message && <p className="text-[0.8rem] text-[#94a3b8]">{message}</p>}
      <button type="submit" disabled={saving} className="btn-secondary self-start px-5 text-[0.85rem]">
        {saving ? 'Updating...' : 'Update Password'}
      </button>
    </form>
  );
}

interface TwoFactorSectionProps {
  mfaEnabled: boolean;
  onStatusChange: (enabled: boolean) => void;
}

function TwoFactorSection({ mfaEnabled, onStatusChange }: TwoFactorSectionProps) {
  const [enrollStep, setEnrollStep] = useState<'idle' | 'setup' | 'recovery-codes'>('idle');
  const [setupData, setSetupData] = useState<{ secret: string; otpAuthUri: string } | null>(null);
  const [enrollCode, setEnrollCode] = useState('');
  const [enrollError, setEnrollError] = useState('');
  const [enrollSaving, setEnrollSaving] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [codesAcknowledged, setCodesAcknowledged] = useState(false);

  const [showDisableForm, setShowDisableForm] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [disableError, setDisableError] = useState('');
  const [disableSaving, setDisableSaving] = useState(false);

  const startSetup = async () => {
    setEnrollError('');
    try {
      const data = await authService.setupMfa();
      setSetupData(data);
      setEnrollStep('setup');
    } catch (err: any) {
      setEnrollError(err?.message || 'Failed to start 2FA setup.');
    }
  };

  const confirmEnable = async (e: FormEvent) => {
    e.preventDefault();
    setEnrollError('');
    setEnrollSaving(true);
    try {
      const result = await authService.enableMfa(enrollCode);
      setRecoveryCodes(result?.recoveryCodes || []);
      setEnrollStep('recovery-codes');
    } catch (err: any) {
      setEnrollError(err?.message || 'Invalid code. Please try again.');
    } finally {
      setEnrollSaving(false);
    }
  };

  const finishEnrollment = () => {
    onStatusChange(true);
    setEnrollStep('idle');
    setSetupData(null);
    setEnrollCode('');
    setRecoveryCodes([]);
    setCodesAcknowledged(false);
  };

  const handleDisable = async (e: FormEvent) => {
    e.preventDefault();
    setDisableError('');
    setDisableSaving(true);
    try {
      await authService.disableMfa(disablePassword, disableCode);
      onStatusChange(false);
      setShowDisableForm(false);
      setDisablePassword('');
      setDisableCode('');
    } catch (err: any) {
      setDisableError(err?.message || 'Failed to disable 2FA.');
    } finally {
      setDisableSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 p-[0.85rem] bg-white/[0.03] rounded-xl">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[0.9rem] font-semibold">Two-Factor Authentication (2FA)</div>
          <div className="text-xs text-[#64748b]">Add an extra layer of security using TOTP apps.</div>
        </div>
        <span
          className={cn(
            'text-xs py-[0.2rem] px-2 rounded-md font-bold',
            mfaEnabled ? 'bg-[rgba(34,197,94,0.15)] text-[#4ade80]' : 'bg-[rgba(148,163,184,0.15)] text-[#94a3b8]'
          )}
        >
          {mfaEnabled ? 'Enabled' : 'Disabled'}
        </span>
      </div>

      {!mfaEnabled && enrollStep === 'idle' && (
        <button type="button" onClick={startSetup} className="btn-primary self-start px-5 text-[0.85rem]">
          Set Up 2FA
        </button>
      )}

      {enrollStep === 'setup' && setupData && (
        <div className="flex flex-col gap-3">
          <p className="text-[0.8rem] text-[#94a3b8]">Scan this QR code with your authenticator app:</p>
          <div className="bg-white p-3 rounded-xl self-start">
            <QRCodeSVG value={setupData.otpAuthUri} size={160} />
          </div>
          <p className="text-[0.75rem] text-[#64748b]">
            Or enter this code manually: <code className="text-[#c084fc]">{setupData.secret}</code>
          </p>
          <form onSubmit={confirmEnable} className="flex flex-col gap-2">
            <input
              type="text"
              required
              autoFocus
              className="glass-input"
              placeholder="Enter the 6-digit code to confirm"
              value={enrollCode}
              onChange={(e) => setEnrollCode(e.target.value)}
            />
            {enrollError && <p className="text-[0.8rem] text-[#f87171]">{enrollError}</p>}
            <button type="submit" disabled={enrollSaving} className="btn-primary self-start px-5 text-[0.85rem]">
              {enrollSaving ? 'Confirming...' : 'Confirm & Enable'}
            </button>
          </form>
        </div>
      )}

      {enrollStep === 'recovery-codes' && (
        <div className="flex flex-col gap-3">
          <p className="text-[0.85rem] font-semibold text-[#fde047]">
            Save these recovery codes now - they won't be shown again.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-black/30 p-3 rounded-xl font-mono text-[0.8rem]">
            {recoveryCodes.map((code) => (
              <span key={code}>{code}</span>
            ))}
          </div>
          <label className="flex items-center gap-2 text-[0.8rem] text-[#94a3b8]">
            <input
              type="checkbox"
              checked={codesAcknowledged}
              onChange={(e) => setCodesAcknowledged(e.target.checked)}
            />
            I've saved these recovery codes
          </label>
          <button
            type="button"
            disabled={!codesAcknowledged}
            onClick={finishEnrollment}
            className="btn-primary self-start px-5 text-[0.85rem]"
          >
            Done
          </button>
        </div>
      )}

      {mfaEnabled && !showDisableForm && (
        <button
          type="button"
          onClick={() => setShowDisableForm(true)}
          className="btn-secondary self-start px-5 text-[0.85rem]"
        >
          Disable 2FA
        </button>
      )}

      {mfaEnabled && showDisableForm && (
        <form onSubmit={handleDisable} className="flex flex-col gap-2">
          <input
            type="password"
            required
            className="glass-input"
            placeholder="Current password"
            value={disablePassword}
            onChange={(e) => setDisablePassword(e.target.value)}
          />
          <input
            type="text"
            required
            className="glass-input"
            placeholder="6-digit authenticator code"
            value={disableCode}
            onChange={(e) => setDisableCode(e.target.value)}
          />
          {disableError && <p className="text-[0.8rem] text-[#f87171]">{disableError}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={disableSaving} className="btn-secondary px-5 text-[0.85rem]">
              {disableSaving ? 'Disabling...' : 'Confirm Disable'}
            </button>
            <button type="button" onClick={() => setShowDisableForm(false)} className="btn-secondary px-5 text-[0.85rem]">
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
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
        'flex items-center gap-[0.65rem] py-[0.65rem] px-[0.85rem] rounded-[10px] border-0 text-[0.85rem] cursor-pointer text-left shrink-0 sm:w-full sm:shrink whitespace-nowrap',
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
