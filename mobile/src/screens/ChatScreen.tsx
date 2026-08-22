import { useRef, useState } from 'react';
import { View, Text, FlatList, Pressable, ScrollView, Alert } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import { Send, User, Bot, Copy, Check, Trash2 } from 'lucide-react-native';
import { GlassInput } from '@/components/ui/GlassInput';
import { aiService } from '@/services';
import { markAiUsed } from '@/lib/achievementTracking';

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
}

const PRESET_PROMPTS = [
  'Suggest 3 daily journal prompts for mindfulness',
  'Help me process feelings of stress & workload',
  'How can I build a consistent daily writing habit?',
];

const INIT_MESSAGE: ChatMessage = {
  id: 'init-1',
  sender: 'ai',
  text: 'Hello! I am your personal AI Journal Companion. How can I assist your mental wellness, reflection, or writing today?',
};

export default function ChatScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([INIT_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const listRef = useRef<FlatList>(null);

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    // Real conversation history, not just the current message - same
    // reasoning as web's AIChatView.tsx: without it, a real LLM provider
    // has no memory of what was already said. The synthetic init/reset
    // greeting is excluded (UI copy, not something the model actually
    // said), capped to the most recent turns.
    const history = messages
      .filter((m) => !m.id.startsWith('init-') && !m.id.startsWith('reset-'))
      .slice(-10)
      .map((m) => ({ role: (m.sender === 'user' ? 'user' : 'assistant') as 'user' | 'assistant', content: m.text }));

    const userMsg: ChatMessage = { id: `user-${Date.now()}`, sender: 'user', text: query };
    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const reply = await aiService.chat(query, history);
      markAiUsed();
      setMessages((prev) => [
        ...prev,
        { id: `ai-${Date.now()}`, sender: 'ai', text: reply || 'I am here to support your journaling journey.' },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: `ai-err-${Date.now()}`, sender: 'ai', text: 'Sorry, I encountered an issue generating a response. Please try again.' },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const handleCopy = async (text: string, id: string) => {
    await Clipboard.setStringAsync(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClear = () => {
    Alert.alert('Clear AI conversation history?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => setMessages([{ id: `reset-${Date.now()}`, sender: 'ai', text: 'Chat history reset. How can I help you today?' }]),
      },
    ]);
  };

  return (
    <KeyboardAvoidingView className="flex-1 bg-bg-primary" behavior="padding">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="flex-row items-center justify-between px-5 pt-3 pb-2">
          <View>
            <Text className="text-text-primary text-xl font-extrabold">AI Companion</Text>
            <Text className="text-text-secondary text-xs">Writing & wellness chat</Text>
          </View>
          <Pressable onPress={handleClear} className="p-2 rounded-full bg-white/5 border border-white/10">
            <Trash2 size={16} color="#f87171" />
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2" contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
          {PRESET_PROMPTS.map((p) => (
            <Pressable key={p} onPress={() => handleSend(p)} className="bg-white/5 border border-white/10 rounded-xl py-2 px-3">
              <Text className="text-text-secondary text-xs">{p}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: 20, gap: 12 }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          ListFooterComponent={
            loading ? (
              <View className="flex-row items-center gap-2">
                <View className="w-8 h-8 rounded-xl items-center justify-center overflow-hidden">
                  <LinearGradient colors={['#6366f1', '#a855f7']} style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}>
                    <Bot size={16} color="#ffffff" />
                  </LinearGradient>
                </View>
                <View className="bg-white/5 py-2 px-4 rounded-2xl">
                  <Text className="text-text-secondary text-sm">AI is thinking...</Text>
                </View>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <View className={item.sender === 'user' ? 'flex-row justify-end items-end gap-2' : 'flex-row items-end gap-2'}>
              {item.sender === 'ai' && (
                <View className="w-8 h-8 rounded-xl overflow-hidden">
                  <LinearGradient colors={['#6366f1', '#a855f7']} style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}>
                    <Bot size={16} color="#ffffff" />
                  </LinearGradient>
                </View>
              )}

              <View className="max-w-[78%]">
                <View
                  className={
                    item.sender === 'user'
                      ? 'bg-accent-indigo rounded-2xl rounded-br-md py-3 px-4'
                      : 'bg-white/5 border border-white/10 rounded-2xl rounded-bl-md py-3 px-4'
                  }
                >
                  <Text className="text-white text-[15px] leading-5">{item.text}</Text>
                </View>
                {item.sender === 'ai' && (
                  <Pressable onPress={() => handleCopy(item.text, item.id)} className="mt-1 self-start p-1">
                    {copiedId === item.id ? <Check size={13} color="#4ade80" /> : <Copy size={13} color="#64748b" />}
                  </Pressable>
                )}
              </View>

              {item.sender === 'user' && (
                <View className="w-8 h-8 rounded-xl bg-white/10 items-center justify-center">
                  <User size={16} color="#cbd5e1" />
                </View>
              )}
            </View>
          )}
        />

        <View className="flex-row items-center gap-3 px-5 pb-4 pt-2">
          <GlassInput
            className="flex-1"
            placeholder="Ask AI for advice, journaling prompts..."
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => handleSend()}
            returnKeyType="send"
          />
          <Pressable
            onPress={() => handleSend()}
            disabled={loading || !input.trim()}
            className="w-11 h-11 rounded-2xl items-center justify-center overflow-hidden opacity-100"
            style={{ opacity: loading || !input.trim() ? 0.5 : 1 }}
          >
            <LinearGradient colors={['#6366f1', '#a855f7']} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
              <Send size={18} color="#ffffff" />
            </LinearGradient>
          </Pressable>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
