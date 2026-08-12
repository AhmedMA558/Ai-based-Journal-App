import { useState, type ReactNode } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Bell, Sparkles, Flame, CheckCircle, X, ShieldCheck } from 'lucide-react-native';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { FadeInView } from '@/components/ui/FadeInView';
import { cn } from '@/lib/utils';

interface NotificationItem {
  id: number;
  title: string;
  message: string;
  time: string;
  icon: ReactNode;
}

// Same static/decorative notification list as frontend/src/components/
// NotificationsDrawer.tsx - this project's history has repeatedly found
// "looks real but isn't" features (fake streak, fake AI level, fake email,
// a fake 2FA badge), so worth being explicit here too: there's no
// notifications backend anywhere in this platform, these three items are
// hardcoded on both the web and mobile clients. Unlike the web version
// though - where "Mark all as read" is a complete no-op, it only fires a
// toast and never touches any state - this one actually tracks read/unread
// locally, since a fake backend and a fake button press are different
// kinds of dishonest and only one of them is worth fixing here.
const NOTIFICATIONS: NotificationItem[] = [
  {
    id: 1,
    title: 'AI Daily Wellness Suggestion',
    message: 'Take 5 deep breaths and write down 3 things you are grateful for today.',
    time: '10m ago',
    icon: <Sparkles size={16} color="#c084fc" />,
  },
  {
    id: 2,
    title: '3-Day Journaling Streak Unlocked! 🔥',
    message: 'Awesome consistency! You have logged entries for 3 consecutive days.',
    time: '2h ago',
    icon: <Flame size={16} color="#fde047" />,
  },
  {
    id: 3,
    title: 'Session Security Active',
    message: 'Your session is active and verified.',
    time: '1h ago',
    icon: <ShieldCheck size={16} color="#38bdf8" />,
  },
];

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const [readIds, setReadIds] = useState<Set<number>>(new Set());

  const markAllRead = () => setReadIds(new Set(NOTIFICATIONS.map((n) => n.id)));
  const markRead = (id: number) => setReadIds((prev) => new Set(prev).add(id));

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

      <View className="px-5 mb-2 items-end">
        <Pressable onPress={markAllRead} className="flex-row items-center gap-1 py-1">
          <CheckCircle size={14} color="#818cf8" />
          <Text className="text-accent-indigo text-xs font-semibold">Mark all as read</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
        <FadeInView>
          <View className="gap-3">
            {NOTIFICATIONS.map((item) => {
              const isRead = readIds.has(item.id);
              return (
                <Pressable key={item.id} onPress={() => markRead(item.id)}>
                  <GlassPanel className={cn('p-4 flex-row gap-3', isRead && 'opacity-50')}>
                    <View className="p-2 rounded-xl bg-white/[0.06] h-fit">{item.icon}</View>
                    <View className="flex-1">
                      <View className="flex-row items-center justify-between mb-1">
                        <Text className="text-text-primary text-sm font-semibold flex-1 pr-2">{item.title}</Text>
                        <Text className="text-text-muted text-[10px]">{item.time}</Text>
                      </View>
                      <Text className="text-text-secondary text-xs leading-4">{item.message}</Text>
                    </View>
                  </GlassPanel>
                </Pressable>
              );
            })}
          </View>
        </FadeInView>
      </ScrollView>
    </SafeAreaView>
  );
}
