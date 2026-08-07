import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, User, Bot, Copy, Check, Trash2, Lightbulb } from 'lucide-react';
import { aiService } from '../services/aiService';

export default function AIChatView() {
  const [messages, setMessages] = useState([
    { id: 'init-1', sender: 'ai', text: 'Hello! I am your personal AI Journal Companion. How can I assist your mental wellness, reflection, or writing today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const chatEndRef = useRef(null);

  const presetPrompts = [
    "Suggest 3 daily journal prompts for mindfulness",
    "Help me process feelings of stress & workload",
    "How can I build a consistent daily writing habit?",
    "Summarize my emotional growth & wins"
  ];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMsg = { id: `user-${Date.now()}`, sender: 'user', text: query };
    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const res = await aiService.chat(query);
      const reply = res?.data?.response || res?.data || "I am here to support your journaling journey.";
      setMessages(prev => [...prev, { id: `ai-${Date.now()}`, sender: 'ai', text: reply }]);
    } catch (err) {
      console.error('AI chat error:', err);
      setMessages(prev => [...prev, { id: `ai-err-${Date.now()}`, sender: 'ai', text: 'Sorry, I encountered an issue generating a response. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyText = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearHistory = () => {
    if (window.confirm('Clear AI conversation history?')) {
      setMessages([{ id: `reset-${Date.now()}`, sender: 'ai', text: 'Chat history reset. How can I help you today?' }]);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles color="#818cf8" size={24} /> AI Writing & Wellness Companion
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Powered by Python Flask Microservice & NLP sentiment models</p>
        </div>
        <button type="button" onClick={handleClearHistory} className="btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }} title="Clear Chat">
          <Trash2 size={14} color="#f87171" /> Clear History
        </button>
      </div>

      {/* Preset Prompts Bar */}
      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
        <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <Lightbulb size={12} color="#fde047" /> Ideas:
        </span>
        {presetPrompts.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => handleSendMessage(p)}
            className="btn-secondary"
            style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem', whiteSpace: 'nowrap', borderRadius: '12px' }}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Chat Messages Container */}
      <div className="glass-panel" style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', borderRadius: '20px' }}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              gap: '0.75rem'
            }}
          >
            {msg.sender === 'ai' && (
              <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Bot size={20} color="#ffffff" />
              </div>
            )}

            <div style={{ maxWidth: '75%', position: 'relative' }}>
              <div
                style={{
                  background: msg.sender === 'user' ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'rgba(255, 255, 255, 0.05)',
                  border: msg.sender === 'user' ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  padding: '0.9rem 1.15rem',
                  borderRadius: msg.sender === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  fontSize: '0.95rem',
                  lineHeight: '1.5',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
              >
                {msg.text}
              </div>

              {msg.sender === 'ai' && (
                <button
                  type="button"
                  onClick={() => handleCopyText(msg.text, msg.id)}
                  style={{
                    position: 'absolute',
                    top: '0.4rem',
                    right: '-2rem',
                    background: 'transparent',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    padding: '0.2rem'
                  }}
                  title="Copy text"
                >
                  {copiedId === msg.id ? <Check size={14} color="#4ade80" /> : <Copy size={14} />}
                </button>
              )}
            </div>

            {msg.sender === 'user' && (
              <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <User size={20} color="#cbd5e1" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={20} color="#ffffff" />
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '0.75rem 1.25rem', borderRadius: '18px', color: '#94a3b8', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={14} className="animate-spin" color="#818cf8" /> AI is thinking...
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Bar */}
      <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem' }}>
        <input
          type="text"
          className="glass-input"
          placeholder="Ask AI for advice, journaling prompts, rephrasing..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={{ flex: 1, padding: '0.9rem 1.25rem', fontSize: '0.95rem' }}
        />
        <button type="submit" disabled={loading || !input.trim()} className="btn-primary" style={{ padding: '0.9rem 1.5rem' }}>
          <Send size={18} />
          <span>Send</span>
        </button>
      </form>
    </div>
  );
}
