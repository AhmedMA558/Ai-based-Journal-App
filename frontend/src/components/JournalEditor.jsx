import React, { useState } from 'react';
import { Sparkles, Save, X, Smile, Tag, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { journalService } from '../services/journalService';
import { aiService } from '../services/aiService';

export default function JournalEditor({ initialData, onClose, onSaveSuccess }) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [mood, setMood] = useState(initialData?.mood || 'HAPPY');
  const [emoji, setEmoji] = useState('😊');
  const [tags, setTags] = useState(initialData?.tags || ['reflection', 'journal']);
  const [tagInput, setTagInput] = useState('');
  
  const [detectingMood, setDetectingMood] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [summary, setSummary] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Real-time AI Mood Detection with Emojis
  const handleDetectMood = async () => {
    if (!content.trim()) return;
    setDetectingMood(true);
    try {
      const res = await aiService.detectMood(content);
      if (res?.data) {
        if (res.data.primaryMood) setMood(res.data.primaryMood.toUpperCase());
        if (res.data.emoji) setEmoji(res.data.emoji);

        // Confetti celebration if happy mood!
        if (res.data.primaryMood?.toUpperCase() === 'HAPPY' || res.data.primaryMood?.toUpperCase() === 'EXCITED') {
          confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
        }
      }
    } catch (err) {
      console.error('Mood detection failed:', err);
    } finally {
      setDetectingMood(false);
    }
  };

  // AI Summarization
  const handleSummarize = async () => {
    if (!content.trim()) return;
    setSummarizing(true);
    try {
      const res = await aiService.summarize(content);
      if (res?.data?.shortSummary) {
        setSummary(res.data.shortSummary);
      }
    } catch (err) {
      console.error('Summarize failed:', err);
    } finally {
      setSummarizing(false);
    }
  };

  // AI Tag Generator
  const handleGenerateTags = async () => {
    if (!content.trim()) return;
    try {
      const res = await aiService.generateTags(content);
      if (res?.data && Array.isArray(res.data)) {
        const cleanTags = res.data.map(t => t.replace('#', ''));
        setTags(prev => [...new Set([...prev, ...cleanTags])]);
      }
    } catch (err) {
      console.error('Tag generator failed:', err);
    }
  };

  const handleAddTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const clean = tagInput.trim().replace('#', '');
      if (!tags.includes(clean)) {
        setTags([...tags, clean]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setMessage('Title and Content are required.');
      return;
    }

    setSaving(true);
    try {
      const payload = { title, content, mood, tags };
      if (initialData && initialData.id) {
        await journalService.updateJournal(initialData.id, payload);
      } else {
        await journalService.createJournal(payload);
      }
      onSaveSuccess();
    } catch (err) {
      console.error('Save failed:', err);
      setMessage(err?.message || 'Failed to save journal entry.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      <div className="glass-panel animate-fade-in" style={{ padding: '2.5rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: '800' }}>
              {initialData ? 'Edit Journal Entry' : 'Create Journal Entry'}
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Real-time Python Flask AI analysis & sentiment mapping</p>
          </div>
          <button onClick={onClose} className="btn-secondary" style={{ padding: '0.5rem', borderRadius: '50%' }}>
            <X size={20} />
          </button>
        </div>

        {message && (
          <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', padding: '0.75rem 1rem', borderRadius: '12px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={18} />
            <span>{message}</span>
          </div>
        )}

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Title Input */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: '500' }}>Journal Title</label>
            <input
              type="text"
              required
              className="glass-input"
              placeholder="e.g. Completing Python AI Microservices & React Integration"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ fontSize: '1.1rem', fontWeight: '600' }}
            />
          </div>

          {/* AI Toolbar Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleDetectMood}
              disabled={detectingMood || !content.trim()}
              className="btn-secondary"
              style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
            >
              <Smile size={16} color="#4ade80" />
              <span>{detectingMood ? 'Analyzing Mood...' : 'AI Detect Mood & Emoji'}</span>
            </button>

            <button
              type="button"
              onClick={handleSummarize}
              disabled={summarizing || !content.trim()}
              className="btn-secondary"
              style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
            >
              <FileText size={16} color="#38bdf8" />
              <span>{summarizing ? 'Summarizing...' : 'AI Auto-Summarize'}</span>
            </button>

            <button
              type="button"
              onClick={handleGenerateTags}
              disabled={!content.trim()}
              className="btn-secondary"
              style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
            >
              <Tag size={16} color="#c084fc" />
              <span>AI Auto-Tags</span>
            </button>
          </div>

          {/* Mood & Emoji Badge Display */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(15, 20, 38, 0.6)', padding: '0.85rem 1.25rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '2rem' }}>{emoji}</div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Detected Mood</div>
              <div style={{ fontSize: '1rem', fontWeight: '700', color: '#4ade80' }}>{mood}</div>
            </div>
          </div>

          {/* AI Summary Card Preview */}
          {summary && (
            <div style={{ background: 'rgba(99, 102, 241, 0.12)', border: '1px solid rgba(99, 102, 241, 0.25)', padding: '1rem', borderRadius: '14px' }}>
              <div style={{ fontSize: '0.8rem', color: '#818cf8', fontWeight: '600', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Sparkles size={14} />
                <span>AI Generated Short Summary</span>
              </div>
              <p style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: '1.5' }}>{summary}</p>
            </div>
          )}

          {/* Journal Content Textarea */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: '500' }}>Journal Content</label>
            <textarea
              required
              rows={8}
              className="glass-input"
              placeholder="Write your daily thoughts, accomplishments, or feelings..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              style={{ lineHeight: '1.6', resize: 'vertical' }}
            />
          </div>

          {/* Tags Input */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: '500' }}>Tags (Press Enter)</label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
              {tags.map((tag, idx) => (
                <span key={idx} style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)', color: '#c084fc', padding: '0.3rem 0.65rem', borderRadius: '8px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  #{tag}
                  <X size={12} style={{ cursor: 'pointer' }} onClick={() => handleRemoveTag(tag)} />
                </span>
              ))}
            </div>
            <input
              type="text"
              className="glass-input"
              placeholder="Add tag and hit enter (e.g. mindfulness)..."
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
            />
          </div>

          {/* Submit Action Buttons */}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">
              <Save size={18} />
              <span>{saving ? 'Saving to MySQL...' : 'Save Journal Entry'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
