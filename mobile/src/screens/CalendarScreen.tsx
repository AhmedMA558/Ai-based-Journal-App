import { useCallback, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { SkeletonBlock } from '@/components/ui/SkeletonBlock';
import { ErrorBanner } from '@/components/ErrorBanner';
import { FadeInView } from '@/components/ui/FadeInView';
import { cn } from '@/lib/utils';
import { MOOD_META, type Mood } from '@/lib/moods';
import { journalService } from '@/services';
import type { MainStackParamList } from '@/navigation/types';
import type { Journal } from '@/types';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function moodEmoji(mood?: string): string {
  return MOOD_META[(mood || '').toUpperCase() as Mood]?.emoji || '😐';
}

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function CalendarScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const [journals, setJournals] = useState<Journal[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const list = await journalService.getAllJournals();
      setJournals(Array.isArray(list) ? list : []);
    } catch {
      setError('Could not load your calendar. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayIndex; i++) cells.push(null);
  for (let i = 1; i <= daysInMonth; i++) cells.push(i);

  const journalMap: Record<string, Journal> = {};
  journals.forEach((j) => {
    if (j.createdAt) {
      journalMap[dateKey(new Date(j.createdAt))] = j;
    }
  });

  return (
    <SafeAreaView className="flex-1 bg-bg-primary" edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <FadeInView>
          <View className="mb-5">
            <Text className="text-text-primary text-2xl font-extrabold">Mood Calendar</Text>
            <Text className="text-text-secondary text-xs">Visual emotional tracking across the month</Text>
          </View>

          <View className="flex-row items-center justify-center gap-4 mb-5">
            <Pressable
              onPress={() => setCurrentDate(new Date(year, month - 1, 1))}
              className="p-2 rounded-xl bg-white/5 border border-white/10"
            >
              <ChevronLeft size={18} color="#f8fafc" />
            </Pressable>
            <Text className="text-text-primary text-base font-bold min-w-[140px] text-center">
              {MONTH_NAMES[month]} {year}
            </Text>
            <Pressable
              onPress={() => setCurrentDate(new Date(year, month + 1, 1))}
              className="p-2 rounded-xl bg-white/5 border border-white/10"
            >
              <ChevronRight size={18} color="#f8fafc" />
            </Pressable>
          </View>

          {error ? <ErrorBanner message={error} /> : null}

          {!error && loading ? <SkeletonBlock className="h-[360px]" /> : null}

          {!error && !loading ? (
            <GlassPanel className="p-4">
              <View className="flex-row mb-2">
                {WEEKDAY_LABELS.map((d) => (
                  <Text key={d} className="text-text-secondary text-xs font-semibold text-center" style={{ width: `${100 / 7}%` }}>
                    {d}
                  </Text>
                ))}
              </View>
              <View className="flex-row flex-wrap">
                {cells.map((day, idx) => {
                  if (!day) {
                    return <View key={idx} style={{ width: `${100 / 7}%` }} className="h-16 p-1" />;
                  }
                  const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const entry = journalMap[key];
                  return (
                    <View key={idx} style={{ width: `${100 / 7}%` }} className="p-1">
                      <Pressable
                        onPress={() => entry && navigation.navigate('JournalEditor', { journal: entry })}
                        disabled={!entry}
                        className={cn(
                          'h-16 rounded-xl p-1.5 justify-between',
                          entry ? 'bg-accent-indigo/20 border border-accent-indigo/40' : 'bg-white/[0.03] border border-white/5'
                        )}
                      >
                        <Text className={cn('text-xs font-semibold', entry ? 'text-text-primary' : 'text-text-muted')}>{day}</Text>
                        {entry ? <Text className="text-base text-center">{moodEmoji(entry.mood)}</Text> : null}
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            </GlassPanel>
          ) : null}
        </FadeInView>
      </ScrollView>
    </SafeAreaView>
  );
}
