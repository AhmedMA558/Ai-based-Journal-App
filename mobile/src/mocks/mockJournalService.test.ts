import { mockJournals } from './fixtures';

// Fresh module instance per test - mockJournalService keeps its CRUD state in a
// module-level array, so isolation requires resetModules() + a dynamic require
// rather than the static top-level import used elsewhere in this codebase.
function freshService() {
  return require('./mockJournalService').mockJournalService;
}

beforeEach(() => {
  jest.resetModules();
});

describe('mockJournalService', () => {
  it('getAllJournals returns the seeded fixtures sorted newest-first', async () => {
    const service = freshService();
    const list = await service.getAllJournals();
    expect(list).toHaveLength(mockJournals.length);
    for (let i = 1; i < list.length; i++) {
      expect(new Date(list[i - 1].createdAt).getTime()).toBeGreaterThanOrEqual(new Date(list[i].createdAt).getTime());
    }
  });

  it('createJournal adds a new entry that getAllJournals then includes', async () => {
    const service = freshService();
    const created = await service.createJournal({ title: 'New one', content: 'Body text', mood: 'HAPPY', tags: ['a'] });
    expect(created.id).toBeTruthy();
    const list = await service.getAllJournals();
    expect(list).toHaveLength(mockJournals.length + 1);
    expect(list.find((j: any) => j.id === created.id)?.title).toBe('New one');
  });

  it('updateJournal merges fields onto the existing entry', async () => {
    const service = freshService();
    const [first] = await service.getAllJournals();
    const updated = await service.updateJournal(first.id, { title: 'Renamed', content: first.content, mood: first.mood, tags: first.tags });
    expect(updated.title).toBe('Renamed');
    expect(updated.id).toBe(first.id);
  });

  it('updateJournal throws for an unknown id', async () => {
    const service = freshService();
    await expect(service.updateJournal('does-not-exist', { title: 'x', content: 'y', mood: 'HAPPY', tags: [] })).rejects.toThrow(
      'Journal entry not found.'
    );
  });

  it('deleteJournal removes the entry from subsequent getAllJournals calls', async () => {
    const service = freshService();
    const [first] = await service.getAllJournals();
    await service.deleteJournal(first.id);
    const list = await service.getAllJournals();
    expect(list.find((j: any) => j.id === first.id)).toBeUndefined();
    expect(list).toHaveLength(mockJournals.length - 1);
  });
});
