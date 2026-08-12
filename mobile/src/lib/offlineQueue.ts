import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCachedJournals, setCachedJournals } from './offlineCache';
import type { Journal, JournalInput } from '@/types';

const QUEUE_KEY = 'mindora_offline_pending_ops';

export type QueuedOp =
  | { type: 'create'; localId: string; payload: JournalInput; queuedAt: number }
  | { type: 'update'; id: Journal['id']; payload: JournalInput; queuedAt: number }
  | { type: 'delete'; id: Journal['id']; queuedAt: number };

export function isLocalId(id: Journal['id']): boolean {
  return typeof id === 'string' && id.startsWith('local-');
}

export async function getQueue(): Promise<QueuedOp[]> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function setQueue(queue: QueuedOp[]): Promise<void> {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export async function getPendingCount(): Promise<number> {
  return (await getQueue()).length;
}

export async function enqueue(op: QueuedOp): Promise<void> {
  const queue = await getQueue();
  await setQueue([...queue, op]);
}

// Coalesces an offline edit into the still-unsynced create for the same
// localId, instead of queueing a separate update - there's only ever one
// create to sync either way.
export async function updateQueuedCreate(localId: string, payload: JournalInput): Promise<boolean> {
  const queue = await getQueue();
  const idx = queue.findIndex((op) => op.type === 'create' && op.localId === localId);
  if (idx === -1) return false;
  const updated = [...queue];
  updated[idx] = { ...(updated[idx] as Extract<QueuedOp, { type: 'create' }>), payload };
  await setQueue(updated);
  return true;
}

// Drops a still-unsynced create entirely - used when a locally-created entry
// is deleted again before it ever reached the server, so there's nothing to
// tell the server about at all.
export async function dropQueuedCreate(localId: string): Promise<boolean> {
  const queue = await getQueue();
  const filtered = queue.filter((op) => !(op.type === 'create' && op.localId === localId));
  if (filtered.length === queue.length) return false;
  await setQueue(filtered);
  return true;
}

// Pure function: layers pending queued operations onto a base journal list so
// getAllJournals() reflects unsynced local changes immediately, whether the
// base list came from a live fetch or the offline cache. No I/O - directly
// unit-testable.
export function applyPendingOps(base: Journal[], queue: QueuedOp[]): Journal[] {
  let result = [...base];
  for (const op of queue) {
    if (op.type === 'create') {
      const optimistic: Journal = {
        id: op.localId,
        title: op.payload.title,
        content: op.payload.content,
        mood: op.payload.mood,
        tags: op.payload.tags || [],
        createdAt: new Date(op.queuedAt).toISOString(),
      };
      result = [optimistic, ...result];
    } else if (op.type === 'update') {
      result = result.map((j) => (String(j.id) === String(op.id) ? { ...j, ...op.payload } : j));
    } else if (op.type === 'delete') {
      result = result.filter((j) => String(j.id) !== String(op.id));
    }
  }
  return result;
}

interface SyncHandlers {
  create: (payload: JournalInput) => Promise<Journal>;
  update: (id: Journal['id'], payload: JournalInput) => Promise<Journal>;
  delete: (id: Journal['id']) => Promise<void>;
}

// Replays the queue in order against the caller-supplied raw (non-offline-aware)
// handlers, stopping on the first failure so a mid-sync network drop leaves the
// remainder queued rather than lost or reordered. Takes handlers as a parameter
// instead of importing journalService.ts directly, to avoid a circular import -
// journalService.ts is the module that calls processQueue.
export async function processQueue(handlers: SyncHandlers): Promise<void> {
  let queue = await getQueue();
  while (queue.length > 0) {
    const op = queue[0];
    try {
      if (op.type === 'create') {
        const created = await handlers.create(op.payload);
        const cached = (await getCachedJournals()) || [];
        await setCachedJournals([created, ...cached.filter((j) => String(j.id) !== op.localId)]);
      } else if (op.type === 'update') {
        await handlers.update(op.id, op.payload);
      } else {
        await handlers.delete(op.id);
      }
      queue = queue.slice(1);
      await setQueue(queue);
    } catch {
      // Still offline, or a real server error - stop here and leave this op
      // (and everything after it) queued for the next sync attempt.
      break;
    }
  }
}
