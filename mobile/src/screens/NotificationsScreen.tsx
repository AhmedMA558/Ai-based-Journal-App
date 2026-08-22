import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Bell, CheckCircle, X, ShieldCheck, BellOff } from 'lucide-react-native';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { SkeletonBlock } from '@/components/ui/SkeletonBlock';
import { ErrorBanner } from '@/components/ErrorBanner';
import { FadeInView } from '@/components/ui/FadeInView';
import { cn } from '@/lib/utils';
import { notificationService } from '@/services';
import type { NotificationItem } from '@/types';

// Real in-app notification log, matching web's NotificationsDrawer.tsx - this
// used to be a fully hardcoded 3-item list ("3-Day Streak Unlocked!" for
// every user regardless of their real activity), the exact "looks real but
// isn't" pattern this project's audits keep catching. Web's own drawer was
// already fixed to fetch this same backend endpoint a phase ago; this screen
// was simply never updated to match.

// Only "SECURITY" is emitted by the backend today (password change/reset,
// MFA toggle, admin disable) - a generic fallback keeps this from needing an
// update every time a new notification type is added server-side. Same
// TYPE_META shape as the web drawer.
const TYPE_META: Record<string, { label: string; icon: ReactNode }> = {
  SECURITY: { label: 'Account Security', icon: <ShieldCheck size={16} color="#38bdf8" /> },
};
const DEFAULT_TYPE_META = { label: 'Notification', icon: <Bell size={16} color="#818cf8" /> };

function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diffMs = Date.now() - then;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // Guards against a slow response landing after the screen has already
  // unmounted (navigated back) - the standard stale-setState-on-unmounted-
  // screen guard, same shape as this app's other stale-response fixes.
  const requestIdRef = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError('');
    try {
      const list = await notificationService.list();
      if (requestIdRef.current !== requestId) return;
      setNotifications(list);
    } catch {
      if (requestIdRef.current !== requestId) return;
      setError('Could not load notifications. Please try again.');
    } finally {
      if (requestIdRef.current === requestId) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await notificationService.markAllRead();
    } catch {
      // Best-effort - the optimistic local update above already reflects
      // intent; a failure here just means it isn't persisted server-side
      // yet, not something worth a jarring rollback/error for a "mark read"
      // action.
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-bg-primary" edges={['top']}>
      <View className="flex-row items-center justify-between px-5 pt-3 pb-2">
        <View className="flex-row items-center gap-3">
          <Bell size={20} color="#818cf8" />
          <Text className="text-text-primary text-lg font-extrabold">Notifications</Text>
        </View>
        <Pressable onPress={() => navigation.goBack()} className="p-2 rounded-full bg-white/5 border border-white/10">
          <X size={18} color="#94a3b8" />
        </Pressable>
      </View>

      {notifications.length > 0 && (
        <View className="px-5 mb-2 items-end">
          <Pressable onPress={markAllRead} className="flex-row items-center gap-1 py-1">
            <CheckCircle size={14} color="#818cf8" />
            <Text className="text-accent-indigo text-xs font-semibold">Mark all as read</Text>
          </Pressable>
        </View>
      )}

      <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
        <FadeInView>
          {loading ? (
            <View className="gap-3">
              <SkeletonBlock className="h-20" />
              <SkeletonBlock className="h-20" />
              <SkeletonBlock className="h-20" />
            </View>
          ) : error ? (
            <ErrorBanner message={error} />
          ) : notifications.length === 0 ? (
            <GlassPanel className="py-12 px-8 items-center">
              <BellOff size={32} color="#64748b" />
              <Text className="text-text-secondary text-sm mt-3">No notifications yet</Text>
            </GlassPanel>
          ) : (
            <View className="gap-3">
              {notifications.map((item) => {
                const meta = TYPE_META[item.type] || DEFAULT_TYPE_META;
                return (
                  <GlassPanel key={item.id} className={cn('p-4 flex-row gap-3', item.read && 'opacity-50')}>
                    <View className="p-2 rounded-xl bg-white/[0.06] h-fit">{meta.icon}</View>
                    <View className="flex-1">
                      <View className="flex-row items-center justify-between mb-1">
                        <Text className="text-text-primary text-sm font-semibold flex-1 pr-2">{meta.label}</Text>
                        <Text className="text-text-muted text-[10px]">{formatRelativeTime(item.createdAt)}</Text>
                      </View>
                      <Text className="text-text-secondary text-xs leading-4">{item.message}</Text>
                    </View>
                  </GlassPanel>
                );
              })}
            </View>
          )}
        </FadeInView>
      </ScrollView>
    </SafeAreaView>
  );
}
