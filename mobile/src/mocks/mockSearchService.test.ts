import { mockSearchService } from './mockSearchService';
import { mockJournals } from './fixtures';

describe('mockSearchService.search', () => {
  it('returns all fixtures when query and mood are both empty', async () => {
    const results = await mockSearchService.search({});
    expect(results).toHaveLength(mockJournals.length);
  });

  it('matches by title or content substring, case-insensitively', async () => {
    const results = await mockSearchService.search({ query: 'ONBOARDING' });
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((r) => `${r.title} ${r.content}`.toLowerCase().includes('onboarding'))).toBe(true);
  });

  it('returns an empty array for a query that matches nothing', async () => {
    const results = await mockSearchService.search({ query: 'xyznonexistentterm' });
    expect(results).toEqual([]);
  });

  it('filters by mood, ignoring "ALL"', async () => {
    const angry = await mockSearchService.search({ mood: 'ANGRY' });
    expect(angry.length).toBeGreaterThan(0);
    expect(angry.every((r) => r.mood === 'ANGRY')).toBe(true);

    const all = await mockSearchService.search({ mood: 'ALL' });
    expect(all).toHaveLength(mockJournals.length);
  });

  it('combines query and mood filters', async () => {
    const results = await mockSearchService.search({ query: 'weekend', mood: 'HAPPY' });
    expect(results.every((r) => r.mood === 'HAPPY' && `${r.title} ${r.content}`.toLowerCase().includes('weekend'))).toBe(
      true
    );
  });
});
