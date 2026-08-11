import { mockJournals } from './fixtures';
import type { Journal, JournalInput } from '@/types';

// CRUD over an in-memory array seeded from the fixtures - mirrors journalService.ts's
// exact function signatures. State resets on app reload, which is fine for a
// prototype pass (no persistence requirement stated in the plan).
let journals: Journal[] = mockJournals.map((j) => ({ ...j }));
const ARTIFICIAL_DELAY_MS = 350;

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ARTIFICIAL_DELAY_MS));
}

function nextId(): string {
  return `mock-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

export const mockJournalService = {
  async getAllJournals(): Promise<Journal[]> {
    return delay([...journals].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  },

  async getJournalById(id: Journal['id']): Promise<Journal> {
    const found = journals.find((j) => String(j.id) === String(id));
    if (!found) {
      return delay(undefined).then(() => {
        throw new Error('Journal entry not found.');
      });
    }
    return delay(found);
  },

  async createJournal(journalData: JournalInput): Promise<Journal> {
    const created: Journal = {
      id: nextId(),
      title: journalData.title,
      content: journalData.content,
      mood: journalData.mood || 'HAPPY',
      tags: journalData.tags || [],
      createdAt: new Date().toISOString(),
    };
    journals = [created, ...journals];
    return delay(created);
  },

  async updateJournal(id: Journal['id'], journalData: JournalInput): Promise<Journal> {
    const idx = journals.findIndex((j) => String(j.id) === String(id));
    if (idx === -1) {
      return delay(undefined).then(() => {
        throw new Error('Journal entry not found.');
      });
    }
    const updated: Journal = { ...journals[idx], ...journalData };
    journals = [...journals.slice(0, idx), updated, ...journals.slice(idx + 1)];
    return delay(updated);
  },

  async deleteJournal(id: Journal['id']): Promise<void> {
    journals = journals.filter((j) => String(j.id) !== String(id));
    return delay(undefined);
  },
};
