import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { journalService } from '../services/journalService';

export default function CalendarView({ onSelectJournal }) {
  const [journals, setJournals] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    fetchJournals();
  }, []);

  const fetchJournals = async () => {
    try {
      const res = await journalService.getAllJournals();
      const list = res?.data || res || [];
      setJournals(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Calendar error:', err);
    }
  };

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

  // Days in month calculation
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const days = [];
  for (let i = 0; i < firstDayIndex; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // Map journal entry by date string (YYYY-MM-DD)
  const journalMap = {};
  journals.forEach((j) => {
    if (j.createdAt) {
      const d = new Date(j.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      journalMap[key] = j;
    }
  });

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800' }}>Mood Calendar & Timeline</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Visual emotional tracking mapped across calendar days</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button onClick={prevMonth} className="btn-secondary" style={{ padding: '0.5rem' }}><ChevronLeft size={18} /></button>
          <span style={{ fontSize: '1.1rem', fontWeight: '700', color: '#f8fafc', minWidth: '140px', textAlign: 'center' }}>
            {monthNames[month]} {year}
          </span>
          <button onClick={nextMonth} className="btn-secondary" style={{ padding: '0.5rem' }}><ChevronRight size={18} /></button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="glass-panel" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.75rem', textAlign: 'center', fontWeight: '600', color: '#94a3b8', marginBottom: '1rem', fontSize: '0.85rem' }}>
          <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.75rem' }}>
          {days.map((day, idx) => {
            if (!day) {
              return <div key={idx} style={{ height: '80px', opacity: 0.2 }}></div>;
            }

            const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const journalForDay = journalMap[dateKey];

            return (
              <div
                key={idx}
                onClick={() => journalForDay && onSelectJournal(journalForDay)}
                style={{
                  height: '80px',
                  borderRadius: '12px',
                  background: journalForDay ? 'rgba(99, 102, 241, 0.18)' : 'rgba(255,255,255,0.03)',
                  border: journalForDay ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid rgba(255,255,255,0.05)',
                  padding: '0.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  cursor: journalForDay ? 'pointer' : 'default',
                  transition: 'all 0.2s'
                }}
              >
                <span style={{ fontSize: '0.8rem', fontWeight: '600', color: journalForDay ? '#f8fafc' : '#64748b' }}>{day}</span>
                {journalForDay && (
                  <div style={{ fontSize: '1.4rem', textAlign: 'center' }}>
                    {getMoodEmoji(journalForDay.mood)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
