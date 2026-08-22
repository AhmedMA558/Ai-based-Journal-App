import { useCallback, useRef, useState } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Smile, TrendingUp, Flame, Award, Hash, PenLine, CalendarDays } from 'lucide-react-native';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { SkeletonBlock } from '@/components/ui/SkeletonBlock';
import { ErrorBanner } from '@/components/ErrorBanner';
import { EmptyState } from '@/components/ui/EmptyState';
import { FadeInView } from '@/components/ui/FadeInView';
import { MOOD_META, MOODS as SHARED_MOODS, type Mood as SharedMood, type MoodMeta } from '@/lib/moods';
import { getAiLevel } from '@/lib/journalStats';
import { journalService, analyticsService } from '@/services';
import type { Journal, Insights } from '@/types';

// Same "8th NEUTRAL bucket" reasoning as the web app's AnalyticsView.tsx:
// backend-seeded pre-classification placeholder, a real reportable bucket
// here but deliberately not part of the shared Mood/MOOD_META picker contract.
type Mood = SharedMood | 'NEUTRAL';
const MOODS: Mood[] = [...SHARED_MOODS, 'NEUTRAL'];
const NEUTRAL_META: MoodMeta = {
  key: 'NEUTRAL' as SharedMood,
  label: 'Neutral',
  emoji: '😐',
  bg: 'rgba(148, 163, 184, 0.15)',
  border: 'rgba(148, 163, 184, 0.4)',
  text: '#94a3b8',
};
const ANALYTICS_MOOD_META: Record<Mood, MoodMeta> = { ...MOOD_META, NEUTRAL: NEUTRAL_META };

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function AnalyticsScreen() {
  const [journals, setJournals] = useState<Journal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [insights, setInsights] = useState<Insights | null>(null);
  // load() is triggered both by useFocusEffect (fires on every screen focus)
  // and pull-to-refresh, with no relationship between the two - a request-id
  // ref (same pattern web's AnalyticsView.tsx uses for its identical
  // dual-trigger shape) tracks which invocation is latest so an in-flight
  // slow response can never overwrite fresher data if it lands after a
  // newer call already started.
  const requestIdRef = useRef(0);

  const load = useCallback(async (isRefresh = false) => {
    const requestId = ++requestIdRef.current;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const list = await journalService.getAllJournals();
      if (requestIdRef.current !== requestId) return;
      setJournals(Array.isArray(list) ? list : []);
    } catch {
      if (requestIdRef.current === requestId) {
        setError('Could not load analytics data. Please try refreshing.');
      }
    } finally {
      if (requestIdRef.current === requestId) {
        setLoading(false);
        setRefreshing(false);
      }
    }

    try {
      const data = await analyticsService.getInsights();
      if (requestIdRef.current === requestId) setInsights(data);
    } catch {
      if (requestIdRef.current === requestId) setInsights(null);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const totalEntries = journals.length;
  const moodCounts: Record<Mood, number> = {
    HAPPY: 0, EXCITED: 0, RELAXED: 0, STRESSED: 0, SAD: 0, GRATEFUL: 0, ANGRY: 0, NEUTRAL: 0,
  };
  journals.forEach((j) => {
    const m = (j.mood || 'HAPPY').toUpperCase() as Mood;
    if (moodCounts[m] !== undefined) moodCounts[m] += 1;
    else moodCounts.HAPPY += 1;
  });

  let dominantMood: Mood = 'HAPPY';
  let maxMoodCount = -1;
  MOODS.forEach((m) => {
    if (moodCounts[m] > maxMoodCount) {
      maxMoodCount = moodCounts[m];
      dominantMood = m;
    }
  });

  const positiveCount = moodCounts.HAPPY + moodCounts.EXCITED + moodCounts.RELAXED + moodCounts.GRATEFUL;
  const positivityRate = totalEntries > 0 ? Math.round((positiveCount / totalEntries) * 100) : 100;

  const moodBreakdown = MOODS.filter((m) => moodCounts[m] > 0).sort((a, b) => moodCounts[b] - moodCounts[a]);
  const maxBreakdownCount = Math.max(1, ...moodBreakdown.map((m) => moodCounts[m]));

  const trendCounts: number[] = DAY_LABELS.map(() => 0);
  const today = new Date();
  const last7Start = new Date(today);
  last7Start.setDate(today.getDate() - 6);
  last7Start.setHours(0, 0, 0, 0);
  journals.forEach((j) => {
    if (!j.createdAt) return;
    const d = new Date(j.createdAt);
    if (d >= last7Start) trendCounts[d.getDay()] += 1;
  });
  const maxTrendCount = Math.max(1, ...trendCounts);

  return (
    <SafeAreaView className="flex-1 bg-bg-primary" edges={['top']}>
      <ScrollView
        contentContainerStyle={{ padding: 20, gap: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor="#818cf8" />}
      >
        <FadeInView>
          <View className="mb-1">
            <Text className="text-text-primary text-2xl font-extrabold">Analytics</Text>
            <Text className="text-text-secondary text-xs">Mood trends calculated from your journal entries</Text>
          </View>
        </FadeInView>

        {error ? <ErrorBanner message={error} /> : null}

        {!error && loading ? (
          <View className="gap-3">
            <SkeletonBlock className="h-24" />
            <SkeletonBlock className="h-40" />
          </View>
        ) : null}

        {!error && !loading && (
          <FadeInView>
            <View className="gap-4">
              <View className="flex-row flex-wrap gap-3">
                <MetricCard
                  icon={<Smile size={22} color={totalEntries > 0 ? ANALYTICS_MOOD_META[dominantMood].text : '#64748b'} />}
                  label="Dominant Mood"
                  value={totalEntries > 0 ? `${dominantMood} ${ANALYTICS_MOOD_META[dominantMood].emoji}` : 'No data yet'}
                  color={totalEntries > 0 ? ANALYTICS_MOOD_META[dominantMood].text : '#64748b'}
                />
                <MetricCard icon={<TrendingUp size={22} color="#38bdf8" />} label="Positivity Rate" value={`${positivityRate}%`} color="#38bdf8" />
                <MetricCard icon={<Flame size={22} color="#fde047" />} label="Total Entries" value={String(totalEntries)} color="#fde047" />
                <MetricCard icon={<Award size={22} color="#c084fc" />} label="AI Level" value={getAiLevel(totalEntries)} color="#c084fc" />
              </View>

              {totalEntries === 0 ? (
                <EmptyState
                  title="No Data to Analyze Yet"
                  message="Write a few journal entries and your real mood trends and emotional balance will appear here."
                />
              ) : (
                <>
                  <GlassPanel className="p-5">
                    <Text className="text-text-primary text-base font-bold mb-4">Mood Frequency Breakdown</Text>
                    <View className="gap-3">
                      {moodBreakdown.map((m) => (
                        <View key={m} className="gap-1">
                          <View className="flex-row items-center justify-between">
                            <Text className="text-text-secondary text-xs">
                              {ANALYTICS_MOOD_META[m].emoji} {m.charAt(0) + m.slice(1).toLowerCase()}
                            </Text>
                            <Text className="text-text-primary text-xs font-semibold">{moodCounts[m]}</Text>
                          </View>
                          <View className="h-2 rounded-full bg-white/5 overflow-hidden">
                            <View
                              style={{
                                width: `${(moodCounts[m] / maxBreakdownCount) * 100}%`,
                                backgroundColor: ANALYTICS_MOOD_META[m].text,
                              }}
                              className="h-full rounded-full"
                            />
                          </View>
                        </View>
                      ))}
                    </View>
                  </GlassPanel>

                  <GlassPanel className="p-5">
                    <Text className="text-text-primary text-base font-bold mb-4">Last 7 Days</Text>
                    <View className="flex-row items-end justify-between h-[100px]">
                      {DAY_LABELS.map((label, idx) => (
                        <View key={label} className="items-center gap-2 flex-1">
                          <View
                            style={{ height: Math.max(4, (trendCounts[idx] / maxTrendCount) * 72) }}
                            className="w-4 rounded-full bg-accent-indigo"
                          />
                          <Text className="text-text-muted text-[10px]">{label}</Text>
                        </View>
                      ))}
                    </View>
                  </GlassPanel>

                  {insights && (
                    <GlassPanel className="p-5">
                      <Text className="text-text-primary text-base font-bold mb-4">Deeper Insights</Text>
                      <View className="flex-row flex-wrap gap-3 mb-4">
                        <View className="items-center flex-1 min-w-[45%]">
                          <Flame size={20} color="#fde047" />
                          <Text className="text-text-secondary text-xs mt-1 mb-1">Longest Streak</Text>
                          <Text className="text-sm font-extrabold" style={{ color: '#fde047' }}>
                            {insights.longestStreakDays} Days
                          </Text>
                        </View>
                        <View className="items-center flex-1 min-w-[45%]">
                          <PenLine size={20} color="#38bdf8" />
                          <Text className="text-text-secondary text-xs mt-1 mb-1">Writing Frequency</Text>
                          <Text className="text-sm font-extrabold" style={{ color: '#38bdf8' }}>
                            {insights.writingFrequency}
                          </Text>
                        </View>
                        <View className="items-center flex-1 min-w-[45%]">
                          <CalendarDays size={20} color="#4ade80" />
                          <Text className="text-text-secondary text-xs mt-1 mb-1">
                            Most Productive Day{insights.mostProductiveDays.length !== 1 ? 's' : ''}
                          </Text>
                          <Text className="text-sm font-extrabold text-center" style={{ color: '#4ade80' }}>
                            {insights.mostProductiveDays.length > 0 ? insights.mostProductiveDays.join(', ') : 'N/A'}
                          </Text>
                        </View>
                      </View>
                      {insights.topTopics.length > 0 && (
                        <View>
                          <View className="flex-row items-center gap-1 mb-2">
                            <Hash size={12} color="#94a3b8" />
                            <Text className="text-text-secondary text-xs">Top Topics</Text>
                          </View>
                          <View className="flex-row flex-wrap gap-2">
                            {insights.topTopics.map((topic) => (
                              <View key={topic} className="bg-accent-indigo/15 border border-accent-indigo/35 py-1 px-3 rounded-full">
                                <Text className="text-xs text-accent-indigo">{topic}</Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      )}
                    </GlassPanel>
                  )}
                </>
              )}
            </View>
          </FadeInView>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function MetricCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <GlassPanel className="p-4 items-center flex-1 min-w-[45%]">
      {icon}
      <Text className="text-text-secondary text-xs mt-2 mb-1">{label}</Text>
      <Text className="text-base font-extrabold" style={{ color }}>
        {value}
      </Text>
    </GlassPanel>
  );
}
