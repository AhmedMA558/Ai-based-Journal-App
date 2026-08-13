import { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Flame, BookOpen, Heart, Plus, LogOut, Edit3, Award, Bell, Command } from 'lucide-react-native';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { SkeletonBlock } from '@/components/ui/SkeletonBlock';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorBanner } from '@/components/ErrorBanner';
import { OfflineBanner } from '@/components/OfflineBanner';
import { FadeInView } from '@/components/ui/FadeInView';
import { journalService, recommendationService } from '@/services';
import { session } from '@/services/session';
import { getPendingCount } from '@/lib/offlineQueue';
import { useAuthContext } from '@/context/AuthContext';
import { MOOD_META, type Mood } from '@/lib/moods';
import { calculateStreak } from '@/lib/journalStats';
import type { MainStackParamList } from '@/navigation/types';
import type { Journal } from '@/types';

const DEFAULT_RECOMMENDATION = 'Take 5 deep breaths and reflect on 3 good things today.';

function moodEmoji(mood?: string): string {
  return MOOD_META[(mood || '').toUpperCase() as Mood]?.emoji || '😊';
}

export default function DashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { logout } = useAuthContext();
  const [username, setUsername] = useState('Journaler');
  const [journals, setJournals] = useState<Journal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [pendingCount, setPendingCount] = useState(0);
  const [recommendation, setRecommendation] = useState(DEFAULT_RECOMMENDATION);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const [list, name] = await Promise.all([journalService.getAllJournals(), session.getUserName()]);
      setJournals(Array.isArray(list) ? list : []);
      setUsername(name);
    } catch (err) {
      setError('Could not load your dashboard. Please try refreshing.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
    setPendingCount(await getPendingCount());

    try {
      const suggestion = await recommendationService.getSuggestion();
      if (suggestion) setRecommendation(suggestion);
    } catch {
      // Keep the existing recommendation (default or last-successful fetch).
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const streak = calculateStreak(journals).current;

  return (
    <SafeAreaView className="flex-1 bg-bg-primary" edges={['top']}>
      <FlatList
        data={journals.slice(0, 6)}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 20, gap: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor="#818cf8" />}
        ListHeaderComponent={
          <FadeInView>
            <View className="flex-row items-center justify-between mb-5">
              <View>
                <Text className="text-text-secondary text-sm">Hi,</Text>
                <Text className="text-text-primary text-2xl font-extrabold">{username} 👋</Text>
              </View>
              <View className="flex-row gap-2">
                <Pressable
                  onPress={() => navigation.navigate('CommandPalette')}
                  className="p-2 rounded-full bg-white/5 border border-white/10"
                >
                  <Command size={18} color="#c084fc" />
                </Pressable>
                <Pressable
                  onPress={() => navigation.navigate('Notifications')}
                  className="p-2 rounded-full bg-white/5 border border-white/10"
                >
                  <Bell size={18} color="#818cf8" />
                </Pressable>
                <Pressable
                  onPress={() => navigation.navigate('Achievements')}
                  className="p-2 rounded-full bg-white/5 border border-white/10"
                >
                  <Award size={18} color="#fde047" />
                </Pressable>
                <Pressable onPress={logout} className="p-2 rounded-full bg-white/5 border border-white/10">
                  <LogOut size={18} color="#94a3b8" />
                </Pressable>
              </View>
            </View>

            <OfflineBanner pendingCount={pendingCount} />

            <View className="flex-row gap-3 mb-5">
              <GlassPanel className="flex-1 p-4 items-start">
                <View className="w-11 h-11 rounded-2xl bg-[rgba(234,179,8,0.15)] items-center justify-center mb-2">
                  <Flame size={22} color="#fde047" />
                </View>
                <Text className="text-text-secondary text-xs">Streak</Text>
                <Text className="text-text-primary text-xl font-extrabold">{streak} Days</Text>
              </GlassPanel>
              <GlassPanel className="flex-1 p-4 items-start">
                <View className="w-11 h-11 rounded-2xl bg-[rgba(99,102,241,0.15)] items-center justify-center mb-2">
                  <BookOpen size={22} color="#818cf8" />
                </View>
                <Text className="text-text-secondary text-xs">Entries</Text>
                <Text className="text-text-primary text-xl font-extrabold">{journals.length}</Text>
              </GlassPanel>
            </View>

            <GlassPanel className="p-4 flex-row items-center gap-3 mb-6">
              <View className="w-11 h-11 rounded-2xl bg-[rgba(34,197,94,0.15)] items-center justify-center">
                <Heart size={22} color="#4ade80" />
              </View>
              <View className="flex-1">
                <Text className="text-text-secondary text-xs mb-1">AI Wellness Suggestion</Text>
                <Text className="text-[#cbd5e1] text-sm italic">"{recommendation}"</Text>
              </View>
            </GlassPanel>

            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-text-primary text-lg font-bold">Recent Entries</Text>
              <Pressable
                onPress={() => navigation.navigate('JournalEditor', undefined)}
                className="flex-row items-center gap-1 bg-white/5 border border-white/10 rounded-xl py-2 px-3"
              >
                <Plus size={14} color="#818cf8" />
                <Text className="text-accent-indigo text-xs font-semibold">New</Text>
              </Pressable>
            </View>

            {error ? <ErrorBanner message={error} /> : null}
            {!error && loading ? (
              <View className="gap-3">
                <SkeletonBlock className="h-[90px]" />
                <SkeletonBlock className="h-[90px]" />
                <SkeletonBlock className="h-[90px]" />
              </View>
            ) : null}
            {!error && !loading && journals.length === 0 ? (
              <EmptyState
                title="No Journal Entries Yet"
                message="Start your journaling journey by writing your first entry."
                actionLabel="Create First Entry"
                onAction={() => navigation.navigate('JournalEditor', undefined)}
              />
            ) : null}
          </FadeInView>
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => navigation.navigate('JournalEditor', { journal: item })}>
            <GlassPanel className="p-4 flex-row items-start gap-3">
              <Text className="text-2xl">{moodEmoji(item.mood)}</Text>
              <View className="flex-1">
                <Text className="text-text-primary font-bold mb-1" numberOfLines={1}>
                  {item.title}
                </Text>
                <Text className="text-text-secondary text-sm" numberOfLines={2}>
                  {item.content}
                </Text>
              </View>
              <Edit3 size={16} color="#38bdf8" />
            </GlassPanel>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}
