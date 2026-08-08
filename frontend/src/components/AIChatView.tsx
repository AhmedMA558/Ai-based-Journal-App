import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Sparkles, Send, User, Bot, Copy, Check, Trash2, Lightbulb } from 'lucide-react';
import { aiService } from '@/services/aiService';
import { cn } from '@/lib/utils';

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
}

const PRESET_PROMPTS = [
  'Suggest 3 daily journal prompts for mindfulness',
  'Help me process feelings of stress & workload',
  'How can I build a consistent daily writing habit?',
  'Summarize my emotional growth & wins',
];

export default function AIChatView() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'ai',
      text: 'Hello! I am your personal AI Journal Companion. How can I assist your mental wellness, reflection, or writing today?',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMsg: ChatMessage = { id: `user-${Date.now()}`, sender: 'user', text: query };
    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const res = await aiService.chat(query);
      const reply = res?.data?.response || res?.data || 'I am here to support your journaling journey.';
      setMessages((prev) => [...prev, { id: `ai-${Date.now()}`, sender: 'ai', text: reply }]);
    } catch (err) {
      console.error('AI chat error:', err);
      setMessages((prev) => [
        ...prev,
        { id: `ai-err-${Date.now()}`, sender: 'ai', text: 'Sorry, I encountered an issue generating a response. Please try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyText = (text: string, id: string) => {
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
    <div className="p-8 max-w-[1000px] mx-auto flex flex-col h-[calc(100vh-120px)]">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-[1.8rem] font-extrabold flex items-center gap-2">
            <Sparkles color="#818cf8" size={24} /> AI Writing & Wellness Companion
          </h1>
          <p className="text-[#94a3b8] text-[0.85rem]">Powered by Python Flask Microservice & NLP sentiment models</p>
        </div>
        <button
          type="button"
          onClick={handleClearHistory}
          className="btn-secondary py-[0.4rem] px-3 text-[0.8rem]"
          title="Clear Chat"
        >
          <Trash2 size={14} color="#f87171" /> Clear History
        </button>
      </div>

      {/* Preset Prompts Bar */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4">
        <span className="text-xs text-[#64748b] font-semibold flex items-center gap-1">
          <Lightbulb size={12} color="#fde047" /> Ideas:
        </span>
        {PRESET_PROMPTS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => handleSendMessage(p)}
            className="btn-secondary text-xs py-[0.3rem] px-[0.65rem] whitespace-nowrap rounded-xl"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Chat Messages Container */}
      <div className="glass-panel flex-1 p-6 overflow-y-auto flex flex-col gap-4">
        {messages.map((msg) => (
          <div key={msg.id} className={cn('flex gap-3', msg.sender === 'user' ? 'justify-end' : 'justify-start')}>
            {msg.sender === 'ai' && (
              <div className="w-9 h-9 rounded-xl bg-[linear-gradient(135deg,#6366f1,#a855f7)] flex items-center justify-center shrink-0">
                <Bot size={20} color="#ffffff" />
              </div>
            )}

            <div className="max-w-[75%] relative">
              <div
                className={cn(
                  'text-white py-[0.9rem] px-[1.15rem] text-[0.95rem] leading-[1.5] shadow-[0_4px_12px_rgba(0,0,0,0.1)]',
                  msg.sender === 'user'
                    ? 'bg-[linear-gradient(135deg,#6366f1,#4f46e5)] border-0 rounded-[18px_18px_4px_18px]'
                    : 'bg-white/5 border border-white/10 rounded-[18px_18px_18px_4px]'
                )}
              >
                {msg.text}
              </div>

              {msg.sender === 'ai' && (
                <button
                  type="button"
                  onClick={() => handleCopyText(msg.text, msg.id)}
                  className="absolute top-[0.4rem] right-[-2rem] bg-transparent border-0 text-[#64748b] cursor-pointer p-[0.2rem]"
                  title="Copy text"
                >
                  {copiedId === msg.id ? <Check size={14} color="#4ade80" /> : <Copy size={14} />}
                </button>
              )}
            </div>

            {msg.sender === 'user' && (
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                <User size={20} color="#cbd5e1" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[linear-gradient(135deg,#6366f1,#a855f7)] flex items-center justify-center">
              <Bot size={20} color="#ffffff" />
            </div>
            <div className="bg-white/5 py-3 px-5 rounded-[18px] text-[#94a3b8] text-[0.9rem] flex items-center gap-2">
              <Sparkles size={14} className="animate-spin" color="#818cf8" /> AI is thinking...
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Bar */}
      <form
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="mt-4 flex gap-3"
      >
        <input
          type="text"
          className="glass-input flex-1 py-[0.9rem] px-5 text-[0.95rem]"
          placeholder="Ask AI for advice, journaling prompts, rephrasing..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit" disabled={loading || !input.trim()} className="btn-primary py-[0.9rem] px-6">
          <Send size={18} />
          <span>Send</span>
        </button>
      </form>
    </div>
  );
}
