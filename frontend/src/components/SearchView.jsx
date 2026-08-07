import React, { useState, useEffect } from 'react';
import { Search, Sparkles, Filter, Calendar, BookOpen, Database, Loader } from 'lucide-react';
import { searchService } from '../services/searchService';
import { journalService } from '../services/journalService';

export default function SearchView() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [allJournals, setAllJournals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchMode, setSearchMode] = useState('semantic'); // 'semantic' or 'fulltext'

  useEffect(() => {
    // Load existing journals for instant client-side fallback matching
    journalService.getAllJournals().then(list => {
      setAllJournals(Array.isArray(list) ? list : []);
      setResults(Array.isArray(list) ? list : []);
    }).catch(() => {});
  }, []);

  // Instant Debounced Type-Ahead Deep Search as User Types
  useEffect(() => {
    if (!query.trim()) {
      setResults(allJournals);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        let res;
        if (searchMode === 'semantic') {
          res = await searchService.semanticSearch(query);
        } else {
          res = await searchService.search(query);
        }
        const data = res?.data || res || [];
        if (Array.isArray(data) && data.length > 0) {
          setResults(data);
        } else {
          // Instant local fuzzy matching fallback as user types
          const q = query.toLowerCase();
          const filtered = allJournals.filter(j => 
            (j.title && j.title.toLowerCase().includes(q)) ||
            (j.content && j.content.toLowerCase().includes(q)) ||
            (j.mood && j.mood.toLowerCase().includes(q)) ||
            (j.tags && Array.isArray(j.tags) && j.tags.some(t => t.toLowerCase().includes(q)))
          );
          setResults(filtered);
        }
      } catch (err) {
        // Local search fallback on network timeout
        const q = query.toLowerCase();
        const filtered = allJournals.filter(j => 
          (j.title && j.title.toLowerCase().includes(q)) ||
          (j.content && j.content.toLowerCase().includes(q)) ||
          (j.mood && j.mood.toLowerCase().includes(q)) ||
          (j.tags && Array.isArray(j.tags) && j.tags.some(t => t.toLowerCase().includes(q)))
        );
        setResults(filtered);
      } finally {
        setLoading(false);
      }
    }, 200); // 200ms debounce as user types

    return () => clearTimeout(timer);
  }, [query, searchMode, allJournals]);

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(234, 179, 8, 0.15)', border: '1px solid rgba(234, 179, 8, 0.3)', padding: '0.35rem 0.75rem', borderRadius: '16px', fontSize: '0.75rem', color: '#fde047', fontWeight: '700', marginBottom: '0.5rem' }}>
          <Database size={14} />
          <span>REAL-TIME TYPE-AHEAD ELASTICSEARCH</span>
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: '800' }}>Instant Deep Search</h1>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Type-ahead instant search indexing across titles, entries, moods, and tags as you type</p>
      </div>

      {/* Search Input Bar */}
      <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              type="text"
              className="glass-input"
              placeholder="Type to search entries instantly (e.g. bad day, happy, reflection, coding)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ paddingLeft: '2.75rem', fontSize: '1rem' }}
            />
            {loading ? (
              <Loader size={20} color="#6366f1" className="animate-spin" style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)' }} />
            ) : (
              <Search size={20} color="#6366f1" style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)' }} />
            )}
          </div>
        </div>

        {/* Search Mode Options */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '500' }}>Algorithm:</span>
          <button
            type="button"
            onClick={() => setSearchMode('semantic')}
            style={{
              background: searchMode === 'semantic' ? 'rgba(99,102,241,0.2)' : 'transparent',
              border: searchMode === 'semantic' ? '1px solid #6366f1' : '1px solid transparent',
              color: searchMode === 'semantic' ? '#818cf8' : '#94a3b8',
              padding: '0.3rem 0.75rem',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Semantic AI Search
          </button>
          <button
            type="button"
            onClick={() => setSearchMode('fulltext')}
            style={{
              background: searchMode === 'fulltext' ? 'rgba(99,102,241,0.2)' : 'transparent',
              border: searchMode === 'fulltext' ? '1px solid #6366f1' : '1px solid transparent',
              color: searchMode === 'fulltext' ? '#818cf8' : '#94a3b8',
              padding: '0.3rem 0.75rem',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Elasticsearch Full-Text
          </button>
        </div>
      </div>

      {/* Results Container */}
      {results.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
          <Search size={44} color="#64748b" style={{ marginBottom: '0.75rem' }} />
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.3rem' }}>No Search Results Found</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>No journal matches found for "{query}". Try typing a different phrase or keyword.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            Showing <strong>{results.length}</strong> matching journal entries:
          </div>
          {results.map((hit, idx) => (
            <div key={idx} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.75rem', color: '#818cf8', background: 'rgba(99, 102, 241, 0.15)', padding: '0.2rem 0.6rem', borderRadius: '8px', fontWeight: '600' }}>
                  Mood: {hit.mood || 'HAPPY'}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Index: journals</span>
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#f8fafc' }}>{hit.title}</h3>
              <p style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: '1.5' }}>{hit.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
