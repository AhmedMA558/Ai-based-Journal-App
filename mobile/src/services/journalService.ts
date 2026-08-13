import NetInfo from '@react-native-community/netinfo';
import api from './api';
import { getCachedJournals, setCachedJournals } from '@/lib/offlineCache';
import {
  applyPendingOps,
  dropQueuedCreate,
  enqueue,
  getQueue,
  isLocalId,
  processQueue,
  updateQueuedCreate,
  type QueuedOp,
} from '@/lib/offlineQueue';
import type { Journal, JournalInput } from '@/types';

async function rawGetAllJournals(): Promise<Journal[]> {
  const res = await api.get('/api/v1/journals');
  const content = res?.data?.data?.content;
  if (Array.isArray(content)) return content;
  if (Array.isArray(res?.data?.content)) return res.data.content;
  if (Array.isArray(res?.data)) return res.data;
  return [];
}

async function rawCreateJournal(journalData: JournalInput): Promise<Journal> {
  const payload = {
    title: journalData.title,
    content: journalData.content,
    mood: journalData.mood || 'HAPPY',
    tags: journalData.tags || [],
    isDraft: false,
    isPinned: false,
    isFavorite: false,
    isArchived: false,
    contentEncrypted: false,
  };
  const res = await api.post('/api/v1/journals', payload);
  return res?.data?.data;
}

async function rawUpdateJournal(id: Journal['id'], journalData: JournalInput): Promise<Journal> {
  const payload = {
    title: journalData.title,
    content: journalData.content,
    mood: journalData.mood || 'HAPPY',
    tags: journalData.tags || [],
    isDraft: false,
    isPinned: false,
    isFavorite: false,
    isArchived: false,
    contentEncrypted: false,
  };
  const res = await api.put(`/api/v1/journals/${id}`, payload);
  return res?.data?.data;
}

async function rawDeleteJournal(id: Journal['id']): Promise<void> {
  await api.delete(`/api/v1/journals/${id}`);
}

// Distinguishes "we're actually offline, queue this" from "the server is
// reachable and rejected the request" (validation error, expired session,
// etc.) - a real server error must still surface to the screen's existing
// error handling, not be silently swallowed as if it were queued for sync.
async function isDeviceOffline(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return !(state.isConnected && state.isInternetReachable !== false);
}

async function applyOfflineJournalEdit(id: Journal['id'], journalData: JournalInput): Promise<Journal> {
  const cached = (await getCachedJournals()) || [];
  const existing = cached.find((j) => String(j.id) === String(id));
  const updated: Journal = { id, ...journalData, createdAt: existing?.createdAt || new Date().toISOString() };
  await setCachedJournals(cached.map((j) => (String(j.id) === String(id) ? updated : j)));
  return updated;
}

async function removeFromCache(id: Journal['id']): Promise<void> {
  const cached = (await getCachedJournals()) || [];
  await setCachedJournals(cached.filter((j) => String(j.id) !== String(id)));
}

// Replays any offline-queued creates/updates/deletes against the real
// backend, in order, stopping on the first failure so a mid-sync drop
// doesn't lose or reorder anything - see lib/offlineQueue.ts.
let syncing = false;
export async function syncPendingChanges(): Promise<void> {
  if (syncing) return;
  syncing = true;
  try {
    await processQueue({ create: rawCreateJournal, update: rawUpdateJournal, delete: rawDeleteJournal });
  } finally {
    syncing = false;
  }
}

// Fires an initial sync attempt on reconnect, without any screen needing to
// trigger it. Registered once per app run (this module is imported once,
// same as every other real service module) - harmless if EXPO_PUBLIC_USE_MOCKS
// is on, since Pass A never queues anything for this listener to sync.
let wasConnected: boolean | null = null;

// A one-shot check at module load closes a real gap the listener alone
// leaves open: wasConnected starts as null, so a cold app launch while
// already online would otherwise never trigger the false->true transition
// the listener below waits for - pending edits from a previous offline
// session would sit stuck until the device went offline and back online
// again while the app was actually running. This also seeds wasConnected
// from a real reading instead of null.
NetInfo.fetch().then((state) => {
  const isConnected = Boolean(state.isConnected && state.isInternetReachable !== false);
  wasConnected = isConnected;
  if (isConnected) {
    syncPendingChanges().catch(() => {
      // Sync will retry on the next reconnect event or screen-focus call.
    });
  }
});

NetInfo.addEventListener((state) => {
  const isConnected = Boolean(state.isConnected && state.isInternetReachable !== false);
  if (isConnected && wasConnected === false) {
    syncPendingChanges().catch(() => {
      // Sync will retry on the next reconnect event or screen-focus call.
    });
  }
  wasConnected = isConnected;
});

export const journalService = {
  async getAllJournals(): Promise<Journal[]> {
    let base: Journal[];
    try {
      base = await rawGetAllJournals();
      await setCachedJournals(base);
    } catch (err) {
      if (!(await isDeviceOffline())) throw err;
      // No cache yet (e.g. first-ever launch happened offline) still falls
      // through to an empty base rather than throwing, so a journal created
      // while offline in this state is still visible via applyPendingOps
      // below instead of being hidden behind an error screen.
      base = (await getCachedJournals()) || [];
    }
    const queue = await getQueue();
    return applyPendingOps(base, queue);
  },

  async getJournalById(id: Journal['id']): Promise<Journal> {
    const res = await api.get(`/api/v1/journals/${id}`);
    return res?.data?.data;
  },

  async createJournal(journalData: JournalInput): Promise<Journal> {
    try {
      return await rawCreateJournal(journalData);
    } catch (err) {
      if (!(await isDeviceOffline())) throw err;
      const localId = `local-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const op: QueuedOp = { type: 'create', localId, payload: journalData, queuedAt: Date.now() };
      await enqueue(op);
      return {
        id: localId,
        title: journalData.title,
        content: journalData.content,
        mood: journalData.mood,
        tags: journalData.tags || [],
        createdAt: new Date(op.queuedAt).toISOString(),
      };
    }
  },

  async updateJournal(id: Journal['id'], journalData: JournalInput): Promise<Journal> {
    // A local- id was never synced, so there's nothing server-side to PUT to
    // yet regardless of connectivity - always fold the edit into the still-
    // pending create instead of attempting (and 404ing on) a live call.
    if (isLocalId(id)) {
      await updateQueuedCreate(String(id), journalData);
      return applyOfflineJournalEdit(id, journalData);
    }
    try {
      return await rawUpdateJournal(id, journalData);
    } catch (err) {
      if (!(await isDeviceOffline())) throw err;
      await enqueue({ type: 'update', id, payload: journalData, queuedAt: Date.now() });
      return applyOfflineJournalEdit(id, journalData);
    }
  },

  async deleteJournal(id: Journal['id']): Promise<void> {
    if (isLocalId(id)) {
      await dropQueuedCreate(String(id));
      await removeFromCache(id);
      return;
    }
    try {
      await rawDeleteJournal(id);
    } catch (err) {
      if (!(await isDeviceOffline())) throw err;
      await enqueue({ type: 'delete', id, queuedAt: Date.now() });
      await removeFromCache(id);
    }
  },
};
