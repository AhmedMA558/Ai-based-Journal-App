import React, { useEffect, useState } from 'react';
import { BookOpen, Plus, Download, Edit3, Trash2, Tag, Calendar, LayoutGrid, List, Sparkles, Filter } from 'lucide-react';
import { journalService } from '../services/journalService';

export default function JournalFeed({ onNewJournal, onEditJournal, showToast }) {
  const [journals, setJournals] = useState([]);
  const [filteredJournals, setFilteredJournals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMoodFilter, setSelectedMoodFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  useEffect(() => {
    fetchJournals();
  }, []);

  const fetchJournals = async () => {
    setLoading(true);
    try {
      const list = await journalService.getAllJournals();
      const arr = Array.isArray(list) ? list : [];
      setJournals(arr);
      setFilteredJournals(arr);
    } catch (err) {
      console.error('Failed to load journals:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterMood = (mood) => {
    setSelectedMoodFilter(mood);
    if (mood === 'ALL') {
      setFilteredJournals(journals);
    } else {
      setFilteredJournals(journals.filter(j => (j.mood || '').toUpperCase() === mood));
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this journal entry?')) return;
    try {
      await journalService.deleteJournal(id);
      const updated = journals.filter(j => j.id !== id);
      setJournals(updated);
      setFilteredJournals(updated);
      if (showToast) showToast('Journal entry deleted.', 'info');
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const exportToMarkdown = () => {
    const mdContent = journals.map(j => `# ${j.title}\n**Date**: ${j.createdAt || 'N/A'}\n**Mood**: ${j.mood || 'HAPPY'}\n\n${j.content}\n\n---\n`).join('\n');
    const blob = new Blob([mdContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `journals_export_${Date.now()}.md`;
    a.click();
    if (showToast) showToast('Exported entries to Markdown (.md)', 'success');
  };

  const exportToJSON = () => {
    const jsonStr = JSON.stringify(journals, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `journals_export_${Date.now()}.json`;
    a.click();
    if (showToast) showToast('Exported entries to JSON (.json)', 'success');
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Title', 'Content', 'Mood', 'Date'];
    const rows = journals.map(j => [
      j.id,
      `"${(j.title || '').replace(/"/g, '""')}"`,
      `"${(j.content || '').replace(/"/g, '""')}"`,
      j.mood || 'HAPPY',
      j.createdAt || ''
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `journals_export_${Date.now()}.csv`;
    a.click();
    if (showToast) showToast('Exported entries to CSV (.csv)', 'success');
  };

  const getMoodEmoji = (mood) => {
    const m = (mood || '').toUpperCase();
    if (m === 'HAPPY') return '😊';
    if (m === 'EXCITED') return '🤩';
    if (m === 'RELAXED') return '😌';
    if (m === 'STRESSED') return '😰';
    if (m === 'SAD') return '🥺';
    if (m === 'GRATEFUL') return '🙏';
    if (m === 'ANGRY') return '😠';
    return '😐';
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Feed Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800' }}>My Journal Library</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Browse, filter, edit, delete, and export your AI-analyzed entries</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* View Mode Toggle */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', padding: '0.2rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <button onClick={() => setViewMode('grid')} style={{ padding: '0.4rem', border: 'none', background: viewMode === 'grid' ? 'rgba(99,102,241,0.25)' : 'transparent', color: viewMode === 'grid' ? '#818cf8' : '#94a3b8', borderRadius: '8px', cursor: 'pointer' }}>
              <LayoutGrid size={16} />
            </button>
            <button onClick={() => setViewMode('list')} style={{ padding: '0.4rem', border: 'none', background: viewMode === 'list' ? 'rgba(99,102,241,0.25)' : 'transparent', color: viewMode === 'list' ? '#818cf8' : '#94a3b8', borderRadius: '8px', cursor: 'pointer' }}>
              <List size={16} />
            </button>
          </div>

          {/* Multi-Format Exporter */}
          <button onClick={exportToMarkdown} className="btn-secondary" style={{ fontSize: '0.85rem' }}>
            <Download size={16} /> Export MD
          </button>
          <button onClick={exportToJSON} className="btn-secondary" style={{ fontSize: '0.85rem' }}>
            <Download size={16} /> Export JSON
          </button>
          <button onClick={exportToCSV} className="btn-secondary" style={{ fontSize: '0.85rem' }}>
            <Download size={16} /> Export CSV
          </button>

          <button onClick={onNewJournal} className="btn-primary">
            <Plus size={18} /> New Entry
          </button>
        </div>
      </div>

      {/* Mood Filter Pill Bar with ANGRY support */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
        <Filter size={16} color="#64748b" />
        {['ALL', 'HAPPY', 'EXCITED', 'RELAXED', 'STRESSED', 'SAD', 'GRATEFUL', 'ANGRY'].map(m => (
          <button
            key={m}
            onClick={() => handleFilterMood(m)}
            style={{
              background: selectedMoodFilter === m ? 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(168,85,247,0.15))' : 'rgba(255,255,255,0.04)',
              border: selectedMoodFilter === m ? '1px solid #6366f1' : '1px solid rgba(255,255,255,0.08)',
              color: selectedMoodFilter === m ? '#ffffff' : '#94a3b8',
              padding: '0.4rem 0.85rem',
              borderRadius: '20px',
              fontSize: '0.8rem',
              fontWeight: selectedMoodFilter === m ? '600' : '500',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {m === 'ALL' ? 'All Entries' : `${m} ${getMoodEmoji(m)}`}
          </button>
        ))}
      </div>

      {/* Journal Cards Feed */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {[1, 2, 3].map(n => (
            <div key={n} className="glass-panel skeleton-pulse" style={{ height: '220px', borderRadius: '20px' }}></div>
          ))}
        </div>
      ) : filteredJournals.length === 0 ? (
        <div className="glass-panel" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
          <BookOpen size={48} color="#64748b" style={{ marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.2rem', marginBottom: '0.4rem' }}>No Journal Entries Found</h3>
          <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>Try clearing filters or create a new journal entry.</p>
          <button onClick={onNewJournal} className="btn-primary">
            <Plus size={18} /> Write Journal
          </button>
        </div>
      ) : (
        <div style={{
          display: viewMode === 'grid' ? 'grid' : 'flex',
          flexDirection: viewMode === 'list' ? 'column' : 'none',
          gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(340px, 1fr))' : 'none',
          gap: '1.5rem'
        }}>
          {filteredJournals.map(journal => (
            <div
              key={journal.id}
              className="glass-panel"
              style={{
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{
                  fontSize: '0.75rem',
                  padding: '0.25rem 0.65rem',
                  borderRadius: '12px',
                  background: (journal.mood || '').toUpperCase() === 'ANGRY' ? 'rgba(239,68,68,0.2)' : 'rgba(99, 102, 241, 0.15)',
                  color: (journal.mood || '').toUpperCase() === 'ANGRY' ? '#ef4444' : '#818cf8',
                  fontWeight: '600',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}>
                  <span>{getMoodEmoji(journal.mood)}</span>
                  <span>{journal.mood || 'HAPPY'}</span>
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <button onClick={() => onEditJournal(journal)} className="btn-secondary" style={{ padding: '0.35rem', borderRadius: '8px' }} title="Edit Entry">
                    <Edit3 size={14} color="#38bdf8" />
                  </button>
                  <button onClick={(e) => handleDelete(e, journal.id)} className="btn-secondary" style={{ padding: '0.35rem', borderRadius: '8px' }} title="Delete Entry">
                    <Trash2 size={14} color="#f87171" />
                  </button>
                </div>
              </div>

              <div onClick={() => onEditJournal(journal)} style={{ cursor: 'pointer' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#f8fafc', lineHeight: '1.3', marginBottom: '0.4rem' }}>
                  {journal.title}
                </h3>

                <p style={{
                  fontSize: '0.9rem',
                  color: '#94a3b8',
                  lineHeight: '1.5',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {journal.content}
                </p>
              </div>

              {journal.tags && journal.tags.length > 0 && (
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: 'auto' }}>
                  {journal.tags.map((tag, idx) => (
                    <span key={idx} style={{ fontSize: '0.7rem', color: '#a855f7', background: 'rgba(168,85,247,0.1)', padding: '0.15rem 0.4rem', borderRadius: '6px' }}>
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
