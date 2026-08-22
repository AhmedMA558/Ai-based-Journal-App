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

// Called on logout - without this, a module-level flag set by User A
// survives across a login/logout/different-login cycle in the same tab
// (App.jsx never unmounts), so User B would see "AI Pioneer" already
// unlocked despite never having used AI chat.
export function resetAiUsageTracking() {
  aiUsedThisSession = false;
}
