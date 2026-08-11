import { View, Text, Pressable } from 'react-native';
import { MOODS, MOOD_META, type Mood } from '@/lib/moods';

interface MoodWheelProps {
  selectedMood: Mood | null;
  onSelectMood: (mood: Mood, emoji: string) => void;
}

// RN port of MoodWheel.tsx - a wrapping row of mood chips instead of a CSS grid
// (RN has no auto-fit/minmax grid), same selected-state visual language.
export default function MoodWheel({ selectedMood, onSelectMood }: MoodWheelProps) {
  return (
    <View className="gap-2">
      <Text className="text-text-secondary text-xs font-semibold">Select Active Mood Aura</Text>
      <View className="flex-row flex-wrap gap-[10px]">
        {MOODS.map((key) => {
          const m = MOOD_META[key];
          const isSelected = selectedMood === m.key;
          return (
            <Pressable
              key={m.key}
              onPress={() => onSelectMood(m.key, m.emoji)}
              className="items-center justify-center gap-1 py-[10px] px-3 rounded-2xl min-w-[92px]"
              style={{
                backgroundColor: isSelected ? m.bg : 'rgba(255,255,255,0.03)',
                borderWidth: isSelected ? 2 : 1,
                borderColor: isSelected ? m.text : 'rgba(255,255,255,0.08)',
              }}
            >
              <Text className="text-2xl">{m.emoji}</Text>
              <Text style={{ color: isSelected ? m.text : '#94a3b8', fontWeight: isSelected ? '700' : '500' }} className="text-xs">
                {m.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
