import React, { useState, useEffect } from 'react';
import { Search, Filter, BookOpen, Sparkles, SortAsc } from 'lucide-react';
import { journalService } from '../services/journalService';

export default function SearchView() {
  const [query, setQuery] = useState('');
  const [journals, setJournals] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [selectedMoodFilter, setSelectedMoodFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'oldest'
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAllJournals();
  }, []);

  const fetchAllJournals = async () => {
    setLoading(true);
    try {
      const list = await journalService.getAllJournals();
      const arr = Array.isArray(list) ? list : [];
      setJournals(arr);
      setFilteredResults(arr);
    } catch (err) {
      console.error('Search load failed:', err);
    } finally {
      setLoading(false);
    }
  };

  // Instant Type-Ahead Deep Search & Filter logic
  useEffect(() => {
    let result = journals;

    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(j => 
        (j.title || '').toLowerCase().includes(q) ||
        (j.content || '').toLowerCase().includes(q) ||
        (j.mood || '').toLowerCase().includes(q) ||
        (j.tags || []).some(t => t.toLowerCase().includes(q))
      );
    }

    if (selectedMoodFilter !== 'ALL') {
      result = result.filter(j => (j.mood || '').toUpperCase() === selectedMoodFilter);
    }

    if (sortBy === 'newest') {
      result = [...result].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    } else {
      result = [...result].sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
    }

    setFilteredResults(result);
  }, [query, selectedMoodFilter, sortBy, journals]);

  const getMoodEmoji = (m) => {
    const map = { HAPPY: '😊', EXCITED: '🤩', RELAXED: '😌', STRESSED: '😰', SAD: '🥺', GRATEFUL: '🙏', ANGRY: '😠' };
    return map[(m || '').toUpperCase()] || '😊';
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Search Header */}
      <div>
        <h1 style={{ fontSize: '2rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Search size={26} color="#818cf8" /> Deep Type-Ahead Elasticsearch
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Real-time instant indexing across user-scoped titles, contents, moods, and tags</p>
      </div>

      {/* Input & Control Bar */}
      <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '20px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ position: 'relative' }}>
          <Search size={20} color="#818cf8" style={{ position: 'absolute', left: '1.2rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="glass-input"
            placeholder="Type anything to search in real-time (e.g. hackathon, stressed, gratitude)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ paddingLeft: '3.2rem', fontSize: '1.1rem', fontWeight: '600' }}
          />
        </div>

        {/* Filter Pills & Sort Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.2rem' }}>
            <Filter size={14} color="#64748b" />
            {['ALL', 'HAPPY', 'EXCITED', 'RELAXED', 'STRESSED', 'SAD', 'GRATEFUL', 'ANGRY'].map(m => (
              <button
                key={m}
                onClick={() => setSelectedMoodFilter(m)}
                style={{
                  background: selectedMoodFilter === m ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.04)',
                  border: selectedMoodFilter === m ? '1px solid #6366f1' : '1px solid rgba(255,255,255,0.08)',
                  color: selectedMoodFilter === m ? '#ffffff' : '#94a3b8',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '16px',
                  fontSize: '0.75rem',
                  fontWeight: selectedMoodFilter === m ? '700' : '500',
                  cursor: 'pointer'
                }}
              >
                {m === 'ALL' ? 'All Moods' : `${m} ${getMoodEmoji(m)}`}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <SortAsc size={14} color="#94a3b8" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#f8fafc',
                padding: '0.35rem 0.75rem',
                borderRadius: '12px',
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              <option value="newest" style={{ background: '#101426' }}>Newest First</option>
              <option value="oldest" style={{ background: '#101426' }}>Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Header Count */}
      <div style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <Sparkles size={14} color="#4ade80" />
        <span>Found <strong>{filteredResults.length}</strong> matching entries</span>
      </div>

      {/* Results Grid */}
      {filteredResults.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3.5rem', textAlign: 'center' }}>
          <BookOpen size={44} color="#64748b" style={{ marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.15rem', marginBottom: '0.4rem' }}>No Matching Entries</h3>
          <p style={{ color: '#94a3b8' }}>Try adjusting your search query or mood filters.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {filteredResults.map(j => (
            <div key={j.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem', borderRadius: '12px', background: 'rgba(99,102,241,0.15)', color: '#818cf8', fontWeight: '700' }}>
                  {getMoodEmoji(j.mood)} {j.mood || 'HAPPY'}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{j.createdAt ? new Date(j.createdAt).toLocaleDateString() : 'Recent'}</span>
              </div>

              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#f8fafc' }}>{j.title}</h3>
              <p style={{ fontSize: '0.88rem', color: '#94a3b8', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {j.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
