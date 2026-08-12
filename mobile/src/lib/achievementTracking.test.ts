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
});
