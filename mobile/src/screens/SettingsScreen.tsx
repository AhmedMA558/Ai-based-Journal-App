import { useEffect, useState, type ReactNode } from 'react';
import { View, Text, Pressable, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import { User, ShieldCheck, CheckCircle2 } from 'lucide-react-native';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { GlassInput } from '@/components/ui/GlassInput';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SkeletonBlock } from '@/components/ui/SkeletonBlock';
import { ErrorBanner } from '@/components/ErrorBanner';
import { FadeInView } from '@/components/ui/FadeInView';
import { cn } from '@/lib/utils';
import { authService, userService } from '@/services';
import type { CurrentUser, ProfileData, MfaSetupData } from '@/types';

type SettingsTab = 'profile' | 'security';

export default function SettingsScreen() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  return (
    <SafeAreaView className="flex-1 bg-bg-primary" edges={['top']}>
      <View className="px-5 pt-4 pb-2">
        <Text className="text-text-primary text-2xl font-extrabold">Settings</Text>
        <Text className="text-text-secondary text-xs">Profile, password, and two-factor authentication</Text>
      </View>

      <View className="flex-row px-5 mb-4 gap-2">
        <SettingsTabBtn icon={<User size={15} color={activeTab === 'profile' ? '#fff' : '#94a3b8'} />} label="Profile" active={activeTab === 'profile'} onPress={() => setActiveTab('profile')} />
        <SettingsTabBtn icon={<ShieldCheck size={15} color={activeTab === 'security' ? '#fff' : '#94a3b8'} />} label="Security" active={activeTab === 'security'} onPress={() => setActiveTab('security')} />
      </View>

      {activeTab === 'profile' ? <ProfileSection /> : <SecuritySection />}
    </SafeAreaView>
  );
}

function SettingsTabBtn({ icon, label, active, onPress }: { icon: ReactNode; label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className={cn('flex-row items-center gap-2 py-2 px-4 rounded-xl', active ? 'bg-accent-indigo/25 border border-accent-indigo' : 'bg-white/[0.04] border border-white/[0.08]')}
    >
      {icon}
      <Text className={cn('text-sm', active ? 'text-white font-bold' : 'text-text-secondary font-medium')}>{label}</Text>
    </Pressable>
  );
}

function ProfileSection() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [profile, setProfile] = useState<ProfileData>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
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
  }, []);

  const handleSave = async () => {
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

  if (loadError) {
    return (
      <View className="px-5">
        <ErrorBanner message={loadError} />
      </View>
    );
  }

  if (loading) {
    return (
      <View className="px-5 gap-3">
        <SkeletonBlock className="h-10" />
        <SkeletonBlock className="h-10" />
        <SkeletonBlock className="h-20" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }} keyboardShouldPersistTaps="handled">
      <FadeInView>
        <View className="gap-4">
          <View>
            <Text className="text-text-secondary text-xs mb-2">Username</Text>
            <GlassInput value={currentUser?.username || ''} editable={false} className="opacity-60" />
          </View>
          <View>
            <Text className="text-text-secondary text-xs mb-2">Primary Email</Text>
            <GlassInput value={currentUser?.email || ''} editable={false} className="opacity-60" />
          </View>
          <View>
            <Text className="text-text-secondary text-xs mb-2">Bio</Text>
            <GlassInput
              value={profile.bio || ''}
              onChangeText={(v) => setProfile((p) => ({ ...p, bio: v }))}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              className="min-h-[80px]"
            />
          </View>
          <View>
            <Text className="text-text-secondary text-xs mb-2">Phone Number</Text>
            <GlassInput value={profile.phoneNumber || ''} onChangeText={(v) => setProfile((p) => ({ ...p, phoneNumber: v }))} />
          </View>
          <View>
            <Text className="text-text-secondary text-xs mb-2">Country</Text>
            <GlassInput value={profile.country || ''} onChangeText={(v) => setProfile((p) => ({ ...p, country: v }))} />
          </View>
          <View>
            <Text className="text-text-secondary text-xs mb-2">City</Text>
            <GlassInput value={profile.city || ''} onChangeText={(v) => setProfile((p) => ({ ...p, city: v }))} />
          </View>

          {message ? <Text className="text-text-secondary text-xs">{message}</Text> : null}

          <PrimaryButton title={saving ? 'Saving...' : 'Save Profile'} onPress={handleSave} loading={saving} />
        </View>
      </FadeInView>
    </ScrollView>
  );
}

function SecuritySection() {
  const [mfaEnabled, setMfaEnabled] = useState<boolean | null>(null);
  const [mfaLoadError, setMfaLoadError] = useState('');

  useEffect(() => {
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
  }, []);

  return (
    <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }} keyboardShouldPersistTaps="handled">
        <FadeInView>
          <View className="gap-4">
            <PasswordChangeSection />

            {mfaLoadError ? (
              <ErrorBanner message={mfaLoadError} />
            ) : mfaEnabled === null ? (
              <SkeletonBlock className="h-16" />
            ) : (
              <TwoFactorSection mfaEnabled={mfaEnabled} onStatusChange={setMfaEnabled} />
            )}
          </View>
        </FadeInView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function PasswordChangeSection() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
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
    <GlassPanel className="p-4 gap-3">
      <Text className="text-text-primary text-sm font-semibold mb-1">Change Password</Text>
      <GlassInput secureTextEntry placeholder="Current password" value={currentPassword} onChangeText={setCurrentPassword} />
      <GlassInput secureTextEntry placeholder="New password" value={newPassword} onChangeText={setNewPassword} />
      <GlassInput secureTextEntry placeholder="Confirm new password" value={confirmNewPassword} onChangeText={setConfirmNewPassword} />
      {message ? <Text className="text-text-secondary text-xs">{message}</Text> : null}
      <Pressable
        onPress={handleSubmit}
        disabled={saving || !currentPassword || !newPassword}
        className="self-start bg-white/10 border border-white/15 rounded-xl py-2 px-4 mt-1"
        style={{ opacity: saving || !currentPassword || !newPassword ? 0.5 : 1 }}
      >
        <Text className="text-text-primary text-sm font-semibold">{saving ? 'Updating...' : 'Update Password'}</Text>
      </Pressable>
    </GlassPanel>
  );
}

function TwoFactorSection({ mfaEnabled, onStatusChange }: { mfaEnabled: boolean; onStatusChange: (v: boolean) => void }) {
  const [enrollStep, setEnrollStep] = useState<'idle' | 'setup' | 'recovery-codes'>('idle');
  const [setupData, setSetupData] = useState<MfaSetupData | null>(null);
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

  const confirmEnable = async () => {
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

  const handleDisable = async () => {
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
    <GlassPanel className="p-4 gap-3">
      <View className="flex-row items-center justify-between">
        <View className="flex-1 pr-2">
          <Text className="text-text-primary text-sm font-semibold">Two-Factor Authentication (2FA)</Text>
          <Text className="text-text-muted text-xs">Add an extra layer of security using TOTP apps.</Text>
        </View>
        <View className={cn('py-1 px-2 rounded-md', mfaEnabled ? 'bg-[rgba(34,197,94,0.15)]' : 'bg-white/10')}>
          <Text className={cn('text-xs font-bold', mfaEnabled ? 'text-[#4ade80]' : 'text-text-secondary')}>
            {mfaEnabled ? 'Enabled' : 'Disabled'}
          </Text>
        </View>
      </View>

      {!mfaEnabled && enrollStep === 'idle' && (
        <Pressable onPress={startSetup} className="self-start bg-accent-indigo/80 rounded-xl py-2 px-4">
          <Text className="text-white text-sm font-semibold">Set Up 2FA</Text>
        </Pressable>
      )}

      {enrollStep === 'setup' && setupData && (
        <View className="gap-3">
          <Text className="text-text-secondary text-xs">Scan this QR code with your authenticator app:</Text>
          <View className="bg-white p-3 rounded-xl self-start">
            <QRCode value={setupData.otpAuthUri} size={150} />
          </View>
          <Text className="text-text-muted text-xs">
            Or enter this code manually: <Text className="text-[#c084fc] font-mono">{setupData.secret}</Text>
          </Text>
          <GlassInput placeholder="Enter the 6-digit code to confirm" value={enrollCode} onChangeText={setEnrollCode} keyboardType="number-pad" />
          {enrollError ? <Text className="text-[#f87171] text-xs">{enrollError}</Text> : null}
          <Pressable
            onPress={confirmEnable}
            disabled={enrollSaving || !enrollCode.trim()}
            className="self-start bg-accent-indigo/80 rounded-xl py-2 px-4"
            style={{ opacity: enrollSaving || !enrollCode.trim() ? 0.5 : 1 }}
          >
            <Text className="text-white text-sm font-semibold">{enrollSaving ? 'Confirming...' : 'Confirm & Enable'}</Text>
          </Pressable>
        </View>
      )}

      {enrollStep === 'recovery-codes' && (
        <View className="gap-3">
          <Text className="text-[#fde047] text-sm font-semibold">Save these recovery codes now - they won't be shown again.</Text>
          <View className="bg-black/30 p-3 rounded-xl flex-row flex-wrap gap-2">
            {recoveryCodes.map((code) => (
              <Text key={code} className="text-text-primary text-xs font-mono w-1/2">
                {code}
              </Text>
            ))}
          </View>
          <Pressable onPress={() => setCodesAcknowledged((v) => !v)} className="flex-row items-center gap-2">
            <View className={cn('w-5 h-5 rounded items-center justify-center border', codesAcknowledged ? 'bg-accent-indigo border-accent-indigo' : 'border-white/20')}>
              {codesAcknowledged ? <CheckCircle2 size={14} color="#fff" /> : null}
            </View>
            <Text className="text-text-secondary text-xs">I've saved these recovery codes</Text>
          </Pressable>
          <Pressable
            onPress={finishEnrollment}
            disabled={!codesAcknowledged}
            className="self-start bg-accent-indigo/80 rounded-xl py-2 px-4"
            style={{ opacity: codesAcknowledged ? 1 : 0.5 }}
          >
            <Text className="text-white text-sm font-semibold">Done</Text>
          </Pressable>
        </View>
      )}

      {mfaEnabled && !showDisableForm && (
        <Pressable onPress={() => setShowDisableForm(true)} className="self-start bg-white/10 border border-white/15 rounded-xl py-2 px-4">
          <Text className="text-text-primary text-sm font-semibold">Disable 2FA</Text>
        </Pressable>
      )}

      {mfaEnabled && showDisableForm && (
        <View className="gap-2">
          <GlassInput secureTextEntry placeholder="Current password" value={disablePassword} onChangeText={setDisablePassword} />
          <GlassInput placeholder="6-digit authenticator code" value={disableCode} onChangeText={setDisableCode} keyboardType="number-pad" />
          {disableError ? <Text className="text-[#f87171] text-xs">{disableError}</Text> : null}
          <View className="flex-row gap-2">
            <Pressable
              onPress={handleDisable}
              disabled={disableSaving || !disablePassword || !disableCode}
              className="bg-white/10 border border-white/15 rounded-xl py-2 px-4"
              style={{ opacity: disableSaving || !disablePassword || !disableCode ? 0.5 : 1 }}
            >
              <Text className="text-text-primary text-sm font-semibold">{disableSaving ? 'Disabling...' : 'Confirm Disable'}</Text>
            </Pressable>
            <Pressable onPress={() => setShowDisableForm(false)} className="bg-white/10 border border-white/15 rounded-xl py-2 px-4">
              <Text className="text-text-primary text-sm font-semibold">Cancel</Text>
            </Pressable>
          </View>
        </View>
      )}
    </GlassPanel>
  );
}
