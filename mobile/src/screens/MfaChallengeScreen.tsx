import { useState } from 'react';
import { View, Text, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ShieldCheck, ArrowRight } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { GlassInput } from '@/components/ui/GlassInput';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ErrorBanner } from '@/components/ErrorBanner';
import { FadeInView } from '@/components/ui/FadeInView';
import { authService } from '@/services';
import { useAuthContext } from '@/context/AuthContext';
import type { AuthStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'MfaChallenge'>;

export default function MfaChallengeScreen({ route, navigation }: Props) {
  const { challengeToken } = route.params;
  const { login } = useAuthContext();
  const [code, setCode] = useState('');
  const [useRecoveryCode, setUseRecoveryCode] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    setError('');
    setLoading(true);
    try {
      await authService.verifyMfa(challengeToken, useRecoveryCode ? undefined : code, useRecoveryCode ? code : undefined);
      login();
    } catch (err: any) {
      setError(err?.message || 'Verification failed. Check the code and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView className="flex-1 bg-bg-primary" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
        <FadeInView>
          <GlassPanel className="p-8">
            <View className="items-center mb-8">
              <LinearGradient colors={['#6366f1', '#a855f7']} style={{ padding: 14, borderRadius: 20, marginBottom: 16 }}>
                <ShieldCheck size={30} color="#ffffff" />
              </LinearGradient>
              <Text className="text-2xl font-extrabold text-text-primary mb-1">Two-Factor Verification</Text>
              <Text className="text-text-secondary text-sm text-center">
                {useRecoveryCode ? 'Enter one of your saved recovery codes' : 'Enter the 6-digit code from your authenticator app'}
              </Text>
            </View>

            {error ? (
              <View className="mb-5">
                <ErrorBanner message={error} />
              </View>
            ) : null}

            <View className="gap-4">
              <View>
                <Text className="text-[#cbd5e1] text-sm font-medium mb-2">
                  {useRecoveryCode ? 'Recovery Code' : 'Authenticator Code'}
                </Text>
                <GlassInput
                  autoCapitalize="none"
                  keyboardType={useRecoveryCode ? 'default' : 'number-pad'}
                  placeholder={useRecoveryCode ? 'XXXXX-XXXXX' : '123456'}
                  value={code}
                  onChangeText={setCode}
                />
              </View>

              <View className="mt-2">
                <PrimaryButton
                  title={loading ? 'Verifying...' : 'Verify'}
                  onPress={handleVerify}
                  loading={loading}
                  disabled={!code.trim()}
                  icon={<ArrowRight size={18} color="#ffffff" />}
                />
              </View>
            </View>

            <View className="mt-6 pt-5 border-t border-white/[0.08] items-center gap-3">
              <Pressable
                onPress={() => {
                  setUseRecoveryCode((v) => !v);
                  setCode('');
                  setError('');
                }}
              >
                <Text className="text-text-secondary text-sm">
                  {useRecoveryCode ? 'Use an authenticator code instead' : 'Use a recovery code instead'}
                </Text>
              </Pressable>
              <Pressable onPress={() => navigation.navigate('Login')}>
                <Text className="text-text-muted text-xs">Back to Sign In</Text>
              </Pressable>
            </View>
          </GlassPanel>
        </FadeInView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
