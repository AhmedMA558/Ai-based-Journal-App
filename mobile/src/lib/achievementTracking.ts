// In-memory, session-only flag for whether the user has actually gotten a
// reply from the AI Chat screen - used by the "AI Pioneer" achievement badge
// so it reflects real usage instead of being hardcoded true (the bug this
// mobile port deliberately avoids - see AchievementsScreen.tsx).
let aiUsedThisSession = false;

export function markAiUsed() {
  aiUsedThisSession = true;
}

export function hasUsedAi(): boolean {
  return aiUsedThisSession;
}
