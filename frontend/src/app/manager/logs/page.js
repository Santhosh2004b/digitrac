"use client";
import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

const API = 'http://localhost:8000';
const tok = () => localStorage.getItem('token');

const Icons = {
  Grid: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  Users: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Clock: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Logout: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  Filter: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
  Refresh: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><polyline points="21 3 21 8 16 8"/></svg>,
};

const FEED_COLORS = {
  '⚠ Delay Alert':    { border: '#ef4444', bg: 'rgba(239,68,68,0.06)',   badge: '#ef4444', text: '#fca5a5' },
  '🟢 Progress Update': { border: '#00ffd1', bg: 'rgba(0,255,209,0.04)',  badge: '#00ffd1', text: '#00ffd1' },
  '📋 Activity Log':  { border: '#3b82f6', bg: 'rgba(59,130,246,0.05)',  badge: '#3b82f6', text: '#93c5fd' },
};

function Sidebar({ onNav, active }) {
  const router = useRouter();
  return (
    <aside style={{ width: 240, background: '#05070f', borderRight: '1px solid rgba(0,255,200,0.08)', display: 'flex', flexDirection: 'column', padding: '1.5rem 0.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0 0.75rem', marginBottom: '2rem' }}>
        <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(0,242,255,0.05)', border: '1px solid rgba(0,242,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="20" height="20" viewBox="0 0 100 100" fill="#00f2ff"><path d="M50 20 C45 20 40 25 35 35 L20 70 C18 75 22 80 28 78 C35 75 45 70 50 70 C55 70 65 75 72 78 C78 80 82 75 80 70 L65 35 C60 25 55 20 50 20 Z"/></svg>
        </div>
        <div>
          <div style={{ fontSize: '1.1rem', fontWeight: 950, color: '#fff', letterSpacing: '0.05em' }}>DIGITRAC</div>
          <div style={{ fontSize: '0.55rem', color: '#00f2ff', fontWeight: 800, letterSpacing: '0.25em' }}>PROJECT TRACKING</div>
        </div>
      </div>

      <div style={{ fontSize: '0.55rem', color: 'rgba(136,150,171,0.5)', fontWeight: 800, letterSpacing: '0.15em', padding: '0 0.75rem', marginBottom: '0.5rem' }}>CORE</div>
      {[
        { label: 'Dashboard', icon: <Icons.Grid />, path: '/manager' },
      ].map(item => (
        <div key={item.path} onClick={() => router.push(item.path)} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.7rem 0.75rem', borderRadius: '8px', cursor: 'pointer', color: '#8896ab', fontSize: '0.72rem', fontWeight: 700, marginBottom: '2px', transition: 'all 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          {item.icon}<span>{item.label}</span>
        </div>
      ))}

      <div style={{ fontSize: '0.55rem', color: 'rgba(136,150,171,0.5)', fontWeight: 800, letterSpacing: '0.15em', padding: '1rem 0.75rem 0.5rem' }}>OPERATIONS</div>
      {[
        { label: 'Resources', icon: <Icons.Users />, path: '/manager/resources', id: 'RES' },
        { label: 'Time Logs', icon: <Icons.Clock />, path: '/manager/logs', id: 'LOGS' },
      ].map(item => (
        <div key={item.id} onClick={() => router.push(item.path)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.7rem 0.75rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700, marginBottom: '2px', transition: 'all 0.2s', position: 'relative',
            background: item.id === 'LOGS' ? 'rgba(0,255,200,0.06)' : 'transparent',
            color: item.id === 'LOGS' ? '#00ffd1' : '#8896ab',
            borderLeft: item.id === 'LOGS' ? '2px solid #00ffd1' : '2px solid transparent' }}>
          {item.icon}<span>{item.label}</span>
        </div>
      ))}

      <div style={{ marginTop: 'auto', padding: '1rem 0.75rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#fff', marginBottom: '0.25rem' }}>PROJECT MANAGER</div>
        <div style={{ fontSize: '0.55rem', color: '#8896ab', marginBottom: '1rem' }}>{typeof window !== 'undefined' ? localStorage.getItem('user_email') || 'manager@arche.global' : ''}</div>
        <button onClick={() => { localStorage.clear(); router.push('/'); }}
          style={{ width: '100%', padding: '0.5rem', background: 'rgba(255,68,68,0.05)', color: '#ff4444', border: '1px solid rgba(255,68,68,0.15)', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <Icons.Logout /> SIGN OUT
        </button>
      </div>
    </aside>
  );
}

export default function TimeLogs() {
  const router = useRouter();
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ project: 'ALL', severity: 'ALL' });
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchFeed = async () => {
    try {
      const res = await fetch(`${API}/vp/manager-feed`, { headers: { Authorization: `Bearer ${tok()}` } });
      if (res.ok) { setFeed(await res.json()); setLastRefresh(new Date()); }
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchFeed();
    const interval = setInterval(fetchFeed, 30000);
    return () => clearInterval(interval);
  }, []);

  const projects = useMemo(() => ['ALL', ...new Set(feed.map(f => f.project).filter(Boolean))], [feed]);
  const severities = ['ALL', 'HIGH', 'MEDIUM', 'LOW'];

  const filtered = feed.filter(f =>
    (filter.project === 'ALL' || f.project === filter.project) &&
    (filter.severity === 'ALL' || f.severity === filter.severity)
  );

  const stats = useMemo(() => ({
    total: filtered.length,
    alerts: filtered.filter(f => f.severity === 'HIGH').length,
    progress: filtered.filter(f => f.severity === 'LOW').length,
    avgCompletion: filtered.length > 0
      ? Math.round(filtered.reduce((acc, f) => acc + (f.actual_hours / (f.est_hours || 1) * 100), 0) / filtered.length)
      : 0
  }), [filtered]);

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#05070f', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00ffd1', fontWeight: 800, letterSpacing: '0.2em' }}>
      LOADING ACTIVITY LOGS...
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#05070f', color: '#fff', fontFamily: "'Inter', sans-serif" }}>
      <Sidebar />

      <main style={{ flex: 1, padding: '2rem', overflowY: 'auto', height: '100vh' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 950, margin: 0 }}>
              TIME LOGS & <span style={{ color: '#00ffd1' }}>ACTIVITY</span>
            </h1>
            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.75rem', fontSize: '0.7rem', color: '#8896ab', fontWeight: 700 }}>
              <span>TOTAL EVENTS: <strong style={{ color: '#fff' }}>{stats.total}</strong></span>
              <span style={{ color: 'rgba(255,255,255,0.1)' }}>|</span>
              <span>ALERTS: <strong style={{ color: '#ef4444' }}>{stats.alerts}</strong></span>
              <span style={{ color: 'rgba(255,255,255,0.1)' }}>|</span>
              <span>PROGRESS UPDATES: <strong style={{ color: '#00ffd1' }}>{stats.progress}</strong></span>
              <span style={{ color: 'rgba(255,255,255,0.1)' }}>|</span>
              <span>AVG COMPLETION: <strong style={{ color: '#3b82f6' }}>{stats.avgCompletion}%</strong></span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div style={{ fontSize: '0.6rem', color: '#8896ab', fontWeight: 700 }}>
              UPDATED: {lastRefresh.toLocaleTimeString()}
            </div>
            <button onClick={fetchFeed} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.65rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Icons.Refresh /> REFRESH
            </button>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', alignItems: 'center' }}>
          <Icons.Filter />
          <select value={filter.project} onChange={e => setFilter({ ...filter, project: e.target.value })}
            style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer', outline: 'none' }}>
            {projects.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={filter.severity} onChange={e => setFilter({ ...filter, severity: e.target.value })}
            style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer', outline: 'none' }}>
            {severities.map(s => <option key={s} value={s}>{s === 'ALL' ? 'ALL SEVERITIES' : s}</option>)}
          </select>
          {/* Live pulse */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.65rem', fontWeight: 800, color: '#00ffd1' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#00ffd1', boxShadow: '0 0 8px #00ffd1', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
            LIVE FEED
          </div>
        </div>

        {/* Activity Stream */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <AnimatePresence>
            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem', color: '#8896ab', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em' }}>
                NO ACTIVITY DATA — Assign resources to see live logs.
              </div>
            ) : filtered.map((item, idx) => {
              const colors = FEED_COLORS[item.type] || FEED_COLORS['📋 Activity Log'];
              const pct = item.est_hours > 0 ? Math.min(100, Math.round(item.actual_hours / item.est_hours * 100)) : 0;
              const ts = new Date(item.timestamp);
              const timeAgo = Math.round((Date.now() - ts.getTime()) / 60000);

              return (
                <motion.div key={idx}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  style={{ background: colors.bg, border: `1px solid rgba(255,255,255,0.05)`, borderLeft: `3px solid ${colors.border}`, borderRadius: '10px', padding: '1rem 1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontSize: '0.6rem', fontWeight: 900, background: `rgba(${colors.border === '#ef4444' ? '239,68,68' : colors.border === '#00ffd1' ? '0,255,209' : '59,130,246'},0.15)`, color: colors.text, padding: '0.2rem 0.6rem', borderRadius: '4px', letterSpacing: '0.05em' }}>
                        {item.type}
                      </span>
                      {item.project && item.project !== 'SYSTEM' && (
                        <span style={{ fontSize: '0.6rem', fontWeight: 700, color: '#8896ab', background: 'rgba(255,255,255,0.04)', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                          {item.project}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.6rem', color: '#8896ab', fontWeight: 600 }}>
                      {timeAgo < 60 ? `${timeAgo}m ago` : `${Math.round(timeAgo/60)}h ago`}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#c8d6e5', fontWeight: 600, lineHeight: 1.5, marginBottom: item.est_hours > 0 ? '0.75rem' : 0 }}>
                    {item.message}
                  </div>
                  {item.est_hours > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ flex: 1, height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: pct > 100 ? '#ef4444' : pct > 60 ? '#00ffd1' : '#3b82f6', borderRadius: '4px', transition: '1s ease' }} />
                      </div>
                      <span style={{ fontSize: '0.65rem', fontWeight: 800, color: colors.text, minWidth: '80px', textAlign: 'right' }}>
                        {item.actual_hours}h / {item.est_hours}h ({pct}%)
                      </span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </main>

      <style>{`
        @keyframes pulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.4; transform:scale(0.8); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
        @media (max-width: 768px) {
          body > div { flex-direction: column; }
          aside { width: 100% !important; border-right: none !important; border-bottom: 1px solid rgba(0,255,200,0.08); padding: 1rem !important; }
          main > div:first-child { flex-direction: column; align-items: flex-start !important; gap: 1rem; }
          main > div:first-child > div:last-child { width: 100%; justify-content: space-between; }
          main > div:nth-child(2) { flex-wrap: wrap; }
          main > div:nth-child(2) select { width: 100%; }
        }
      `}</style>
    </div>
  );
}
