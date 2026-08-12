// In-memory, session-only flag for whether the user has actually gotten a
// reply from AIChatView - used by the "AI Pioneer" achievement badge so it
// reflects real usage instead of being hardcoded true.
let aiUsedThisSession = false;

export function markAiUsed() {
  aiUsedThisSession = true;
}

export function hasUsedAi(): boolean {
  return aiUsedThisSession;
}
