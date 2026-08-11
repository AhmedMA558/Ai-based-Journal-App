import { MOOD_META, type Mood } from '@/lib/moods';
import type { MoodDetectionResult } from '@/types';

// Same lightweight keyword heuristic JournalEditorScreen's instant client-side
// evaluator already uses, reused here as the mock "server" response so
// detectMood() behaves and looks correct without a live Flask call.
function keywordMood(text: string): Mood {
  const txt = text.toLowerCase();
  if (/angry|mad|rage|furious|hate|annoyed|irritated|outraged/.test(txt)) return 'ANGRY';
  if (/stress|overwhelm|frustrat|tired|exhaust|anxio|busy|workload/.test(txt)) return 'STRESSED';
  if (/sad|lonely|hurt|ruin|bad|cry|depress|upset|worst/.test(txt)) return 'SAD';
  if (/thank|grate|bless|apprec/.test(txt)) return 'GRATEFUL';
  if (/relax|calm|peace|cozy|tea|lake|spa/.test(txt)) return 'RELAXED';
  if (/excit|hype|thrill|win|launch|trip|concert/.test(txt)) return 'EXCITED';
  return 'HAPPY';
}

const ARTIFICIAL_DELAY_MS = 250;

export const mockAiService = {
  async detectMood(content: string): Promise<MoodDetectionResult | null> {
    if (!content.trim()) return null;
    const mood = keywordMood(content);
    return new Promise((resolve) =>
      setTimeout(() => resolve({ primaryMood: mood, emoji: MOOD_META[mood].emoji }), ARTIFICIAL_DELAY_MS)
    );
  },
};
