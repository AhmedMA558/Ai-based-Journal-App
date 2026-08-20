import { useState } from 'react';
import { View, Text, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { ArrowRight } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { GlassInput } from '@/components/ui/GlassInput';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { MindoraLogo } from '@/components/ui/MindoraLogo';
import { ErrorBanner } from '@/components/ErrorBanner';
import { FadeInView } from '@/components/ui/FadeInView';
import { authService } from '@/services';
import { useAuthContext } from '@/context/AuthContext';
import type { AuthStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export default function RegisterScreen({ navigation }: Props) {
  const { login } = useAuthContext();
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const canSubmit = fullName.trim() && username.trim() && email.trim() && password.trim();

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      await authService.register(username, email, password, fullName);
      login();
    } catch (err: any) {
      setError(err?.message || 'Registration failed. Please try a different username or email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView className="flex-1 bg-bg-primary" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
        <FadeInView>
          <GlassPanel className="p-8">
            <View className="items-center mb-8">
              <MindoraLogo size={58} />
              <Text className="text-sm font-bold text-accent-indigo tracking-wide mb-1">MINDORA</Text>
              <Text className="text-2xl font-extrabold text-text-primary mb-1">Create your account</Text>
              <Text className="text-text-secondary text-sm text-center">Start journaling with your personal AI companion</Text>
            </View>

            {error ? (
              <View className="mb-5">
                <ErrorBanner message={error} />
              </View>
            ) : null}

            <View className="gap-4">
              <View>
                <Text className="text-[#cbd5e1] text-sm font-medium mb-2">Full Name</Text>
                <GlassInput placeholder="John Doe" value={fullName} onChangeText={setFullName} />
              </View>
              <View>
                <Text className="text-[#cbd5e1] text-sm font-medium mb-2">Username</Text>
                <GlassInput autoCapitalize="none" placeholder="alex_dev" value={username} onChangeText={setUsername} />
              </View>
              <View>
                <Text className="text-[#cbd5e1] text-sm font-medium mb-2">Email Address</Text>
                <GlassInput
                  autoCapitalize="none"
                  keyboardType="email-address"
                  placeholder="alex@example.com"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
              <View>
                <Text className="text-[#cbd5e1] text-sm font-medium mb-2">Password</Text>
                <GlassInput secureTextEntry placeholder="••••••••••••" value={password} onChangeText={setPassword} />
              </View>

              <View className="mt-2">
                <PrimaryButton
                  title={loading ? 'Creating account...' : 'Create Account'}
                  onPress={handleSubmit}
                  loading={loading}
                  disabled={!canSubmit}
                  icon={<ArrowRight size={18} color="#ffffff" />}
                />
              </View>
            </View>

            <View className="mt-6 pt-5 border-t border-white/[0.08] items-center">
              <Pressable onPress={() => navigation.navigate('Login')}>
                <Text className="text-text-secondary text-sm">
                  Already have an account? <Text className="text-accent-indigo font-bold">Sign In</Text>
                </Text>
              </Pressable>
            </View>
          </GlassPanel>
        </FadeInView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
