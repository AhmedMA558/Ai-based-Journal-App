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
const CHAT_DELAY_MS = 600;

// Small canned-response pool keyed by keyword, falling back to a rotating set
// of generic reflective prompts - not a real model, just realistic-looking
// output so the chat UI/flow can be validated without a live AI service.
const CHAT_KEYWORD_RESPONSES: [RegExp, string][] = [
  [/stress|overwhelm|busy|workload/i, "It sounds like things feel like a lot right now. Try naming three things currently within your control, and set the rest aside for a moment."],
  [/grate|thank|apprec/i, "That's a lovely thing to reflect on. Gratitude tends to compound - what's one small thing from today you'd want to remember a year from now?"],
  [/sad|lonely|hurt|depress/i, "That sounds heavy. Be gentle with yourself today - even acknowledging it in writing is a real step."],
  [/angry|mad|frustrat/i, "That frustration makes sense. Sometimes writing out exactly what triggered it - without editing yourself - helps it lose some of its charge."],
  [/excit|happy|great|win/i, "That's wonderful to hear! Capturing what made this moment good can help you recognize the pattern next time."],
];
const CHAT_DEFAULT_RESPONSES = [
  'Tell me more about what\'s on your mind - I\'m here to help you reflect.',
  'That\'s worth sitting with for a moment. What feeling comes up strongest when you think about it?',
  'Consider writing a few sentences about this in today\'s journal entry - sometimes putting it into words changes how it feels.',
];
let defaultResponseIndex = 0;

function keywordChatReply(query: string): string {
  for (const [pattern, response] of CHAT_KEYWORD_RESPONSES) {
    if (pattern.test(query)) return response;
  }
  const reply = CHAT_DEFAULT_RESPONSES[defaultResponseIndex % CHAT_DEFAULT_RESPONSES.length];
  defaultResponseIndex += 1;
  return reply;
}

export const mockAiService = {
  async detectMood(content: string): Promise<MoodDetectionResult | null> {
    if (!content.trim()) return null;
    const mood = keywordMood(content);
    return new Promise((resolve) =>
      setTimeout(() => resolve({ primaryMood: mood, emoji: MOOD_META[mood].emoji }), ARTIFICIAL_DELAY_MS)
    );
  },

  async chat(query: string): Promise<string> {
    const reply = keywordChatReply(query);
    return new Promise((resolve) => setTimeout(() => resolve(reply), CHAT_DELAY_MS));
  },
};
