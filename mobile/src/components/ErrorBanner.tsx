import { View, Text } from 'react-native';
import { AlertCircle } from 'lucide-react-native';

// The one error-state component every screen imports - mirrors the
// AlertCircle-icon + red-tinted-panel pattern Phase 10 standardized across
// the web app's previously-silent views (DashboardView, JournalFeed, etc.).
export function ErrorBanner({ message }: { message: string }) {
  return (
    <View className="bg-accent-rose/15 border border-accent-rose/30 rounded-2xl py-3 px-4 flex-row items-center gap-2">
      <AlertCircle size={18} color="#f87171" />
      <Text className="text-[#f87171] text-sm flex-1">{message}</Text>
    </View>
  );
}
