function fresh() {
  return require('./achievementTracking');
}

beforeEach(() => {
  jest.resetModules();
});

describe('achievementTracking', () => {
  it('starts as not-used', () => {
    const { hasUsedAi } = fresh();
    expect(hasUsedAi()).toBe(false);
  });

  it('flips to used after markAiUsed()', () => {
    const { markAiUsed, hasUsedAi } = fresh();
    markAiUsed();
    expect(hasUsedAi()).toBe(true);
  });

  it('flips back to not-used after resetAiUsageTracking() - the cross-account leak this exists to close', () => {
    const { markAiUsed, resetAiUsageTracking, hasUsedAi } = fresh();
    markAiUsed();
    expect(hasUsedAi()).toBe(true);
    resetAiUsageTracking();
    expect(hasUsedAi()).toBe(false);
  });
});
