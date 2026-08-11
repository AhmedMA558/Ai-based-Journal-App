import { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Search as SearchIcon } from 'lucide-react-native';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { GlassInput } from '@/components/ui/GlassInput';
import { SkeletonBlock } from '@/components/ui/SkeletonBlock';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorBanner } from '@/components/ErrorBanner';
import { FadeInView } from '@/components/ui/FadeInView';
import { cn } from '@/lib/utils';
import { MOOD_META, MOOD_FILTERS, type Mood, type MoodFilter } from '@/lib/moods';
import { searchService } from '@/services';
import type { MainStackParamList } from '@/navigation/types';
import type { SearchResult } from '@/types';

const SEARCH_DEBOUNCE_MS = 300;

function moodEmoji(mood?: string): string {
  return MOOD_META[(mood || '').toUpperCase() as Mood]?.emoji || '😊';
}

// Debounced, backend-driven search - same 300ms timing as frontend/src/components/SearchView.tsx.
export default function SearchScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const [query, setQuery] = useState('');
  const [moodFilter, setMoodFilter] = useState<MoodFilter>('ALL');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError('');

    const timer = setTimeout(async () => {
      try {
        const list = await searchService.search({ query, mood: moodFilter });
        setResults(Array.isArray(list) ? list : []);
      } catch {
        setError('Search failed. Please try again.');
        setResults([]);
      } finally {
        setLoading(false);
        setHasSearched(true);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query, moodFilter]);

  return (
    <SafeAreaView className="flex-1 bg-bg-primary" edges={['top']}>
      <View className="px-5 pt-4 pb-2">
        <Text className="text-text-primary text-2xl font-extrabold">Search</Text>
        <Text className="text-text-secondary text-xs">Real-time search across your entries</Text>
      </View>

      <View className="px-5 mb-3">
        <FadeInView>
          <GlassPanel className="p-3">
            <View className="flex-row items-center">
              <SearchIcon size={18} color="#818cf8" />
              <GlassInput
                className="flex-1 ml-2 bg-transparent border-0 px-1"
                placeholder="Search your journals..."
                value={query}
                onChangeText={setQuery}
              />
            </View>
          </GlassPanel>
        </FadeInView>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-5 mb-3" contentContainerStyle={{ gap: 8 }}>
        {MOOD_FILTERS.map((m) => (
          <Pressable
            key={m}
            onPress={() => setMoodFilter(m)}
            className={cn(
              'py-2 px-3 rounded-2xl border',
              moodFilter === m ? 'bg-accent-indigo/25 border-accent-indigo' : 'bg-white/[0.04] border-white/[0.08]'
            )}
          >
            <Text className={cn('text-xs', moodFilter === m ? 'text-white font-bold' : 'text-text-secondary font-medium')}>
              {m === 'ALL' ? 'All Moods' : `${m} ${moodEmoji(m)}`}
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
          <SkeletonBlock className="h-[90px]" />
          <SkeletonBlock className="h-[90px]" />
        </View>
      ) : null}

      {!error && !loading && hasSearched && results.length === 0 ? (
        <View className="px-5">
          <EmptyState title="No Matching Entries" message="Try adjusting your search query or mood filter." />
        </View>
      ) : null}

      {!error && !loading && results.length > 0 && (
        <FlatList
          data={results}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: 20, gap: 12 }}
          renderItem={({ item }) => (
            <Pressable onPress={() => navigation.navigate('JournalEditor', { journal: item })}>
              <GlassPanel className="p-4">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-xs py-1 px-2 rounded-xl bg-accent-indigo/15 text-accent-indigo font-semibold">
                    {moodEmoji(item.mood)} {item.mood || 'HAPPY'}
                  </Text>
                  <Text className="text-text-muted text-xs">
                    {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Recent'}
                  </Text>
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
