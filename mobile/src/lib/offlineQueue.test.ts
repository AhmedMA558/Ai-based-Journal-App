import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  applyPendingOps,
  clearOfflineQueue,
  dropQueuedCreate,
  enqueue,
  getPendingCount,
  getQueue,
  isLocalId,
  processQueue,
  updateQueuedCreate,
  type QueuedOp,
} from './offlineQueue';
import { getCachedJournals, setCachedJournals } from './offlineCache';
import type { Journal, JournalInput } from '@/types';

const baseJournal: Journal = {
  id: 1,
  title: 'Existing',
  content: 'Already synced',
  mood: 'HAPPY',
  tags: [],
  createdAt: '2026-01-01T00:00:00.000Z',
};

const newEntry: JournalInput = { title: 'New', content: 'Written offline', mood: 'EXCITED', tags: ['offline'] };

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('isLocalId', () => {
  it('recognizes local- prefixed ids and rejects real server ids', () => {
    expect(isLocalId('local-123-45')).toBe(true);
    expect(isLocalId(42)).toBe(false);
    expect(isLocalId('42')).toBe(false);
  });
});

describe('queue persistence', () => {
  it('starts empty', async () => {
    expect(await getQueue()).toEqual([]);
    expect(await getPendingCount()).toBe(0);
  });

  it('enqueue appends and getPendingCount reflects it', async () => {
    await enqueue({ type: 'create', localId: 'local-1', payload: newEntry, queuedAt: 1 });
    await enqueue({ type: 'delete', id: 2, queuedAt: 2 });
    expect(await getPendingCount()).toBe(2);
  });

  it('clearOfflineQueue drops every pending op', async () => {
    // Regression guard: a logged-out account's still-unsynced offline edits
    // used to survive into the next account's session on the same device -
    // clearOfflineQueue is called from authService.logout() specifically to
    // close that gap, so a reconnect never replays User A's edit under
    // User B's session.
    await enqueue({ type: 'create', localId: 'local-1', payload: newEntry, queuedAt: 1 });
    await enqueue({ type: 'delete', id: 2, queuedAt: 2 });

    await clearOfflineQueue();

    expect(await getQueue()).toEqual([]);
    expect(await getPendingCount()).toBe(0);
  });

  it('updateQueuedCreate folds an edit into the still-pending create, not a separate op', async () => {
    await enqueue({ type: 'create', localId: 'local-1', payload: newEntry, queuedAt: 1 });
    const found = await updateQueuedCreate('local-1', { ...newEntry, title: 'Edited' });
    expect(found).toBe(true);

    const queue = await getQueue();
    expect(queue).toHaveLength(1);
    expect((queue[0] as Extract<QueuedOp, { type: 'create' }>).payload.title).toBe('Edited');
  });

  it('updateQueuedCreate returns false when no matching create is queued', async () => {
    expect(await updateQueuedCreate('local-missing', newEntry)).toBe(false);
  });

  it('dropQueuedCreate removes a never-synced create entirely (create-then-delete-before-sync collapses to nothing)', async () => {
    await enqueue({ type: 'create', localId: 'local-1', payload: newEntry, queuedAt: 1 });
    const dropped = await dropQueuedCreate('local-1');
    expect(dropped).toBe(true);
    expect(await getQueue()).toEqual([]);
  });
});

describe('applyPendingOps', () => {
  it('layers a pending create onto the base list', () => {
    const queue: QueuedOp[] = [{ type: 'create', localId: 'local-1', payload: newEntry, queuedAt: 5000 }];
    const result = applyPendingOps([baseJournal], queue);
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ id: 'local-1', title: 'New' });
    expect(result[1]).toEqual(baseJournal);
  });

  it('layers a pending update onto a matching entry', () => {
    const queue: QueuedOp[] = [{ type: 'update', id: 1, payload: { ...newEntry, title: 'Updated Title' }, queuedAt: 5000 }];
    const result = applyPendingOps([baseJournal], queue);
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Updated Title');
  });

  it('filters out an entry with a pending delete', () => {
    const queue: QueuedOp[] = [{ type: 'delete', id: 1, queuedAt: 5000 }];
    const result = applyPendingOps([baseJournal], queue);
    expect(result).toEqual([]);
  });
});

describe('processQueue', () => {
  it('replays ops in order and reconciles a temp localId to the server-assigned id on success', async () => {
    await setCachedJournals([]);
    await enqueue({ type: 'create', localId: 'local-1', payload: newEntry, queuedAt: 1 });

    const created: Journal = { ...newEntry, id: 99, createdAt: '2026-02-01T00:00:00.000Z' };
    const create = jest.fn().mockResolvedValue(created);
    const update = jest.fn();
    const del = jest.fn();

    await processQueue({ create, update, delete: del });

    expect(create).toHaveBeenCalledWith(newEntry);
    expect(await getQueue()).toEqual([]);
    expect(await getCachedJournals()).toEqual([created]);
  });

  it('stops on the first failure, leaving the remainder queued for the next attempt', async () => {
    await enqueue({ type: 'update', id: 1, payload: newEntry, queuedAt: 1 });
    await enqueue({ type: 'delete', id: 2, queuedAt: 2 });

    const create = jest.fn();
    const update = jest.fn().mockRejectedValue(new Error('still offline'));
    const del = jest.fn();

    await processQueue({ create, update, delete: del });

    expect(update).toHaveBeenCalledTimes(1);
    expect(del).not.toHaveBeenCalled();
    expect(await getPendingCount()).toBe(2);
  });

  it('processes multiple successful ops in order and clears the queue', async () => {
    await enqueue({ type: 'update', id: 1, payload: newEntry, queuedAt: 1 });
    await enqueue({ type: 'delete', id: 2, queuedAt: 2 });

    const create = jest.fn();
    const update = jest.fn().mockResolvedValue(baseJournal);
    const del = jest.fn().mockResolvedValue(undefined);

    await processQueue({ create, update, delete: del });

    expect(update).toHaveBeenCalledWith(1, newEntry);
    expect(del).toHaveBeenCalledWith(2);
    expect(await getQueue()).toEqual([]);
  });
});
