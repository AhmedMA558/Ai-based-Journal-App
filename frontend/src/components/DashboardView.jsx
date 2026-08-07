import React, { useEffect, useState } from 'react';
import { Sparkles, Plus, BookOpen, Flame, Heart, Smile, Frown, Meh, RefreshCw } from 'lucide-react';
import { journalService } from '../services/journalService';
import { aiService } from '../services/aiService';

export default function DashboardView({ onNewJournal, onSelectJournal }) {
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
      const journalRes = await journalService.getAllJournals();
      const list = journalRes?.data || journalRes || [];
      setJournals(Array.isArray(list) ? list : []);

      // Fetch AI Daily Recommendations
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

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Hero Welcome Banner */}
      <div className="glass-panel glass-panel-glow animate-fade-in" style={{ padding: '2.5rem', borderRadius: '24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'relative', zIndex: 2, maxWidth: '600px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(99, 102, 241, 0.2)', border: '1px solid rgba(99, 102, 241, 0.3)', padding: '0.4rem 0.85rem', borderRadius: '20px', fontSize: '0.8rem', color: '#818cf8', fontWeight: '600', marginBottom: '1rem' }}>
            <Sparkles size={14} />
            <span>AI-POWERED INTELLIGENCE</span>
          </div>
          <h1 style={{ fontSize: '2.4rem', fontWeight: '800', marginBottom: '0.75rem', lineHeight: '1.2' }}>
            Good day, <span style={{ background: 'linear-gradient(135deg, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{username}</span> 👋
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '1.05rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
            How are you feeling today? Log your thoughts and let our Python AI microservice detect your mood with real-time emojis & insights.
          </p>
          <button onClick={onNewJournal} className="btn-primary" style={{ padding: '0.85rem 1.75rem', fontSize: '1rem' }}>
            <Plus size={20} />
            <span>Write New Journal Entry</span>
          </button>
        </div>
      </div>

      {/* Grid Summary Widgets */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        {/* Widget 1: Streak */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(234, 179, 8, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Flame size={28} color="#fde047" />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: '500' }}>Journaling Streak</div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#f8fafc' }}>{journals.length > 0 ? `${journals.length} Days` : '0 Days'}</div>
          </div>
        </div>

        {/* Widget 2: Total Journals */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BookOpen size={28} color="#818cf8" />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: '500' }}>Total Saved Entries</div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#f8fafc' }}>{journals.length} Entries</div>
          </div>
        </div>

        {/* Widget 3: AI Wellness Tip */}
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
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Recent Journal Entries</h2>
        <button onClick={fetchDashboardData} className="btn-secondary" style={{ padding: '0.5rem 0.85rem', fontSize: '0.85rem' }}>
          <RefreshCw size={14} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Recent Entries Feed */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Loading recent entries...</div>
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {journals.slice(0, 6).map((journal) => (
            <JournalCard key={journal.id} journal={journal} onClick={() => onSelectJournal(journal)} />
          ))}
        </div>
      )}
    </div>
  );
}

function JournalCard({ journal, onClick }) {
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
      onClick={onClick}
      className="glass-panel"
      style={{
        padding: '1.5rem',
        cursor: 'pointer',
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
          background: 'rgba(99, 102, 241, 0.15)',
          color: '#818cf8',
          fontWeight: '600',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.35rem'
        }}>
          <span>{getMoodEmoji(journal.mood)}</span>
          <span>{journal.mood || 'Neutral'}</span>
        </span>
        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
          {journal.createdAt ? new Date(journal.createdAt).toLocaleDateString() : 'Today'}
        </span>
      </div>

      <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#f8fafc', lineHeight: '1.3' }}>
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
