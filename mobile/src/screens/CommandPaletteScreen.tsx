import { useMemo, useState, type ReactNode } from 'react';
import { View, Text, Pressable, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Command,
  Search as SearchIcon,
  Plus,
  Sparkles,
  BookOpen,
  LayoutDashboard,
  CalendarDays,
  BarChart3,
  Settings as SettingsIcon,
  Award,
  Bell,
  X,
} from 'lucide-react-native';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { GlassInput } from '@/components/ui/GlassInput';
import { FadeInView } from '@/components/ui/FadeInView';
import type { MainStackParamList, MainTabParamList } from '@/navigation/types';

type NavProp = NativeStackNavigationProp<MainStackParamList>;

interface CommandAction {
  id: string;
  label: string;
  category: string;
  icon: ReactNode;
  target: { tab: keyof MainTabParamList } | { screen: 'JournalEditor' | 'Achievements' | 'Notifications' };
}

// Mobile port of frontend/src/components/CommandPalette.tsx's action list, minus
// the two actions that don't apply here: voice dictation (never built for
// Mindora - see the Phase 11 deferral list) and light/dark theme toggle
// (app.json pins userInterfaceStyle to dark, there's no toggle to fire).
// Keyboard shortcuts/arrow-key navigation are dropped too - this is a touch
// UI, tapping a row is the only way to select one.
const ACTIONS: CommandAction[] = [
  { id: 'new-journal', label: 'Create New Journal Entry', category: 'Actions', icon: <Plus size={18} color="#818cf8" />, target: { screen: 'JournalEditor' } },
  { id: 'ai-chat', label: 'Open AI Conversational Assistant', category: 'AI Tools', icon: <Sparkles size={18} color="#c084fc" />, target: { tab: 'Chat' } },
  { id: 'dashboard', label: 'Go to Dashboard', category: 'Navigation', icon: <LayoutDashboard size={18} color="#818cf8" />, target: { tab: 'Dashboard' } },
  { id: 'journals', label: 'View All Journal Entries', category: 'Navigation', icon: <BookOpen size={18} color="#38bdf8" />, target: { tab: 'Journals' } },
  { id: 'calendar', label: 'Open Mood Calendar', category: 'Navigation', icon: <CalendarDays size={18} color="#fde047" />, target: { tab: 'Calendar' } },
  { id: 'search', label: 'Deep Search', category: 'Navigation', icon: <SearchIcon size={18} color="#fb7185" />, target: { tab: 'Search' } },
  { id: 'analytics', label: 'View Data Analytics', category: 'Navigation', icon: <BarChart3 size={18} color="#4ade80" />, target: { tab: 'Analytics' } },
  { id: 'settings', label: 'Open Settings', category: 'Navigation', icon: <SettingsIcon size={18} color="#94a3b8" />, target: { tab: 'Settings' } },
  { id: 'achievements', label: 'View Achievements', category: 'Navigation', icon: <Award size={18} color="#fde047" />, target: { screen: 'Achievements' } },
  { id: 'notifications', label: 'View Notifications', category: 'Navigation', icon: <Bell size={18} color="#818cf8" />, target: { screen: 'Notifications' } },
];

export default function CommandPaletteScreen() {
  const navigation = useNavigation<NavProp>();
  const [query, setQuery] = useState('');

  const filteredActions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ACTIONS;
    return ACTIONS.filter(
      (act) => act.label.toLowerCase().includes(q) || act.category.toLowerCase().includes(q)
    );
  }, [query]);

  const handleExecute = (action: CommandAction) => {
    navigation.goBack();
    if ('tab' in action.target) {
      navigation.navigate('Tabs', { screen: action.target.tab });
    } else {
      navigation.navigate(action.target.screen, undefined);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-bg-primary" edges={['top']}>
      <View className="flex-row items-center justify-between px-5 pt-3 pb-2">
        <View className="flex-row items-center gap-3">
          <View className="p-2 rounded-xl bg-[rgba(99,102,241,0.15)]">
            <Command size={20} color="#818cf8" />
          </View>
          <View>
            <Text className="text-text-primary text-lg font-extrabold">Command Palette</Text>
            <Text className="text-text-muted text-xs">Jump anywhere, instantly</Text>
          </View>
        </View>
        <Pressable onPress={() => navigation.goBack()} className="p-2 rounded-full bg-white/5 border border-white/10">
          <X size={18} color="#94a3b8" />
        </Pressable>
      </View>

      <View className="px-5 mb-2">
        <FadeInView>
          <GlassPanel className="p-3">
            <View className="flex-row items-center">
              <SearchIcon size={18} color="#818cf8" />
              <GlassInput
                className="flex-1 ml-2 bg-transparent border-0 px-1"
                placeholder="Type a command or search actions..."
                autoFocus
                value={query}
                onChangeText={setQuery}
              />
            </View>
          </GlassPanel>
        </FadeInView>
      </View>

      {filteredActions.length === 0 ? (
        <View className="px-5 py-8 items-center">
          <Text className="text-text-muted text-sm">No commands matching "{query}"</Text>
        </View>
      ) : (
        <FlatList
          data={filteredActions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 20, paddingTop: 4, gap: 10 }}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <Pressable onPress={() => handleExecute(item)}>
              <GlassPanel className="p-4 flex-row items-center gap-3">
                <View className="p-2 rounded-xl bg-white/[0.06]">{item.icon}</View>
                <View className="flex-1">
                  <Text className="text-text-primary text-sm font-semibold">{item.label}</Text>
                  <Text className="text-text-muted text-xs">{item.category}</Text>
                </View>
              </GlassPanel>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}
