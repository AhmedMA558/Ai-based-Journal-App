import React, { useEffect, useState } from 'react';
import { Sparkles, Plus, BookOpen, Flame, Heart, Edit3, Trash2, RefreshCw } from 'lucide-react';
import { journalService } from '../services/journalService';
import { aiService } from '../services/aiService';

export default function DashboardView({ onNewJournal, onSelectJournal, showToast }) {
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recommendation, setRecommendation] = useState('Take 5 deep breaths and reflect on 3 good things today.');
  const username = localStorage.getItem('user_name') || 'Journaler';

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const list = await journalService.getAllJournals();
      setJournals(Array.isArray(list) ? list : []);

      try {
        const aiRes = await aiService.getRecommendations('HAPPY');
        if (aiRes?.data && Array.isArray(aiRes.data) && aiRes.data.length > 0) {
          setRecommendation(aiRes.data[0]);
        }
      } catch (err) {
        // Fallback recommendation
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
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

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Hero Welcome Banner */}
      <div className="glass-panel glass-panel-glow animate-fade-in" style={{ padding: '2.5rem', borderRadius: '24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'relative', zIndex: 2, maxWidth: '600px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(99, 102, 241, 0.2)', border: '1px solid rgba(99, 102, 241, 0.3)', padding: '0.4rem 0.85rem', borderRadius: '20px', fontSize: '0.8rem', color: '#818cf8', fontWeight: '600', marginBottom: '1rem' }}>
            <Sparkles size={14} />
            <span>REAL-TIME AI MOOD ENGINE CONNECTED</span>
          </div>
          <h1 style={{ fontSize: '2.4rem', fontWeight: '800', marginBottom: '0.75rem', lineHeight: '1.2' }}>
            Good day, <span style={{ background: 'linear-gradient(135deg, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{username}</span> 👋
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '1.05rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
            Type your daily thoughts and our Python AI microservice will automatically detect your primary mood and assign matching real-time emojis (😊, 🤩, 😌, 😰, 🥺, 🙏, 😠).
          </p>
          <button onClick={onNewJournal} className="btn-primary" style={{ padding: '0.85rem 1.75rem', fontSize: '1rem' }}>
            <Plus size={20} />
            <span>Write New Journal Entry</span>
          </button>
        </div>
      </div>

      {/* Grid Summary Widgets */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(234, 179, 8, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Flame size={28} color="#fde047" />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: '500' }}>Journaling Streak</div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#f8fafc' }}>{journals.length > 0 ? `${journals.length} Days` : '0 Days'}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BookOpen size={28} color="#818cf8" />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: '500' }}>Total Saved Entries</div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#f8fafc' }}>{journals.length} Entries</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(34, 197, 94, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Heart size={28} color="#4ade80" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: '500', marginBottom: '0.2rem' }}>AI Wellness Suggestion</div>
            <div style={{ fontSize: '0.9rem', color: '#cbd5e1', fontStyle: 'italic', lineHeight: '1.3' }}>"{recommendation}"</div>
          </div>
        </div>
      </div>

      {/* Recent Entries Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Recent AI-Analyzed Entries</h2>
        <button onClick={fetchDashboardData} className="btn-secondary" style={{ padding: '0.5rem 0.85rem', fontSize: '0.85rem' }}>
          <RefreshCw size={14} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Recent Entries Feed */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {[1, 2, 3].map(n => (
            <div key={n} className="glass-panel skeleton-pulse" style={{ height: '200px', borderRadius: '20px' }}></div>
          ))}
        </div>
      ) : journals.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
          <BookOpen size={48} color="#64748b" style={{ marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>No Journal Entries Yet</h3>
          <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>Start your journaling journey by writing your first AI-analyzed entry.</p>
          <button onClick={onNewJournal} className="btn-primary">
            <Plus size={18} />
            <span>Create First Entry</span>
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
          {journals.slice(0, 6).map((journal) => (
            <DashboardJournalCard
              key={journal.id}
              journal={journal}
              onSelect={() => onSelectJournal(journal)}
              onDelete={(e) => handleDelete(e, journal.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DashboardJournalCard({ journal, onSelect, onDelete }) {
  const getMoodEmoji = (mood) => {
    const m = (mood || '').toUpperCase();
    if (m === 'HAPPY') return '😊';
    if (m === 'EXCITED') return '🤩';
    if (m === 'RELAXED') return '😌';
    if (m === 'STRESSED') return '😰';
    if (m === 'SAD') return '🥺';
    if (m === 'GRATEFUL') return '🙏';
    if (m === 'ANGRY') return '😠';
    return '😊';
  };

  const getMoodBadgeStyle = (mood) => {
    const m = (mood || '').toUpperCase();
    if (m === 'HAPPY') return { bg: 'rgba(74, 222, 128, 0.18)', border: 'rgba(74, 222, 128, 0.35)', color: '#4ade80' };
    if (m === 'EXCITED') return { bg: 'rgba(253, 224, 71, 0.18)', border: 'rgba(253, 224, 71, 0.35)', color: '#fde047' };
    if (m === 'RELAXED') return { bg: 'rgba(56, 189, 248, 0.18)', border: 'rgba(56, 189, 248, 0.35)', color: '#38bdf8' };
    if (m === 'STRESSED') return { bg: 'rgba(248, 113, 113, 0.18)', border: 'rgba(248, 113, 113, 0.35)', color: '#f87171' };
    if (m === 'SAD') return { bg: 'rgba(192, 132, 252, 0.18)', border: 'rgba(192, 132, 252, 0.35)', color: '#c084fc' };
    if (m === 'GRATEFUL') return { bg: 'rgba(251, 113, 133, 0.18)', border: 'rgba(251, 113, 133, 0.35)', color: '#fb7185' };
    if (m === 'ANGRY') return { bg: 'rgba(239, 68, 68, 0.22)', border: 'rgba(239, 68, 68, 0.45)', color: '#ef4444' };
    return { bg: 'rgba(99, 102, 241, 0.18)', border: 'rgba(99, 102, 241, 0.35)', color: '#818cf8' };
  };

  const badgeStyle = getMoodBadgeStyle(journal.mood);

  return (
    <div
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
          fontSize: '0.85rem',
          padding: '0.35rem 0.75rem',
          borderRadius: '14px',
          background: badgeStyle.bg,
          border: `1px solid ${badgeStyle.border}`,
          color: badgeStyle.color,
          fontWeight: '700',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
        }}>
          <span style={{ fontSize: '1.1rem' }}>{getMoodEmoji(journal.mood)}</span>
          <span>{journal.mood || 'HAPPY'}</span>
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <button onClick={onSelect} className="btn-secondary" style={{ padding: '0.35rem', borderRadius: '8px' }} title="Edit Entry">
            <Edit3 size={14} color="#38bdf8" />
          </button>
          <button onClick={onDelete} className="btn-secondary" style={{ padding: '0.35rem', borderRadius: '8px' }} title="Delete Entry">
            <Trash2 size={14} color="#f87171" />
          </button>
        </div>
      </div>

      <div onClick={onSelect} style={{ cursor: 'pointer' }}>
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
  );
}
