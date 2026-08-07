import React, { useState } from 'react';
import { Search, Sparkles, Filter, Calendar, BookOpen, Database } from 'lucide-react';
import { searchService } from '../services/searchService';

export default function SearchView() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchMode, setSearchMode] = useState('semantic'); // 'semantic' or 'fulltext'
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);
    try {
      let res;
      if (searchMode === 'semantic') {
        res = await searchService.semanticSearch(query);
      } else {
        res = await searchService.search(query);
      }
      const data = res?.data || res || [];
      setResults(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Search error:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(234, 179, 8, 0.15)', border: '1px solid rgba(234, 179, 8, 0.3)', padding: '0.35rem 0.75rem', borderRadius: '16px', fontSize: '0.75rem', color: '#fde047', fontWeight: '700', marginBottom: '0.5rem' }}>
          <Database size={14} />
          <span>ELASTICSEARCH 8.x INSTANT SEARCH</span>
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: '800' }}>Search Journal Knowledge Base</h1>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Real-time RabbitMQ synchronized index with semantic & full-text matching</p>
      </div>

      {/* Search Input Bar */}
      <form onSubmit={handleSearch} className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              type="text"
              className="glass-input"
              placeholder="Search by keywords, emotions, topics (e.g. happy, python, microservices)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ paddingLeft: '2.75rem', fontSize: '1rem' }}
            />
            <Search size={20} color="#6366f1" style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)' }} />
          </div>

          <button type="submit" disabled={loading || !query.trim()} className="btn-primary" style={{ padding: '0.75rem 1.75rem' }}>
            <span>{loading ? 'Searching ES...' : 'Search'}</span>
          </button>
        </div>

        {/* Search Mode Options */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '500' }}>Search Algorithm:</span>
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
            Semantic Search
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
            Full-Text Keyword
          </button>
        </div>
      </form>

      {/* Results Container */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Querying Elasticsearch cluster on port 9200...</div>
      ) : searched && results.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
          <Search size={44} color="#64748b" style={{ marginBottom: '0.75rem' }} />
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.3rem' }}>No Elasticsearch Hits Found</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Try searching for a different keyword or create new journal entries to trigger RabbitMQ indexing.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {results.map((hit, idx) => (
            <div key={idx} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.75rem', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.15)', padding: '0.2rem 0.6rem', borderRadius: '8px', fontWeight: '600' }}>
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
