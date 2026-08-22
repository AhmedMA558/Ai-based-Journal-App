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

// Called on logout - without this, switching accounts on the same device
// would leave "AI Pioneer" showing already-unlocked for the next user who
// logs in, since this flag is a bare module-level variable, not per-session
// React state that gets reset by unmounting.
export function resetAiUsageTracking() {
  aiUsedThisSession = false;
}
