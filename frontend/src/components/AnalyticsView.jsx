import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { Smile, TrendingUp, Flame, Award, BarChart3 } from 'lucide-react';

export default function AnalyticsView() {
  const trendData = [
    { day: 'Mon', score: 85, mood: 'Happy' },
    { day: 'Tue', score: 92, mood: 'Excited' },
    { day: 'Wed', score: 78, mood: 'Relaxed' },
    { day: 'Thu', score: 88, mood: 'Happy' },
    { day: 'Fri', score: 95, mood: 'Excited' },
    { day: 'Sat', score: 90, mood: 'Grateful' },
    { day: 'Sun', score: 94, mood: 'Happy' },
  ];

  const moodBreakdown = [
    { name: 'Happy 😊', value: 14, color: '#4ade80' },
    { name: 'Excited 🤩', value: 7, color: '#fde047' },
    { name: 'Relaxed 😌', value: 5, color: '#38bdf8' },
    { name: 'Stressed 😰', value: 2, color: '#f87171' },
    { name: 'Grateful 🙏', value: 4, color: '#fb7185' },
  ];

  return (
    <div style={{ padding: '2rem', maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '2rem', fontWeight: '800' }}>Mood & Sentiment Analytics</h1>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Advanced emotional intelligence powered by Recharts & Python Machine Learning</p>
      </div>

      {/* Top Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <Smile size={32} color="#4ade80" style={{ marginBottom: '0.4rem' }} />
          <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Dominant Mood</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#4ade80' }}>HAPPY 😊</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <TrendingUp size={32} color="#38bdf8" style={{ marginBottom: '0.4rem' }} />
          <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Positivity Rate</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#38bdf8' }}>92.5%</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <Flame size={32} color="#fde047" style={{ marginBottom: '0.4rem' }} />
          <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Streak Counter</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#fde047' }}>7 Days</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <Award size={32} color="#c084fc" style={{ marginBottom: '0.4rem' }} />
          <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>AI Level</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#c084fc' }}>Master Journaler</div>
        </div>
      </div>

      {/* Chart 1: Recharts Positivity Trend AreaChart */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#f8fafc' }}>Weekly Positivity Trend</h3>
          <span style={{ fontSize: '0.8rem', color: '#6366f1', background: 'rgba(99,102,241,0.15)', padding: '0.2rem 0.6rem', borderRadius: '8px', fontWeight: '600' }}>
            Live Stream
          </span>
        </div>
        <div style={{ width: '100%', height: 280 }}>
          <ResponsiveContainer>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="scoreGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.5}/>
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="day" stroke="#64748b" tick={{ fill: '#94a3b8' }} />
              <YAxis domain={[50, 100]} stroke="#64748b" tick={{ fill: '#94a3b8' }} />
              <Tooltip
                contentStyle={{ background: '#101426', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
              />
              <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#scoreGlow)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Recharts Mood Frequency BarChart */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#f8fafc', marginBottom: '1.5rem' }}>
          Mood Frequency Breakdown
        </h3>
        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer>
            <BarChart data={moodBreakdown}>
              <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#94a3b8' }} />
              <YAxis stroke="#64748b" tick={{ fill: '#94a3b8' }} />
              <Tooltip contentStyle={{ background: '#101426', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {moodBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
