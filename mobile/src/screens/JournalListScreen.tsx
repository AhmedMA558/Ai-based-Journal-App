import { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Plus, Trash2 } from 'lucide-react-native';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { SkeletonBlock } from '@/components/ui/SkeletonBlock';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorBanner } from '@/components/ErrorBanner';
import { cn } from '@/lib/utils';
import { MOOD_META, MOOD_FILTERS, type Mood, type MoodFilter } from '@/lib/moods';
import { journalService } from '@/services';
import type { MainStackParamList } from '@/navigation/types';
import type { Journal } from '@/types';

function moodEmoji(mood?: string): string {
  return MOOD_META[(mood || '').toUpperCase() as Mood]?.emoji || '😐';
}

export default function JournalListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const [journals, setJournals] = useState<Journal[]>([]);
  const [filter, setFilter] = useState<MoodFilter>('ALL');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const list = await journalService.getAllJournals();
      setJournals(Array.isArray(list) ? list : []);
    } catch {
      setError('Could not load your journals. Please try refreshing.');
    } finally {
      setLoading(false);
      setRefreshing(false);
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

  const handleDelete = async (id: Journal['id']) => {
    try {
      await journalService.deleteJournal(id);
      setJournals((prev) => prev.filter((j) => j.id !== id));
    } catch {
      // Delete failure - list simply stays as-is, matching the web app's silent-catch here.
    }
  };

  const filtered = filter === 'ALL' ? journals : journals.filter((j) => (j.mood || '').toUpperCase() === filter);

  return (
    <SafeAreaView className="flex-1 bg-bg-primary" edges={['top']}>
      <View className="px-5 pt-4 pb-2 flex-row items-center justify-between">
        <View>
          <Text className="text-text-primary text-2xl font-extrabold">My Journals</Text>
          <Text className="text-text-secondary text-xs">Browse and edit your entries</Text>
        </View>
        <Pressable
          onPress={() => navigation.navigate('JournalEditor', undefined)}
          className="w-11 h-11 rounded-full items-center justify-center bg-accent-indigo"
        >
          <Plus size={20} color="#ffffff" />
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-5 mb-3" contentContainerStyle={{ gap: 8 }}>
        {MOOD_FILTERS.map((m) => (
          <Pressable
            key={m}
            onPress={() => setFilter(m)}
            className={cn(
              'py-2 px-3 rounded-2xl border',
              filter === m ? 'bg-accent-indigo/25 border-accent-indigo' : 'bg-white/[0.04] border-white/[0.08]'
            )}
          >
            <Text className={cn('text-xs', filter === m ? 'text-white font-bold' : 'text-text-secondary font-medium')}>
              {m === 'ALL' ? 'All Entries' : `${m} ${moodEmoji(m)}`}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {error ? (
        <View className="px-5">
          <ErrorBanner message={error} />
        </View>
      ) : null}

      {!error && loading ? (
        <View className="px-5 gap-3">
          <SkeletonBlock className="h-[110px]" />
          <SkeletonBlock className="h-[110px]" />
          <SkeletonBlock className="h-[110px]" />
        </View>
      ) : null}

      {!error && !loading && filtered.length === 0 ? (
        <View className="px-5">
          <EmptyState
            title="No Entries Found"
            message="Try clearing filters or create a new journal entry."
            actionLabel="Write Journal"
            onAction={() => navigation.navigate('JournalEditor', undefined)}
          />
        </View>
      ) : null}

      {!error && !loading && filtered.length > 0 && (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: 20, gap: 12 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor="#818cf8" />}
          renderItem={({ item }) => (
            <Pressable onPress={() => navigation.navigate('JournalEditor', { journal: item })}>
              <GlassPanel className="p-4">
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center gap-2 bg-accent-indigo/15 rounded-xl py-1 px-2">
                    <Text>{moodEmoji(item.mood)}</Text>
                    <Text className="text-accent-indigo text-xs font-semibold">{item.mood || 'HAPPY'}</Text>
                  </View>
                  <Pressable onPress={() => handleDelete(item.id)} className="p-1">
                    <Trash2 size={16} color="#f87171" />
                  </Pressable>
                </View>
                <Text className="text-text-primary font-bold mb-1" numberOfLines={1}>
                  {item.title}
                </Text>
                <Text className="text-text-secondary text-sm" numberOfLines={2}>
                  {item.content}
                </Text>
              </GlassPanel>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}
