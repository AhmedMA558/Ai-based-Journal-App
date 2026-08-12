import { useCallback, useState, type ReactNode } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Award, Flame, Sparkles, Smile, BookOpen, X, CheckCircle2 } from 'lucide-react-native';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { SkeletonBlock } from '@/components/ui/SkeletonBlock';
import { FadeInView } from '@/components/ui/FadeInView';
import { cn } from '@/lib/utils';
import { calculateStreak } from '@/lib/journalStats';
import { hasUsedAi } from '@/lib/achievementTracking';
import { journalService } from '@/services';
import type { Journal } from '@/types';

interface Badge {
  id: number;
  title: string;
  desc: string;
  unlocked: boolean;
  icon: ReactNode;
}

// Same four badges as frontend/src/components/AchievementsModal.tsx, but
// computed from real journal data instead of a hardcoded journalCount=5
// default - App.jsx never actually passes a real journalCount prop to the
// web modal, so 3 of its 4 badges always show "unlocked" there regardless
// of the user's real progress, even for a brand-new account. Also fixes
// "Emotional Master": the web version checks journalCount >= 5, but the
// badge's own description says "5 distinct mood categories" - a different
// condition entirely. This checks the actual distinct-mood count.
export default function AchievementsScreen() {
  const navigation = useNavigation();
  const [journals, setJournals] = useState<Journal[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setLoading(true);
      journalService
        .getAllJournals()
        .then((list) => {
          if (!cancelled) setJournals(Array.isArray(list) ? list : []);
        })
        .catch(() => {
          if (!cancelled) setJournals([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }, [])
  );

  const journalCount = journals.length;
  const streak = calculateStreak(journals);
  const distinctMoods = new Set(journals.map((j) => (j.mood || '').toUpperCase()).filter(Boolean)).size;

  const badges: Badge[] = [
    {
      id: 1,
      title: 'First Reflection 📝',
      desc: 'Logged your first AI-analyzed journal entry',
      unlocked: journalCount >= 1,
      icon: <BookOpen size={22} color="#38bdf8" />,
    },
    {
      id: 2,
      title: '3-Day Streak 🔥',
      desc: 'Maintained a 3-day continuous journaling streak',
      unlocked: streak.current >= 3 || streak.longest >= 3,
      icon: <Flame size={22} color="#fde047" />,
    },
    {
      id: 3,
      title: 'AI Pioneer 🤖',
      desc: 'Used the AI Assistant for reflection insights',
      unlocked: hasUsedAi(),
      icon: <Sparkles size={22} color="#c084fc" />,
    },
    {
      id: 4,
      title: 'Emotional Master 😌',
      desc: 'Recorded journals across 5 distinct mood categories',
      unlocked: distinctMoods >= 5,
      icon: <Smile size={22} color="#4ade80" />,
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-bg-primary" edges={['top']}>
      <View className="flex-row items-center justify-between px-5 pt-3 pb-2">
        <View className="flex-row items-center gap-3">
          <View className="p-2 rounded-xl bg-[rgba(234,179,8,0.15)]">
            <Award size={20} color="#fde047" />
          </View>
          <View>
            <Text className="text-text-primary text-lg font-extrabold">Achievements</Text>
            <Text className="text-text-muted text-xs">Milestones unlocked as you reflect</Text>
          </View>
        </View>
        <Pressable onPress={() => navigation.goBack()} className="p-2 rounded-full bg-white/5 border border-white/10">
          <X size={18} color="#94a3b8" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
        <FadeInView>
          {loading ? (
            <View className="gap-3">
              <SkeletonBlock className="h-24" />
              <SkeletonBlock className="h-24" />
            </View>
          ) : (
            <View className="gap-3">
              {badges.map((b) => (
                <GlassPanel
                  key={b.id}
                  className={cn('p-4 flex-row items-start gap-3', b.unlocked ? '' : 'opacity-50')}
                  style={!b.unlocked ? { backgroundColor: 'rgba(255,255,255,0.03)' } : undefined}
                >
                  <View className="p-2 rounded-xl bg-white/[0.06]">{b.icon}</View>
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2 mb-1">
                      <Text className="text-text-primary text-sm font-bold">{b.title}</Text>
                      {b.unlocked ? <CheckCircle2 size={14} color="#4ade80" /> : null}
                    </View>
                    <Text className="text-text-secondary text-xs leading-4">{b.desc}</Text>
                  </View>
                </GlassPanel>
              ))}
            </View>
          )}
        </FadeInView>
      </ScrollView>
    </SafeAreaView>
  );
}
