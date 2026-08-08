import { useEffect, useState } from 'react';
import { Search, Filter, BookOpen, Sparkles, SortAsc } from 'lucide-react';
import { journalService } from '@/services/journalService';
import { cn } from '@/lib/utils';

interface Journal {
  id: number | string;
  title?: string;
  content?: string;
  mood?: string;
  tags?: string[];
  createdAt?: string;
  [key: string]: unknown;
}

type MoodFilter = 'ALL' | 'HAPPY' | 'EXCITED' | 'RELAXED' | 'STRESSED' | 'SAD' | 'GRATEFUL' | 'ANGRY';
type SortBy = 'newest' | 'oldest';

const MOOD_FILTERS: MoodFilter[] = ['ALL', 'HAPPY', 'EXCITED', 'RELAXED', 'STRESSED', 'SAD', 'GRATEFUL', 'ANGRY'];

const MOOD_EMOJI: Record<string, string> = {
  HAPPY: '😊', EXCITED: '🤩', RELAXED: '😌', STRESSED: '😰', SAD: '🥺', GRATEFUL: '🙏', ANGRY: '😠',
};

function getMoodEmoji(m?: string): string {
  return MOOD_EMOJI[(m || '').toUpperCase()] || '😊';
}

export default function SearchView() {
  const [query, setQuery] = useState('');
  const [journals, setJournals] = useState<Journal[]>([]);
  const [filteredResults, setFilteredResults] = useState<Journal[]>([]);
  const [selectedMoodFilter, setSelectedMoodFilter] = useState<MoodFilter>('ALL');
  const [sortBy, setSortBy] = useState<SortBy>('newest');

  useEffect(() => {
    fetchAllJournals();
  }, []);

  const fetchAllJournals = async () => {
    try {
      const list = await journalService.getAllJournals();
      const arr: Journal[] = Array.isArray(list) ? list : [];
      setJournals(arr);
      setFilteredResults(arr);
    } catch (err) {
      console.error('Search load failed:', err);
    }
  };

  // Instant Type-Ahead Deep Search & Filter logic
  useEffect(() => {
    let result = journals;

    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (j) =>
          (j.title || '').toLowerCase().includes(q) ||
          (j.content || '').toLowerCase().includes(q) ||
          (j.mood || '').toLowerCase().includes(q) ||
          (j.tags || []).some((t) => t.toLowerCase().includes(q))
      );
    }

    if (selectedMoodFilter !== 'ALL') {
      result = result.filter((j) => (j.mood || '').toUpperCase() === selectedMoodFilter);
    }

    result = [...result].sort((a, b) => {
      const aTime = new Date(a.createdAt || 0).getTime();
      const bTime = new Date(b.createdAt || 0).getTime();
      return sortBy === 'newest' ? bTime - aTime : aTime - bTime;
    });

    setFilteredResults(result);
  }, [query, selectedMoodFilter, sortBy, journals]);

  return (
    <div className="p-8 max-w-[1100px] mx-auto flex flex-col gap-6">
      {/* Search Header */}
      <div>
        <h1 className="text-[2rem] font-extrabold flex items-center gap-[0.6rem]">
          <Search size={26} color="#818cf8" /> Deep Type-Ahead Elasticsearch
        </h1>
        <p className="text-[#94a3b8] text-[0.9rem]">
          Real-time instant indexing across user-scoped titles, contents, moods, and tags
        </p>
      </div>

      {/* Input & Control Bar */}
      <div className="glass-panel p-5 flex flex-col gap-4">
        <div className="relative">
          <Search size={20} color="#818cf8" className="absolute left-[1.2rem] top-1/2 -translate-y-1/2" />
          <input
            type="text"
            className="glass-input pl-[3.2rem] text-[1.1rem] font-semibold"
            placeholder="Type anything to search in real-time (e.g. hackathon, stressed, gratitude)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {/* Filter Pills & Sort Bar */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-[0.2rem]">
            <Filter size={14} color="#64748b" />
            {MOOD_FILTERS.map((m) => (
              <button
                key={m}
                onClick={() => setSelectedMoodFilter(m)}
                className={cn(
                  'py-[0.35rem] px-3 rounded-2xl text-xs cursor-pointer',
                  selectedMoodFilter === m
                    ? 'bg-[rgba(99,102,241,0.25)] border border-[#6366f1] text-white font-bold'
                    : 'bg-white/[0.04] border border-white/[0.08] text-[#94a3b8] font-medium'
                )}
              >
                {m === 'ALL' ? 'All Moods' : `${m} ${getMoodEmoji(m)}`}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <SortAsc size={14} color="#94a3b8" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="bg-white/5 border border-white/10 text-[#f8fafc] py-[0.35rem] px-3 rounded-xl text-[0.8rem] cursor-pointer"
            >
              <option value="newest" style={{ background: '#101426' }}>Newest First</option>
              <option value="oldest" style={{ background: '#101426' }}>Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Header Count */}
      <div className="text-[0.85rem] text-[#94a3b8] flex items-center gap-[0.4rem]">
        <Sparkles size={14} color="#4ade80" />
        <span>
          Found <strong>{filteredResults.length}</strong> matching entries
        </span>
      </div>

      {/* Results Grid */}
      {filteredResults.length === 0 ? (
        <div className="glass-panel p-14 text-center">
          <BookOpen size={44} color="#64748b" className="mb-4" />
          <h3 className="text-[1.15rem] mb-[0.4rem]">No Matching Entries</h3>
          <p className="text-[#94a3b8]">Try adjusting your search query or mood filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-6">
          {filteredResults.map((j) => (
            <div key={j.id} className="glass-panel p-6 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs py-1 px-[0.65rem] rounded-2xl bg-[rgba(99,102,241,0.15)] text-[#818cf8] font-bold">
                  {getMoodEmoji(j.mood)} {j.mood || 'HAPPY'}
                </span>
                <span className="text-xs text-[#64748b]">
                  {j.createdAt ? new Date(j.createdAt).toLocaleDateString() : 'Recent'}
                </span>
              </div>

              <h3 className="text-[1.1rem] font-bold text-[#f8fafc]">{j.title}</h3>
              <p className="text-[0.88rem] text-[#94a3b8] leading-[1.5] line-clamp-3">{j.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
