import { useEffect, useState } from 'react';
import { View, Text, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { X, Save, Sparkles, CheckCircle2 } from 'lucide-react-native';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { GlassInput } from '@/components/ui/GlassInput';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ConfettiBurst } from '@/components/ui/ConfettiBurst';
import { ErrorBanner } from '@/components/ErrorBanner';
import MoodWheel from '@/components/MoodWheel';
import { MOOD_META, type Mood } from '@/lib/moods';
import { journalService, aiService } from '@/services';
import type { MainStackParamList } from '@/navigation/types';
import type { JournalRef } from '@/types';

type RouteProps = { params?: { journal?: JournalRef } };

// Standardize free-form/AI-returned mood text into a known mood key - same
// normalization JournalEditor.tsx applies on the web.
function normalizeMood(rawMood?: string): Mood {
  if (!rawMood) return 'HAPPY';
  const m = rawMood.toUpperCase();
  if (m.includes('ANGRY') || m.includes('MAD') || m.includes('RAGE')) return 'ANGRY';
  if (m.includes('EXCITE')) return 'EXCITED';
  if (m.includes('HAPP') || m.includes('JOY')) return 'HAPPY';
  if (m.includes('RELAX') || m.includes('CALM')) return 'RELAXED';
  if (m.includes('STRESS') || m.includes('ANXIO')) return 'STRESSED';
  if (m.includes('SAD') || m.includes('DEPR')) return 'SAD';
  if (m.includes('GRATE') || m.includes('THANK')) return 'GRATEFUL';
  return 'HAPPY';
}

// Instant keystroke mood evaluator (0ms latency) - identical keyword set to
// JournalEditor.tsx's client-side heuristic.
function evaluateInstantMood(text: string): { mood: Mood; emoji: string } {
  const txt = text.toLowerCase();
  if (!txt.trim()) return { mood: 'HAPPY', emoji: '😊' };
  if (/angry|mad|rage|furious|hate|annoyed|irritated|outraged/.test(txt)) return { mood: 'ANGRY', emoji: '😠' };
  if (/stress|overwhelm|frustrat|tired|exhaust|anxio|busy|workload/.test(txt)) return { mood: 'STRESSED', emoji: '😰' };
  if (/sad|lonely|hurt|ruin|bad|cry|depress|upset|worst/.test(txt)) return { mood: 'SAD', emoji: '🥺' };
  if (/thank|grate|bless|apprec/.test(txt)) return { mood: 'GRATEFUL', emoji: '🙏' };
  if (/relax|calm|peace|cozy|tea|lake|spa/.test(txt)) return { mood: 'RELAXED', emoji: '😌' };
  if (/excit|hype|thrill|win|launch|trip|concert/.test(txt)) return { mood: 'EXCITED', emoji: '🤩' };
  return { mood: 'HAPPY', emoji: '😊' };
}

export default function JournalEditorScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const route = useRoute();
  const initialData = (route.params as RouteProps['params'])?.journal;

  const [title, setTitle] = useState(initialData?.title || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [mood, setMood] = useState<Mood>(normalizeMood(initialData?.mood));
  const [emoji, setEmoji] = useState(MOOD_META[normalizeMood(initialData?.mood)].emoji);
  const [tags, setTags] = useState<string[]>(initialData?.tags || ['reflection', 'journal']);
  const [tagInput, setTagInput] = useState('');
  const [isManualOverride, setIsManualOverride] = useState(false);
  const [detectingMood, setDetectingMood] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);

  const handleContentChange = (val: string) => {
    setContent(val);
    if (!isManualOverride && val.trim().length >= 2) {
      const instant = evaluateInstantMood(val);
      setMood(instant.mood);
      setEmoji(instant.emoji);
    }
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

  // Asynchronous AI mood sync (250ms debounce) - same timing as JournalEditor.tsx.
  useEffect(() => {
    if (!content.trim() || content.trim().length < 3 || isManualOverride) return;
    const timer = setTimeout(async () => {
      setDetectingMood(true);
      try {
        const res = await aiService.detectMood(content);
        if (res?.primaryMood) {
          const detectedKey = normalizeMood(res.primaryMood);
          setMood(detectedKey);
          setEmoji(res.emoji || MOOD_META[detectedKey].emoji);
          // Same celebratory trigger as JournalEditor.tsx's mood-detection
          // confetti on the web app - HAPPY/EXCITED only, nothing on save
          // or achievement-unlock (the web app doesn't do that either).
          if (detectedKey === 'HAPPY' || detectedKey === 'EXCITED') {
            setShowConfetti(true);
          }
        }
      } catch {
        // AI error fallback - keep the instant-heuristic mood already set.
      } finally {
        setDetectingMood(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [content, isManualOverride]);

  const handleAddTag = () => {
    const clean = tagInput.trim().replace('#', '');
    if (clean && !tags.includes(clean)) {
      setTags((prev) => [...prev, clean]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tag: string) => setTags((prev) => prev.filter((t) => t !== tag));

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      setError('Title and Content are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = { title, content, mood, tags };
      if (initialData?.id) {
        await journalService.updateJournal(initialData.id, payload);
      } else {
        await journalService.createJournal(payload);
      }
      navigation.goBack();
    } catch (err: any) {
      setError(err?.message || 'Failed to save journal entry.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView className="flex-1 bg-bg-primary" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {showConfetti ? <ConfettiBurst onEnd={() => setShowConfetti(false)} /> : null}
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="flex-row items-center justify-between px-5 pt-3 pb-2">
          <Text className="text-text-primary text-xl font-extrabold">{initialData ? 'Edit Entry' : 'New Entry'}</Text>
          <Pressable onPress={() => navigation.goBack()} className="p-2 rounded-full bg-white/5 border border-white/10">
            <X size={18} color="#94a3b8" />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
          {error ? <ErrorBanner message={error} /> : null}

          <View>
            <Text className="text-[#cbd5e1] text-sm font-semibold mb-2">Title</Text>
            <GlassInput placeholder="e.g. Completing the redesign" value={title} onChangeText={setTitle} className="font-bold text-base" />
          </View>

          <View>
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-[#cbd5e1] text-sm font-semibold">Content</Text>
              <Text className="text-text-muted text-xs">
                {wordCount} words · {charCount} chars
              </Text>
            </View>
            <GlassInput
              placeholder="Write your thoughts, feelings, or daily experience..."
              value={content}
              onChangeText={handleContentChange}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
              className="min-h-[160px] leading-6"
            />
          </View>

          <GlassPanel className="p-4">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center gap-2 flex-1">
                <Sparkles size={16} color="#818cf8" />
                <Text className="text-white text-sm font-bold">
                  Mood: <Text style={{ color: mood === 'ANGRY' ? '#ef4444' : '#4ade80' }}>{mood} {emoji}</Text>
                </Text>
              </View>
              {isManualOverride ? (
                <Text className="text-[#fde047] text-xs font-semibold bg-[rgba(253,224,71,0.15)] py-1 px-2 rounded-lg">Manual</Text>
              ) : (
                <View className="flex-row items-center gap-1 bg-[rgba(74,222,128,0.15)] py-1 px-2 rounded-lg">
                  <CheckCircle2 size={11} color="#4ade80" />
                  <Text className="text-[#4ade80] text-xs font-semibold">{detectingMood ? 'Analyzing...' : 'AI Active'}</Text>
                </View>
              )}
            </View>
            <MoodWheel
              selectedMood={mood}
              onSelectMood={(m, e) => {
                setMood(m);
                setEmoji(e);
                setIsManualOverride(true);
              }}
            />
          </GlassPanel>

          <View>
            <Text className="text-[#cbd5e1] text-sm font-semibold mb-2">Tags</Text>
            <View className="flex-row flex-wrap gap-2 mb-3">
              {tags.map((tag) => (
                <Pressable
                  key={tag}
                  onPress={() => handleRemoveTag(tag)}
                  className="flex-row items-center gap-1 bg-[rgba(168,85,247,0.18)] border border-[rgba(168,85,247,0.35)] rounded-xl py-1 px-2"
                >
                  <Text className="text-[#c084fc] text-xs font-semibold">#{tag}</Text>
                  <X size={12} color="#c084fc" />
                </Pressable>
              ))}
            </View>
            <GlassInput
              placeholder="Add tag and hit enter..."
              value={tagInput}
              onChangeText={setTagInput}
              onSubmitEditing={handleAddTag}
              returnKeyType="done"
            />
          </View>

          <PrimaryButton
            title={saving ? 'Saving...' : 'Save Entry'}
            onPress={handleSave}
            loading={saving}
            icon={<Save size={18} color="#ffffff" />}
          />
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
