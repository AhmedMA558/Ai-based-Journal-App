import React, { useEffect, useState } from 'react';
import { BookOpen, Plus, Trash2, Edit3, Tag, Search, RefreshCw, Calendar, Download, FileText } from 'lucide-react';
import { journalService } from '../services/journalService';

export default function JournalFeed({ onNewJournal, onEditJournal, showToast }) {
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMoodFilter, setSelectedMoodFilter] = useState('ALL');

  useEffect(() => {
    fetchJournals();
  }, []);

  const fetchJournals = async () => {
    setLoading(true);
    try {
      const res = await journalService.getAllJournals();
      const list = res?.data || res || [];
      setJournals(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Error fetching journals:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this journal entry?')) return;
    try {
      await journalService.deleteJournal(id);
      setJournals(journals.filter(j => j.id !== id));
      if (showToast) showToast('Journal entry deleted.', 'info');
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  // Export all journals as JSON
  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(journals, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `journals_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    if (showToast) showToast('Exported all journals to JSON backup file!', 'success');
  };

  // Export single journal as Markdown
  const handleExportMarkdown = (e, journal) => {
    e.stopPropagation();
    const mdContent = `# ${journal.title}\n\n**Date**: ${journal.createdAt || 'Recent'}\n**Mood**: ${journal.mood || 'Neutral'}\n**Tags**: ${(journal.tags || []).join(', ')}\n\n---\n\n${journal.content}`;
    const dataStr = "data:text/markdown;charset=utf-8," + encodeURIComponent(mdContent);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${(journal.title || 'journal').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    if (showToast) showToast(`Exported "${journal.title}" to Markdown!`, 'success');
  };

  const filteredJournals = journals.filter(j => {
    const matchesSearch = (j.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (j.content || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMood = selectedMoodFilter === 'ALL' || (j.mood || '').toUpperCase() === selectedMoodFilter;
    return matchesSearch && matchesMood;
  });

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800' }}>Journal Library</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Browse, filter, and export all your saved journal entries</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={handleExportJSON} className="btn-secondary">
            <Download size={16} color="#38bdf8" />
            <span>Export JSON</span>
          </button>
          <button onClick={onNewJournal} className="btn-primary">
            <Plus size={18} />
            <span>New Journal Entry</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel" style={{ padding: '1rem 1.25rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
          <input
            type="text"
            className="glass-input"
            placeholder="Filter local journals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
          />
          <Search size={18} color="#64748b" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
        </div>

        {/* Mood Filter Pill Tabs */}
        <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.2rem' }}>
          {['ALL', 'HAPPY', 'EXCITED', 'RELAXED', 'STRESSED', 'SAD'].map((mood) => (
            <button
              key={mood}
              onClick={() => setSelectedMoodFilter(mood)}
              style={{
                background: selectedMoodFilter === mood ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255,255,255,0.05)',
                border: selectedMoodFilter === mood ? '1px solid #6366f1' : '1px solid rgba(255,255,255,0.08)',
                color: selectedMoodFilter === mood ? '#818cf8' : '#94a3b8',
                padding: '0.4rem 0.85rem',
                borderRadius: '10px',
                fontSize: '0.8rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {mood}
            </button>
          ))}
        </div>

        <button onClick={fetchJournals} className="btn-secondary" style={{ padding: '0.5rem 0.85rem', fontSize: '0.85rem' }}>
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Journal Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>Loading journals from MySQL...</div>
      ) : filteredJournals.length === 0 ? (
        <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center' }}>
          <BookOpen size={48} color="#64748b" style={{ marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>No Matching Journal Entries</h3>
          <p style={{ color: '#94a3b8' }}>Try adjusting your search filters or write a new entry.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
          {filteredJournals.map((j) => (
            <JournalFeedCard
              key={j.id}
              journal={j}
              onEdit={() => onEditJournal(j)}
              onDelete={(e) => handleDelete(e, j.id)}
              onExportMd={(e) => handleExportMarkdown(e, j)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function JournalFeedCard({ journal, onEdit, onDelete, onExportMd }) {
  const getMoodEmoji = (mood) => {
    const m = (mood || '').toUpperCase();
    if (m === 'HAPPY') return '😊';
    if (m === 'EXCITED') return '🤩';
    if (m === 'RELAXED') return '😌';
    if (m === 'STRESSED') return '😰';
    if (m === 'SAD') return '🥺';
    if (m === 'GRATEFUL') return '🙏';
    return '😐';
  };

  return (
    <div
      className="glass-panel"
      style={{
        padding: '1.75rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        position: 'relative'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{
          fontSize: '0.75rem',
          padding: '0.25rem 0.75rem',
          borderRadius: '12px',
          background: 'rgba(99, 102, 241, 0.15)',
          color: '#818cf8',
          fontWeight: '600',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem'
        }}>
          <span>{getMoodEmoji(journal.mood)}</span>
          <span>{journal.mood || 'Neutral'}</span>
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <button onClick={onExportMd} className="btn-secondary" style={{ padding: '0.35rem', borderRadius: '8px' }} title="Export as Markdown">
            <FileText size={14} color="#a855f7" />
          </button>
          <button onClick={onEdit} className="btn-secondary" style={{ padding: '0.35rem', borderRadius: '8px' }} title="Edit">
            <Edit3 size={14} color="#38bdf8" />
          </button>
          <button onClick={onDelete} className="btn-secondary" style={{ padding: '0.35rem', borderRadius: '8px' }} title="Delete">
            <Trash2 size={14} color="#f87171" />
          </button>
        </div>
      </div>

      <div>
        <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#f8fafc', marginBottom: '0.4rem', lineHeight: '1.3' }}>
          {journal.title}
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#64748b' }}>
          <Calendar size={12} />
          <span>{journal.createdAt ? new Date(journal.createdAt).toLocaleString() : 'Recent'}</span>
        </div>
      </div>

      <p style={{
        fontSize: '0.92rem',
        color: '#cbd5e1',
        lineHeight: '1.6',
        display: '-webkit-box',
        WebkitLineClamp: 4,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden'
      }}>
        {journal.content}
      </p>

      {journal.tags && journal.tags.length > 0 && (
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: 'auto', paddingTop: '0.5rem' }}>
          {journal.tags.map((tag, idx) => (
            <span key={idx} style={{ fontSize: '0.75rem', color: '#c084fc', background: 'rgba(168,85,247,0.12)', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
