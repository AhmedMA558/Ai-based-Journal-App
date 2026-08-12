import api from './api';
import type { MoodDetectionResult } from '@/types';

// detectMood and chat are ported this phase - JournalEditorScreen needs the
// former, ChatScreen the latter. summarize/rephrase/grammar/tags arrive with
// the richer editor toolbar in a later phase.
export const aiService = {
  async detectMood(content: string): Promise<MoodDetectionResult | null> {
    const res = await api.post('/api/v1/ai/mood', { content });
    return res?.data?.data ?? null;
  },

  // The /chat endpoint wraps a plain String via ApiResponse.success(message,
  // answer), so `data` IS the answer string directly - not an object with a
  // .response field (same gotcha noted in the web app's JournalEditor.tsx).
  async chat(query: string): Promise<string> {
    const res = await api.post('/api/v1/ai/chat', { query });
    return typeof res?.data?.data === 'string' ? res.data.data : '';
  },
};
