import React, { useState } from 'react';
import { Sparkles, Send, Bot, User, MessageSquare, Lightbulb, Zap } from 'lucide-react';
import { aiService } from '../services/aiService';

export default function AIChatView() {
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: 'Hello! I am your AI Journaling Assistant powered by Python Flask AI. Ask me anything about your past reflections, goals, or mood patterns!',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const samplePrompts = [
    'What were my top achievements this week?',
    'Analyze my mood patterns over past entries',
    'Give me a personalized reflection question'
  ];

  const handleSend = async (queryText) => {
    const q = queryText || inputQuery;
    if (!q.trim()) return;

    const userMsg = {
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!queryText) setInputQuery('');
    setLoading(true);

    try {
      const res = await aiService.chat(q);
      const aiReplyText = res?.data?.response || res?.data || 'Python AI processed your inquiry successfully.';
      
      const aiMsg = {
        sender: 'ai',
        text: aiReplyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error('AI Chat Error:', err);
      const errorMsg = {
        sender: 'ai',
        text: 'Apologies, unable to query Python AI service right now. Please check service connectivity.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', height: 'calc(100vh - 4rem)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{ padding: '0.6rem', borderRadius: '12px', background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
            <Bot size={22} color="#ffffff" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '700' }}>AI Journal Assistant</h2>
            <div style={{ fontSize: '0.75rem', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80' }}></span>
              <span>Python Flask AI Connected (`:5000`)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Suggested Quick Prompts */}
      <div style={{ display: 'flex', gap: '0.6rem', overflowX: 'auto', paddingBottom: '0.75rem', marginBottom: '0.5rem' }}>
        {samplePrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(prompt)}
            style={{
              background: 'rgba(99, 102, 241, 0.12)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              color: '#818cf8',
              padding: '0.4rem 0.85rem',
              borderRadius: '20px',
              fontSize: '0.8rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.2s'
            }}
          >
            <Lightbulb size={12} />
            <span>{prompt}</span>
          </button>
        ))}
      </div>

      {/* Chat Messages Feed */}
      <div className="glass-panel" style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1rem' }}>
        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              gap: '0.85rem',
              alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '80%'
            }}
          >
            {msg.sender === 'ai' && (
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Bot size={18} color="#ffffff" />
              </div>
            )}

            <div style={{
              background: msg.sender === 'user' ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'rgba(255,255,255,0.06)',
              border: msg.sender === 'user' ? 'none' : '1px solid rgba(255,255,255,0.1)',
              padding: '1rem 1.25rem',
              borderRadius: msg.sender === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              color: '#f8fafc',
              fontSize: '0.95rem',
              lineHeight: '1.5'
            }}>
              <p>{msg.text}</p>
              <div style={{ fontSize: '0.65rem', color: msg.sender === 'user' ? 'rgba(255,255,255,0.7)' : '#64748b', marginTop: '0.35rem', textAlign: 'right' }}>
                {msg.timestamp}
              </div>
            </div>

            {msg.sender === 'user' && (
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <User size={18} color="#ffffff" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', gap: '0.85rem', alignSelf: 'flex-start' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={18} color="#ffffff" />
            </div>
            <div style={{ background: 'rgba(255,255,255,0.06)', padding: '1rem 1.25rem', borderRadius: '18px 18px 18px 4px', color: '#94a3b8', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={16} className="animate-spin" />
              <span>Python AI is generating response...</span>
            </div>
          </div>
        )}
      </div>

      {/* Chat Input Bar */}
      <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} style={{ display: 'flex', gap: '0.75rem' }}>
        <input
          type="text"
          className="glass-input"
          placeholder="Ask AI about your journals, accomplishments, or mood patterns..."
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          style={{ padding: '0.85rem 1.25rem', fontSize: '0.95rem' }}
        />
        <button type="submit" disabled={loading || !inputQuery.trim()} className="btn-primary" style={{ padding: '0.85rem 1.5rem' }}>
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
