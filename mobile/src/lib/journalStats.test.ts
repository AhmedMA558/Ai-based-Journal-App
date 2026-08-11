import { calculateStreak, getAiLevel } from './journalStats';

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

describe('calculateStreak', () => {
  it('returns zero for an empty journal list', () => {
    expect(calculateStreak([])).toEqual({ current: 0, longest: 0 });
  });

  it('counts a run of consecutive days ending today', () => {
    const journals = [{ createdAt: isoDaysAgo(0) }, { createdAt: isoDaysAgo(1) }, { createdAt: isoDaysAgo(2) }];
    expect(calculateStreak(journals)).toEqual({ current: 3, longest: 3 });
  });

  it('still counts the streak as current when the most recent entry was yesterday', () => {
    const journals = [{ createdAt: isoDaysAgo(1) }, { createdAt: isoDaysAgo(2) }];
    expect(calculateStreak(journals).current).toBe(2);
  });

  it('resets current to zero when there is a gap of more than one day', () => {
    const journals = [{ createdAt: isoDaysAgo(5) }, { createdAt: isoDaysAgo(6) }];
    expect(calculateStreak(journals).current).toBe(0);
    expect(calculateStreak(journals).longest).toBe(2);
  });

  it('ignores entries with a missing or invalid createdAt', () => {
    const journals = [{ createdAt: isoDaysAgo(0) }, { createdAt: undefined }, { createdAt: 'not-a-date' }];
    expect(calculateStreak(journals).current).toBe(1);
  });

  it('finds the longest historical run even if it is not the current one', () => {
    const journals = [
      { createdAt: isoDaysAgo(0) },
      { createdAt: isoDaysAgo(10) },
      { createdAt: isoDaysAgo(11) },
      { createdAt: isoDaysAgo(12) },
      { createdAt: isoDaysAgo(13) },
    ];
    expect(calculateStreak(journals).longest).toBe(4);
    expect(calculateStreak(journals).current).toBe(1);
  });
});

describe('getAiLevel', () => {
  it('returns New Journaler below 3 entries', () => {
    expect(getAiLevel(0)).toBe('New Journaler');
    expect(getAiLevel(2)).toBe('New Journaler');
  });

  it('returns Consistent Journaler from 3 to 9 entries', () => {
    expect(getAiLevel(3)).toBe('Consistent Journaler');
    expect(getAiLevel(9)).toBe('Consistent Journaler');
  });

  it('returns Dedicated Journaler from 10 to 24 entries', () => {
    expect(getAiLevel(10)).toBe('Dedicated Journaler');
    expect(getAiLevel(24)).toBe('Dedicated Journaler');
  });

  it('returns Master Journaler at 25+ entries', () => {
    expect(getAiLevel(25)).toBe('Master Journaler');
    expect(getAiLevel(100)).toBe('Master Journaler');
  });
});
