import { View, Text, Pressable } from 'react-native';
import { AlertCircle, X } from 'lucide-react-native';

interface EmailVerificationBannerProps {
  onPress: () => void;
  onDismiss: () => void;
}

// Same visual pattern as OfflineBanner/ErrorBanner (icon + tinted glass
// panel) - non-blocking nag only, never gates access. Dismiss is
// session-only (local state in the parent screen, resets on relaunch).
export function EmailVerificationBanner({ onPress, onDismiss }: EmailVerificationBannerProps) {
  return (
    <View className="mb-3 bg-[rgba(245,158,11,0.15)] border border-[rgba(245,158,11,0.3)] rounded-2xl py-3 px-4 flex-row items-center gap-2">
      <AlertCircle size={16} color="#fbbf24" />
      <Text className="text-[#fbbf24] text-xs flex-1">Verify your email to secure your account.</Text>
      <Pressable onPress={onPress}>
        <Text className="text-[#fbbf24] text-xs font-bold underline">Verify Now</Text>
      </Pressable>
      <Pressable onPress={onDismiss} className="pl-1">
        <X size={14} color="#fbbf24" />
      </Pressable>
    </View>
  );
}
