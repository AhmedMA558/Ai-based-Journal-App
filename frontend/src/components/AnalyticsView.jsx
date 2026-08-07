import React from 'react';
import { BarChart3, TrendingUp, Smile, Heart, Flame, Zap, Award } from 'lucide-react';

export default function AnalyticsView() {
  const moodData = [
    { mood: 'Happy 😊', count: 12, percent: 50, color: '#4ade80' },
    { mood: 'Excited 🤩', count: 6, percent: 25, color: '#fde047' },
    { mood: 'Relaxed 😌', count: 4, percent: 15, color: '#38bdf8' },
    { mood: 'Stressed 😰', count: 2, percent: 10, color: '#f87171' },
  ];

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '2rem', fontWeight: '800' }}>Mood & Sentiment Analytics</h1>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Real-time emotional trends analyzed by Python Flask Machine Learning</p>
      </div>

      {/* Metrics Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <Smile size={32} color="#4ade80" style={{ marginBottom: '0.5rem' }} />
          <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Dominant Mood</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#4ade80' }}>HAPPY 😊</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <TrendingUp size={32} color="#38bdf8" style={{ marginBottom: '0.5rem' }} />
          <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Positivity Score</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#38bdf8' }}>92%</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <Flame size={32} color="#fde047" style={{ marginBottom: '0.5rem' }} />
          <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Journal Streak</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#fde047' }}>7 Days</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <Award size={32} color="#c084fc" style={{ marginBottom: '0.5rem' }} />
          <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>AI Level</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#c084fc' }}>Master Journaler</div>
        </div>
      </div>

      {/* Mood Distribution Progress Bars */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '1.5rem' }}>Mood Distribution Breakdown</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {moodData.map((item, idx) => (
            <div key={idx}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.4rem', fontWeight: '600' }}>
                <span>{item.mood}</span>
                <span style={{ color: item.color }}>{item.count} Entries ({item.percent}%)</span>
              </div>
              <div style={{ height: '10px', width: '100%', background: 'rgba(255,255,255,0.06)', borderRadius: '5px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${item.percent}%`, background: item.color, borderRadius: '5px', transition: 'width 1s ease-in-out' }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
