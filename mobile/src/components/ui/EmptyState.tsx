import { View, Text } from 'react-native';
import { BookOpen } from 'lucide-react-native';
import { GlassPanel } from './GlassPanel';
import { PrimaryButton } from './PrimaryButton';

interface EmptyStateProps {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ title, message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <GlassPanel className="py-12 px-8 items-center">
      <BookOpen size={44} color="#64748b" />
      <Text className="text-text-primary text-lg font-bold mt-4 mb-1">{title}</Text>
      <Text className="text-text-secondary text-sm text-center mb-5">{message}</Text>
      {actionLabel && onAction && (
        <View className="w-full max-w-[240px]">
          <PrimaryButton title={actionLabel} onPress={onAction} />
        </View>
      )}
    </GlassPanel>
  );
}
