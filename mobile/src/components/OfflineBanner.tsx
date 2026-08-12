import { View, Text } from 'react-native';
import { WifiOff, RefreshCw } from 'lucide-react-native';
import { useNetInfo } from '@react-native-community/netinfo';

interface OfflineBannerProps {
  pendingCount: number;
}

// Same visual pattern as ErrorBanner (icon + tinted glass panel), shown on
// Dashboard/JournalList - the primary read/write surfaces for offline
// support. Renders nothing when online with an empty sync queue, so it's
// safe to always mount.
export function OfflineBanner({ pendingCount }: OfflineBannerProps) {
  const netInfo = useNetInfo();
  const isOffline = netInfo.isConnected === false || netInfo.isInternetReachable === false;

  if (!isOffline && pendingCount === 0) return null;

  return (
    <View className="mb-3 bg-[rgba(251,191,36,0.12)] border border-[rgba(251,191,36,0.3)] rounded-2xl py-3 px-4 flex-row items-center gap-2">
      {isOffline ? <WifiOff size={16} color="#fbbf24" /> : <RefreshCw size={16} color="#fbbf24" />}
      <Text className="text-[#fbbf24] text-xs flex-1">
        {isOffline
          ? pendingCount > 0
            ? `You're offline - showing your last synced data (${pendingCount} change${pendingCount === 1 ? '' : 's'} will sync when you're back online)`
            : "You're offline - showing your last synced data"
          : `Syncing ${pendingCount} change${pendingCount === 1 ? '' : 's'}...`}
      </Text>
    </View>
  );
}
