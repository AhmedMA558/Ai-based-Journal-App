import React, { useState, useEffect } from 'react';
import { Sparkles, Save, X, Smile, Tag, FileText, Mic, AlertCircle, CheckCircle2, Wand2, Clock } from 'lucide-react';
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
  const [aiWriting, setAiWriting] = useState(false);
  const [summary, setSummary] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [isManualOverride, setIsManualOverride] = useState(false);

  // Standardize mood keys
  const normalizeMood = (rawMood) => {
    if (!rawMood) return 'HAPPY';
    const m = rawMood.toUpperCase();
    if (m.includes('ANGRY') || m.includes('MAD') || m.includes('RAGE')) return 'ANGRY';
    if (m.includes('EXCITE')) return 'EXCITED';
    if (m.includes('HAPP') || m.includes('JOY')) return 'HAPPY';
    if (m.includes('RELAX') || m.includes('CALM')) return 'RELAXED';
    if (m.includes('STRESS') || m.includes('ANXIO')) return 'STRESSED';
    if (m.includes('SAD') || m.includes('DEPR')) return 'SAD';
    if (m.includes('GRATE') || m.includes('THANK')) return 'GRATEFUL';
    return 'HAPPY';
  };

  const getEmojiForMood = (mKey) => {
    const map = { HAPPY: '😊', EXCITED: '🤩', RELAXED: '😌', STRESSED: '😰', SAD: '🥺', GRATEFUL: '🙏', ANGRY: '😠' };
    return map[mKey] || '😊';
  };

  // Instant Keystroke Mood Evaluator (0ms Latency)
  const evaluateInstantMood = (text) => {
    const txt = (text || '').toLowerCase();
    if (!txt.trim()) return { mood: 'HAPPY', emoji: '😊' };

    if (txt.includes('angry') || txt.includes('mad') || txt.includes('rage') || txt.includes('furious') || txt.includes('hate') || txt.includes('annoyed') || txt.includes('irritated') || txt.includes('outraged')) {
      return { mood: 'ANGRY', emoji: '😠' };
    }
    if (txt.includes('stress') || txt.includes('overwhelm') || txt.includes('frustat') || txt.includes('frustrat') || txt.includes('tired') || txt.includes('exhaust') || txt.includes('anxio') || txt.includes('busy') || txt.includes('workload')) {
      return { mood: 'STRESSED', emoji: '😰' };
    }
    if (txt.includes('sad') || txt.includes('lonely') || txt.includes('hurt') || txt.includes('ruin') || txt.includes('bad') || txt.includes('cry') || txt.includes('depress') || txt.includes('upset') || txt.includes('worst')) {
      return { mood: 'SAD', emoji: '🥺' };
    }
    if (txt.includes('thank') || txt.includes('grate') || txt.includes('bless') || txt.includes('apprec')) {
      return { mood: 'GRATEFUL', emoji: '🙏' };
    }
    if (txt.includes('relax') || txt.includes('calm') || txt.includes('peace') || txt.includes('cozy') || txt.includes('tea') || txt.includes('lake') || txt.includes('spa')) {
      return { mood: 'RELAXED', emoji: '😌' };
    }
    if (txt.includes('excit') || txt.includes('hype') || txt.includes('thrill') || txt.includes('win') || txt.includes('launch') || txt.includes('trip') || txt.includes('concert')) {
      return { mood: 'EXCITED', emoji: '🤩' };
    }
    return { mood: 'HAPPY', emoji: '😊' };
  };

  const handleContentChange = (e) => {
    const val = e.target.value;
    setContent(val);

    if (!isManualOverride && val.trim().length >= 2) {
      const instant = evaluateInstantMood(val);
      setMood(instant.mood);
      setEmoji(instant.emoji);
    }
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  // Asynchronous Python AI Sync (250ms Debounce)
  useEffect(() => {
    if (!content.trim() || content.trim().length < 3 || isManualOverride) return;

    const timer = setTimeout(async () => {
      setDetectingMood(true);
      try {
        const res = await aiService.detectMood(content);
        if (res?.data && res.data.primaryMood) {
          const detectedKey = normalizeMood(res.data.primaryMood);
          const detectedEmoji = res.data.emoji || getEmojiForMood(detectedKey);
          
          setMood(detectedKey);
          setEmoji(detectedEmoji);

          if (detectedKey === 'HAPPY' || detectedKey === 'EXCITED') {
            confetti({ particleCount: 35, spread: 50, origin: { y: 0.6 } });
          }
        }
      } catch (err) {
        // Asynchronous AI error fallback
      } finally {
        setDetectingMood(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [content, isManualOverride]);

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

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognition.start();
    }
  };

  const handleAIRephrase = async () => {
    if (!content.trim()) return;
    setAiWriting(true);
    try {
      const res = await aiService.rephrase(content);
      const newText = res?.data?.rephrased || res?.data?.response || res?.data;
      if (newText && typeof newText === 'string') {
        setContent(newText);
        if (showToast) showToast('AI Rephrased Content!', 'success');
      }
    } catch (err) {
      // Rephrase error fallback
    } finally {
      setAiWriting(false);
    }
  };

  const handleAIFixGrammar = async () => {
    if (!content.trim()) return;
    setAiWriting(true);
    try {
      const res = await aiService.fixGrammar(content);
      const newText = res?.data?.corrected || res?.data?.response || res?.data;
      if (newText && typeof newText === 'string') {
        setContent(newText);
        if (showToast) showToast('AI Corrected Grammar & Spelling!', 'success');
      }
    } catch (err) {
      // Fix grammar error fallback
    } finally {
      setAiWriting(false);
    }
  };

  const handleAIContinueWriting = async () => {
    if (!content.trim()) return;
    setAiWriting(true);
    try {
      const res = await aiService.chat(`Continue writing the next two sentences for this journal reflection: "${content}"`);
      const newText = res?.data?.response || res?.data;
      if (newText && typeof newText === 'string') {
        setContent(prev => prev.trim() + ' ' + newText);
        if (showToast) showToast('AI Continued Writing!', 'success');
      }
    } catch (err) {
      // Continue writing fallback
    } finally {
      setAiWriting(false);
    }
  };

  const handleSelectTemplate = (templateType) => {
    if (templateType === 'daily') {
      setTitle('Daily Reflection & Wins');
      setContent('1. Today\'s Top Accomplishment:\n2. What made me feel grateful:\n3. Key takeaways for tomorrow:');
    } else if (templateType === 'gratitude') {
      setTitle('Gratitude & Positive Focus');
      setContent('1. Three things I appreciate today:\n2. Someone who helped me recently:\n3. A pleasant surprise that happened:');
    } else if (templateType === 'weekly') {
      setTitle('Weekly Review & Milestones');
      setContent('• Highlights of the week:\n• Challenges overcome:\n• Priority goals for next week:');
    }
    if (showToast) showToast('Journal Template Applied!', 'info');
  };

  const handleDetectMood = async () => {
    if (!content.trim()) return;
    setDetectingMood(true);
    try {
      const res = await aiService.detectMood(content);
      if (res?.data && res.data.primaryMood) {
        const detectedKey = normalizeMood(res.data.primaryMood);
        const detectedEmoji = res.data.emoji || getEmojiForMood(detectedKey);

        setMood(detectedKey);
        setEmoji(detectedEmoji);
        setIsManualOverride(false);

        if (showToast) showToast(`AI Detected Mood: ${detectedKey} ${detectedEmoji}`, 'success');

        if (detectedKey === 'HAPPY' || detectedKey === 'EXCITED') {
          confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
        }
      }
    } catch (err) {
      // Mood detection fallback
    } finally {
      setDetectingMood(false);
    }
  };

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
      // Summarize fallback
    } finally {
      setSummarizing(false);
    }
  };

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
      // Generate tags fallback
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
      let finalMood = mood;
      if (!isManualOverride && content.trim().length >= 3) {
        try {
          const aiRes = await aiService.detectMood(content);
          if (aiRes?.data?.primaryMood) {
            finalMood = normalizeMood(aiRes.data.primaryMood);
          }
        } catch (err) {
          // Fallback to active mood
        }
      }

      const payload = { title, content, mood: finalMood, tags };
      if (initialData && initialData.id) {
        await journalService.updateJournal(initialData.id, payload);
        if (showToast) showToast(`Journal updated with AI Mood ${finalMood} ${getEmojiForMood(finalMood)}!`, 'success');
      } else {
        await journalService.createJournal(payload);
        if (showToast) showToast(`New journal entry saved with AI Mood ${finalMood} ${getEmojiForMood(finalMood)}!`, 'success');
      }
      onSaveSuccess();
    } catch (err) {
      setMessage(err?.message || 'Failed to save journal entry.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div className="glass-panel animate-fade-in" style={{ padding: '2.5rem' }}>
        {/* Header Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: '800' }}>
              {initialData ? 'Edit Journal Entry' : 'Create Journal Entry'}
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Real-time instant mood detection, voice dictation & AI writing suite</p>
          </div>
          <button onClick={onClose} className="btn-secondary" style={{ padding: '0.5rem', borderRadius: '50%' }}>
            <X size={20} />
          </button>
        </div>

        {/* Quick Templates Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>Templates:</span>
          <button type="button" onClick={() => handleSelectTemplate('daily')} className="btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
            Daily Reflection
          </button>
          <button type="button" onClick={() => handleSelectTemplate('gratitude')} className="btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
            Gratitude Log
          </button>
          <button type="button" onClick={() => handleSelectTemplate('weekly')} className="btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
            Weekly Review
          </button>
        </div>

        {message && (
          <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', padding: '0.75rem 1rem', borderRadius: '14px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={18} />
            <span>{message}</span>
          </div>
        )}

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Title Input */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: '600' }}>Journal Title</label>
            <input
              type="text"
              required
              className="glass-input"
              placeholder="e.g. Completing SaaS UI Redesign & AI Microservice"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ fontSize: '1.15rem', fontWeight: '700' }}
            />
          </div>

          {/* Journal Content Textarea */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <label style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: '600' }}>Journal Content</label>

              {/* Metrics Badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', fontSize: '0.75rem', color: '#94a3b8' }}>
                <span>{wordCount} Words</span>
                <span>{charCount} Characters</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}><Clock size={12} /> {readingTime} Min Read</span>
              </div>
            </div>

            <textarea
              required
              rows={9}
              className="glass-input"
              placeholder="Write your thoughts, feelings, or daily experience (AI will analyze your text instantly as you type)..."
              value={content}
              onChange={handleContentChange}
              style={{ lineHeight: '1.7', resize: 'vertical', fontSize: '1rem' }}
            />
          </div>

          {/* AI Writing Assistant Toolbar */}
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', background: 'rgba(255,255,255,0.03)', padding: '0.85rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: '0.8rem', color: '#818cf8', fontWeight: '700', width: '100%', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.25rem' }}>
              <Wand2 size={14} /> AI Writing Assistant Suite
            </span>
            <button type="button" onClick={handleAIRephrase} disabled={aiWriting || !content.trim()} className="btn-secondary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}>
              {aiWriting ? 'Rephrasing...' : 'Rephrase Text'}
            </button>
            <button type="button" onClick={handleAIFixGrammar} disabled={aiWriting || !content.trim()} className="btn-secondary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}>
              {aiWriting ? 'Fixing...' : 'Fix Grammar'}
            </button>
            <button type="button" onClick={handleAIContinueWriting} disabled={aiWriting || !content.trim()} className="btn-secondary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}>
              {aiWriting ? 'Writing...' : 'Continue Writing'}
            </button>
          </div>

          {/* AI Automated Mood Selection Grid */}
          <div style={{ background: 'rgba(12, 16, 34, 0.6)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={18} color="#818cf8" />
                <span style={{ fontSize: '0.9rem', color: '#ffffff', fontWeight: '700' }}>
                  AI Detected Mood: <strong style={{ color: mood === 'ANGRY' ? '#ef4444' : '#4ade80' }}>{mood} {emoji}</strong>
                </span>
              </div>

              {isManualOverride ? (
                <span style={{ fontSize: '0.75rem', color: '#fde047', background: 'rgba(253,224,71,0.15)', padding: '0.25rem 0.6rem', borderRadius: '8px', fontWeight: '600' }}>
                  Manual Override
                </span>
              ) : (
                <span style={{ fontSize: '0.75rem', color: '#4ade80', background: 'rgba(74,222,128,0.15)', padding: '0.25rem 0.6rem', borderRadius: '8px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                  <CheckCircle2 size={12} />
                  <span>Real-Time AI Active</span>
                </span>
              )}
            </div>

            <MoodWheel
              selectedMood={mood}
              onSelectMood={(m, emo) => {
                setMood(m);
                setEmoji(emo);
                setIsManualOverride(true);
              }}
            />
          </div>

          {/* Voice Dictation & AI Controls */}
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
                gap: '0.6rem'
              }}
            >
              <Mic size={18} color="#ec4899" />
              <span>{isListening ? 'Listening...' : 'Voice Dictation'}</span>
            </button>

            <button type="button" onClick={handleDetectMood} disabled={detectingMood || !content.trim()} className="btn-secondary" style={{ fontSize: '0.85rem' }}>
              <Smile size={18} color="#4ade80" />
              <span>Re-Analyze Mood</span>
            </button>

            <button type="button" onClick={handleSummarize} disabled={summarizing || !content.trim()} className="btn-secondary" style={{ fontSize: '0.85rem' }}>
              <FileText size={18} color="#38bdf8" />
              <span>Summarize</span>
            </button>

            <button type="button" onClick={handleGenerateTags} disabled={!content.trim()} className="btn-secondary" style={{ fontSize: '0.85rem' }}>
              <Tag size={18} color="#c084fc" />
              <span>Auto-Tags</span>
            </button>
          </div>

          {/* AI Summary Preview */}
          {summary && (
            <div style={{ background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', padding: '1.25rem', borderRadius: '16px' }}>
              <div style={{ fontSize: '0.8rem', color: '#818cf8', fontWeight: '700', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Sparkles size={16} />
                <span>AI Summary</span>
              </div>
              <p style={{ fontSize: '0.95rem', color: '#f8fafc', lineHeight: '1.5' }}>{summary}</p>
            </div>
          )}

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
              <span>{saving ? 'Saving...' : 'Save Journal Entry'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
