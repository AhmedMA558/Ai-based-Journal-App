import { Pressable, Text, ActivityIndicator, type GestureResponderEvent } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { cn } from '@/lib/utils';

interface PrimaryButtonProps {
  title: string;
  onPress?: (e: GestureResponderEvent) => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

// RN port of .btn-primary (indigo->purple gradient, bold white label).
export function PrimaryButton({ title, onPress, disabled, loading, icon, className }: PrimaryButtonProps) {
  return (
    <Pressable onPress={onPress} disabled={disabled || loading} className={cn('rounded-2xl overflow-hidden', (disabled || loading) && 'opacity-60', className)}>
      {/* LinearGradient isn't a NativeWind-interop'd component, so layout here
          uses a plain style prop rather than className. */}
      <LinearGradient
        colors={['#6366f1', '#a855f7']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingVertical: 14, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
      >
        {loading ? <ActivityIndicator color="#ffffff" /> : icon}
        <Text className="text-white font-bold text-[15px]">{title}</Text>
      </LinearGradient>
    </Pressable>
  );
}
