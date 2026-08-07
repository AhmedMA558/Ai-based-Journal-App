import React, { useState, useEffect } from 'react';
import { Sparkles, Save, X, Smile, Tag, FileText, Mic, MicOff, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import MoodWheel from './MoodWheel';
import { journalService } from '../services/journalService';
import { aiService } from '../services/aiService';

export default function JournalEditor({ initialData, onClose, onSaveSuccess, showToast }) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [mood, setMood] = useState(initialData?.mood || 'HAPPY');
  const [emoji, setEmoji] = useState('😊');
  const [tags, setTags] = useState(initialData?.tags || ['reflection', 'journal']);
  const [tagInput, setTagInput] = useState('');
  
  const [isListening, setIsListening] = useState(false);
  const [detectingMood, setDetectingMood] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [summary, setSummary] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [isManualMood, setIsManualMood] = useState(false);

  // Automated Real-Time AI Mood Detection on Typing (Debounced)
  useEffect(() => {
    if (!content.trim() || content.trim().length < 8 || isManualMood) return;

    const timer = setTimeout(async () => {
      setDetectingMood(true);
      try {
        const res = await aiService.detectMood(content);
        if (res?.data) {
          if (res.data.primaryMood) setMood(res.data.primaryMood.toUpperCase());
          if (res.data.emoji) setEmoji(res.data.emoji);
        }
      } catch (err) {
        console.error('Auto mood detection error:', err);
      } finally {
        setDetectingMood(false);
      }
    }, 750);

    return () => clearTimeout(timer);
  }, [content, isManualMood]);

  // Audio Voice Dictation (Web Speech API)
  const toggleSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      if (showToast) showToast('Speech recognition is not supported in this browser.', 'error');
      return;
    }

    if (isListening) {
      setIsListening(false);
    } else {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        if (showToast) showToast('Voice dictation active. Speak clearly...', 'info');
      };

      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setContent(prev => prev + ' ' + transcript);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    }
  };

  // Manual Trigger for Real-time AI Mood Detection with Emojis
  const handleDetectMood = async () => {
    if (!content.trim()) return;
    setDetectingMood(true);
    try {
      const res = await aiService.detectMood(content);
      if (res?.data) {
        if (res.data.primaryMood) setMood(res.data.primaryMood.toUpperCase());
        if (res.data.emoji) setEmoji(res.data.emoji);

        if (showToast) showToast(`AI Detected Mood: ${res.data.primaryMood} ${res.data.emoji || ''}`, 'success');

        if (res.data.primaryMood?.toUpperCase() === 'HAPPY' || res.data.primaryMood?.toUpperCase() === 'EXCITED') {
          confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
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
        if (showToast) showToast('AI Summary Generated!', 'info');
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
        if (showToast) showToast('AI Auto-Tags Added!', 'success');
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
        if (showToast) showToast('Journal updated successfully!', 'success');
      } else {
        await journalService.createJournal(payload);
        if (showToast) showToast('New journal entry saved to MySQL!', 'success');
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
    <div style={{ padding: '2rem', maxWidth: '950px', margin: '0 auto' }}>
      <div className="glass-panel glass-panel-neon animate-fade-in" style={{ padding: '2.5rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: '800', background: 'linear-gradient(135deg, #ffffff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {initialData ? 'Edit Journal Entry' : 'Create Journal Entry'}
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Automated AI mood detection as you write + manual customization</p>
          </div>
          <button onClick={onClose} className="btn-secondary" style={{ padding: '0.5rem', borderRadius: '50%' }}>
            <X size={20} />
          </button>
        </div>

        {message && (
          <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', padding: '0.75rem 1rem', borderRadius: '14px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={18} />
            <span>{message}</span>
          </div>
        )}

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          {/* Title Input */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: '600' }}>Journal Title</label>
            <input
              type="text"
              required
              className="glass-input"
              placeholder="e.g. Launching Python Flask AI Microservices & React SPA Frontend"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ fontSize: '1.15rem', fontWeight: '700' }}
            />
          </div>

          {/* Automated AI Mood Badge & Interactive Selector Wheel */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: '600' }}>
                Mood & Emoji ({isManualMood ? 'Manual Customization' : 'Automated AI Detection'})
              </span>
              {detectingMood && (
                <span style={{ fontSize: '0.75rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Sparkles size={14} className="animate-spin" />
                  <span>AI Analyzing Text...</span>
                </span>
              )}
            </div>
            <MoodWheel
              selectedMood={mood}
              onSelectMood={(m, emo) => {
                setMood(m);
                setEmoji(emo);
                setIsManualMood(true);
              }}
            />
          </div>

          {/* AI Toolbar Buttons + Voice Dictation */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={toggleSpeechRecognition}
              style={{
                background: isListening ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255,255,255,0.06)',
                border: isListening ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.15)',
                color: isListening ? '#f87171' : '#ffffff',
                padding: '0.65rem 1.15rem',
                borderRadius: '14px',
                fontSize: '0.85rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.6rem',
                transition: 'all 0.2s'
              }}
            >
              {isListening ? (
                <>
                  <div className="voice-wave">
                    <span className="voice-bar"></span>
                    <span className="voice-bar"></span>
                    <span className="voice-bar"></span>
                    <span className="voice-bar"></span>
                  </div>
                  <span>Listening...</span>
                </>
              ) : (
                <>
                  <Mic size={18} color="#ec4899" />
                  <span>Voice Dictation</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDetectMood}
              disabled={detectingMood || !content.trim()}
              className="btn-secondary"
              style={{ fontSize: '0.85rem' }}
            >
              <Smile size={18} color="#4ade80" />
              <span>{detectingMood ? 'Analyzing Mood...' : 'Re-Detect AI Mood'}</span>
            </button>

            <button
              type="button"
              onClick={handleSummarize}
              disabled={summarizing || !content.trim()}
              className="btn-secondary"
              style={{ fontSize: '0.85rem' }}
            >
              <FileText size={18} color="#38bdf8" />
              <span>{summarizing ? 'Summarizing...' : 'AI Auto-Summarize'}</span>
            </button>

            <button
              type="button"
              onClick={handleGenerateTags}
              disabled={!content.trim()}
              className="btn-secondary"
              style={{ fontSize: '0.85rem' }}
            >
              <Tag size={18} color="#c084fc" />
              <span>AI Auto-Tags</span>
            </button>
          </div>

          {/* AI Summary Card Preview */}
          {summary && (
            <div style={{ background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', padding: '1.25rem', borderRadius: '16px' }}>
              <div style={{ fontSize: '0.8rem', color: '#818cf8', fontWeight: '700', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Sparkles size={16} />
                <span>AI Short Summary Preview</span>
              </div>
              <p style={{ fontSize: '0.95rem', color: '#f8fafc', lineHeight: '1.5' }}>{summary}</p>
            </div>
          )}

          {/* Journal Content Textarea */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: '600' }}>Journal Content</label>
            <textarea
              required
              rows={9}
              className="glass-input"
              placeholder="Write your daily thoughts, accomplishments, or feelings (AI will detect your mood automatically as you type)..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              style={{ lineHeight: '1.7', resize: 'vertical', fontSize: '1rem' }}
            />
          </div>

          {/* Tags Input */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: '600' }}>Tags (Press Enter)</label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
              {tags.map((tag, idx) => (
                <span key={idx} style={{ background: 'rgba(168,85,247,0.18)', border: '1px solid rgba(168,85,247,0.35)', color: '#c084fc', padding: '0.35rem 0.75rem', borderRadius: '10px', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: '600' }}>
                  #{tag}
                  <X size={14} style={{ cursor: 'pointer' }} onClick={() => handleRemoveTag(tag)} />
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
            <button type="button" onClick={onClose} className="btn-secondary" style={{ padding: '0.85rem 1.5rem' }}>Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary" style={{ padding: '0.85rem 2rem' }}>
              <Save size={20} />
              <span>{saving ? 'Saving to MySQL...' : 'Save Journal Entry'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
