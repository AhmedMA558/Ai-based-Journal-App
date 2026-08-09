export interface StreakResult {
  current: number;
  longest: number;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function daysBetween(a: Date, b: Date): number {
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  return Math.round((startOfDay(a).getTime() - startOfDay(b).getTime()) / MS_PER_DAY);
}

// Consecutive-day journaling streak, derived from each journal's createdAt.
// `current` counts backward from today (allowing today OR yesterday as the
// anchor, so the streak doesn't zero out mid-day before today's entry is
// written). `longest` is the longest run of consecutive calendar days ever.
export function calculateStreak(journals: { createdAt?: string }[]): StreakResult {
  const uniqueDays = new Map<string, Date>();
  for (const journal of journals) {
    if (!journal.createdAt) continue;
    const parsed = new Date(journal.createdAt);
    if (Number.isNaN(parsed.getTime())) continue;
    const day = startOfDay(parsed);
    uniqueDays.set(day.toISOString(), day);
  }

  const sortedDays = Array.from(uniqueDays.values()).sort((a, b) => a.getTime() - b.getTime());
  if (sortedDays.length === 0) return { current: 0, longest: 0 };

  let longest = 1;
  let run = 1;
  for (let i = 1; i < sortedDays.length; i++) {
    run = daysBetween(sortedDays[i], sortedDays[i - 1]) === 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
  }

  const mostRecent = sortedDays[sortedDays.length - 1];
  const gapFromToday = daysBetween(startOfDay(new Date()), mostRecent);
  if (gapFromToday > 1) {
    return { current: 0, longest };
  }

  let current = 1;
  for (let i = sortedDays.length - 1; i > 0; i--) {
    if (daysBetween(sortedDays[i], sortedDays[i - 1]) === 1) {
      current += 1;
    } else {
      break;
    }
  }

  return { current, longest };
}

export function getAiLevel(totalEntries: number): string {
  if (totalEntries >= 25) return 'Master Journaler';
  if (totalEntries >= 10) return 'Dedicated Journaler';
  if (totalEntries >= 3) return 'Consistent Journaler';
  return 'New Journaler';
}
