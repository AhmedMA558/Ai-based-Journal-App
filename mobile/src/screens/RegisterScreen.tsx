import { useState } from 'react';
import { View, Text, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles, ArrowRight } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { GlassInput } from '@/components/ui/GlassInput';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
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
    <KeyboardAvoidingView className="flex-1 bg-bg-primary" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
        <FadeInView>
          <GlassPanel className="p-8">
            <View className="items-center mb-8">
              <LinearGradient colors={['#6366f1', '#a855f7']} style={{ padding: 14, borderRadius: 20, marginBottom: 16 }}>
                <Sparkles size={30} color="#ffffff" />
              </LinearGradient>
              <Text className="text-2xl font-extrabold text-text-primary mb-1">Create your account</Text>
              <Text className="text-text-secondary text-sm text-center">Join the next-generation intelligent journaling platform</Text>
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
