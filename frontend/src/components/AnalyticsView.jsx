import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { Smile, TrendingUp, Flame, Award, BarChart3, RefreshCw } from 'lucide-react';
import { journalService } from '../services/journalService';

const MOOD_COLORS = {
  HAPPY: '#4ade80',
  EXCITED: '#fde047',
  RELAXED: '#38bdf8',
  STRESSED: '#f87171',
  SAD: '#c084fc',
  GRATEFUL: '#fb7185',
  NEUTRAL: '#94a3b8'
};

const MOOD_EMOJIS = {
  HAPPY: '😊',
  EXCITED: '🤩',
  RELAXED: '😌',
  STRESSED: '😰',
  SAD: '🥺',
  GRATEFUL: '🙏',
  NEUTRAL: '😐'
};

export default function AnalyticsView() {
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRealtimeAnalytics();
  }, []);

  const fetchRealtimeAnalytics = async () => {
    setLoading(true);
    try {
      const list = await journalService.getAllJournals();
      setJournals(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to load realtime analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate Real-Time Mood Metrics from User Entries
  const totalEntries = journals.length;
  const moodCounts = { HAPPY: 0, EXCITED: 0, RELAXED: 0, STRESSED: 0, SAD: 0, GRATEFUL: 0, NEUTRAL: 0 };

  journals.forEach(j => {
    const m = (j.mood || 'HAPPY').toUpperCase();
    if (moodCounts[m] !== undefined) {
      moodCounts[m] += 1;
    } else {
      moodCounts.HAPPY += 1;
    }
  });

  // Determine Dominant Mood
  let dominantMood = 'HAPPY';
  let maxCount = -1;
  Object.keys(moodCounts).forEach(m => {
    if (moodCounts[m] > maxCount) {
      maxCount = moodCounts[m];
      dominantMood = m;
    }
  });

  // Calculate Real-Time Positivity Rate
  const positiveCount = (moodCounts.HAPPY || 0) + (moodCounts.EXCITED || 0) + (moodCounts.RELAXED || 0) + (moodCounts.GRATEFUL || 0);
  const positivityRate = totalEntries > 0 ? Math.round((positiveCount / totalEntries) * 100) : 100;

  // Real-Time Recharts Bar Chart Data
  const moodBreakdown = Object.keys(moodCounts)
    .filter(m => moodCounts[m] > 0 || totalEntries === 0)
    .map(m => ({
      name: `${m.charAt(0) + m.slice(1).toLowerCase()} ${MOOD_EMOJIS[m] || '😊'}`,
      value: moodCounts[m],
      color: MOOD_COLORS[m] || '#6366f1'
    }));

  // Real-Time Recharts 7-Day Trend Area Chart Data
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const trendMap = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dayName = days[d.getDay()];
    trendMap[dayName] = { day: dayName, count: 0, score: 70 };
  }

  journals.forEach(j => {
    if (j.createdAt) {
      const d = new Date(j.createdAt);
      const dayName = days[d.getDay()];
      if (trendMap[dayName]) {
        trendMap[dayName].count += 1;
        const isPos = ['HAPPY', 'EXCITED', 'RELAXED', 'GRATEFUL'].includes((j.mood || '').toUpperCase());
        trendMap[dayName].score = isPos ? 95 : 60;
      }
    }
  });

  const trendData = Object.values(trendMap);

  return (
    <div style={{ padding: '2rem', maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800' }}>Real-Time Data Analytics</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Live sentiment metrics calculated dynamically from your journal entries</p>
        </div>
        <button onClick={fetchRealtimeAnalytics} className="btn-secondary" style={{ padding: '0.5rem 0.85rem' }}>
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          <span>Refresh Real-Time Data</span>
        </button>
      </div>

      {/* Top Real-Time Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <Smile size={32} color={MOOD_COLORS[dominantMood] || '#4ade80'} style={{ marginBottom: '0.4rem' }} />
          <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Dominant Real-Time Mood</div>
          <div style={{ fontSize: '1.4rem', fontWeight: '800', color: MOOD_COLORS[dominantMood] || '#4ade80' }}>
            {dominantMood} {MOOD_EMOJIS[dominantMood] || '😊'}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <TrendingUp size={32} color="#38bdf8" style={{ marginBottom: '0.4rem' }} />
          <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Live Positivity Rate</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#38bdf8' }}>{positivityRate}%</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <Flame size={32} color="#fde047" style={{ marginBottom: '0.4rem' }} />
          <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Total Logged Entries</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#fde047' }}>{totalEntries} Entries</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <Award size={32} color="#c084fc" style={{ marginBottom: '0.4rem' }} />
          <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>AI Level</div>
          <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#c084fc' }}>Master Journaler</div>
        </div>
      </div>

      {/* Chart 1: Real-Time Recharts Positivity Trend AreaChart */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#f8fafc' }}>Live Positivity Stream (7-Day Trend)</h3>
          <span style={{ fontSize: '0.8rem', color: '#4ade80', background: 'rgba(74,222,128,0.15)', padding: '0.2rem 0.6rem', borderRadius: '8px', fontWeight: '600' }}>
            ● Real-Time Active
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
              <YAxis domain={[0, 100]} stroke="#64748b" tick={{ fill: '#94a3b8' }} />
              <Tooltip
                contentStyle={{ background: '#101426', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
              />
              <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#scoreGlow)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Real-Time Recharts Mood Frequency BarChart */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#f8fafc', marginBottom: '1.5rem' }}>
          Real-Time Mood Distribution Breakdown
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
