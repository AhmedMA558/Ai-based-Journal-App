import api from './api';
import type { MoodDetectionResult } from '@/types';

// Only detectMood is ported this phase - JournalEditorScreen is the one screen
// in this slice that needs it. The other 6 aiService.js functions (summarize,
// rephrase, grammar, chat, tags, recommendations) arrive with the later-phase
// screens that use them (AI Chat, richer editor toolbar), per the Phase 11 plan.
export const aiService = {
  async detectMood(content: string): Promise<MoodDetectionResult | null> {
    const res = await api.post('/api/v1/ai/mood', { content });
    return res?.data?.data ?? null;
  },
};
