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
  Search: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  X: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Plus: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Trash: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>,
};

const statusColor = (s) => ({ Available: '#00ffd1', Allocated: '#3b82f6', Bench: '#f59e0b', Overloaded: '#ef4444' }[s] || '#8896ab');

export default function ResourceHub() {
  const router = useRouter();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [addModal, setAddModal] = useState(false);
  
  // High fidelity form states matching the new model
  const [form, setForm] = useState({
    employee_id: '',
    name: '',
    email: '',
    grade: 'L2 Senior Consultant',
    role_practice: 'Cloud Engineering',
    hourly_billing_rate: 2000,
    cost_rate: 1000,
    skill_category: 'Cloud Services',
    status: 'Available',
    region: 'APJ',
    manager_email: ''
  });
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchResources = async () => {
    try {
      const res = await fetch(`${API}/manager/centralized-resources`, { headers: { Authorization: `Bearer ${tok()}` } });
      if (res.ok) setResources(await res.json());
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchResources();
    if (typeof window !== 'undefined') {
      const email = localStorage.getItem('user_email') || 'manager@digitrac.com';
      setForm(prev => ({ ...prev, manager_email: email }));
    }
  }, []);

  const filtered = resources.filter(r =>
    (r.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.employee_id || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.grade || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.role_practice || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.skill_category || '').toLowerCase().includes(search.toLowerCase())
  );

  const stats = useMemo(() => ({
    total: resources.length,
    allocated: resources.filter(r => r.status === 'Allocated' || r.status === 'Busy').length,
    overloaded: resources.filter(r => r.status === 'Overloaded').length,
    available: resources.filter(r => r.status === 'Available').length,
    bench: resources.filter(r => r.status === 'Bench').length,
    avgUtil: Math.round(resources.reduce((a, r) => a + (r.utilization || 0), 0) / (resources.length || 1))
  }), [resources]);

  const navTo = (path) => router.push(path);

  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    
    // Auto-generate employee ID if empty
    let finalForm = { ...form };
    if (!finalForm.employee_id) {
      finalForm.employee_id = `EMP-${Math.floor(100 + Math.random() * 900)}`;
    }
    
    try {
      const res = await fetch(`${API}/manager/centralized-resources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` },
        body: JSON.stringify(finalForm)
      });
      if (res.ok) {
        setAddModal(false);
        const mgrEmail = typeof window !== 'undefined' ? localStorage.getItem('user_email') || 'manager@digitrac.com' : 'manager@digitrac.com';
        setForm({
          employee_id: '',
          name: '',
          email: '',
          grade: 'L2 Senior Consultant',
          role_practice: 'Cloud Engineering',
          hourly_billing_rate: 2000,
          cost_rate: 1000,
          skill_category: 'Cloud Services',
          status: 'Available',
          region: 'APJ',
          manager_email: mgrEmail
        });
        await fetchResources();
      } else {
        const data = await res.json();
        setError(data.detail || 'Failed to register fleet resource.');
      }
    } catch (e) {
      setError('Service connection validation failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Verify: Are you sure you want to remove ${name} from the Resource Master Database?`)) return;
    try {
      const res = await fetch(`${API}/manager/centralized-resources/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${tok()}` }
      });
      if (res.ok) {
        if (selected?.id === id) setSelected(null);
        await fetchResources();
      }
    } catch(e) { console.error(e); }
  };

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#05070f', display:'flex', flexDirection: 'column', alignItems:'center', justifyContent:'center' }}>
      <motion.div animate={{ opacity: [0.4, 1, 0.4], scale: [0.9, 1.1, 0.9] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}>
        <svg width="64" height="64" viewBox="0 0 100 100" fill="#00ffc8" style={{ filter: 'drop-shadow(0 0 15px rgba(0, 255, 200, 0.6))' }}>
           <path d="M50 20 C45 20 40 25 35 35 L20 70 C18 75 22 80 28 78 C35 75 45 70 50 70 C55 70 65 75 72 78 C78 80 82 75 80 70 L65 35 C60 25 55 20 50 20 Z" />
        </svg>
      </motion.div>
    </div>
  );

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#05070f', color:'#fff', fontFamily:"'Inter',sans-serif" }}>
      {/* Sidebar */}
      <aside style={{ width:240, background:'#05070f', borderRight:'1px solid rgba(0,255,200,0.08)', display:'flex', flexDirection:'column', padding:'1.5rem 0.75rem', flexShrink:0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0 0.5rem', marginBottom: '2rem' }}>
          <div style={{ width: 40, height: 40, background: 'transparent', border: '2px solid rgba(0,255,200,0.3)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 30px rgba(0, 255, 200, 0.1)', flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 100 100" fill="#00ffc8">
               <path d="M50 20 C45 20 40 25 35 35 L20 70 C18 75 22 80 28 78 C35 75 45 70 50 70 C55 70 65 75 72 78 C78 80 82 75 80 70 L65 35 C60 25 55 20 50 20 Z" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 950, margin: 0, letterSpacing: '-0.02em', background: 'linear-gradient(to bottom, #fff 50%, rgba(0,255,200,0.4))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1 }}>DIGITRAC</div>
            <div style={{ fontSize: '0.6rem', fontWeight: 900, color: '#00ffc8', letterSpacing: '0.4em', textTransform: 'uppercase', marginTop: '0.2rem' }}>ARCHE</div>
          </div>
        </div>
        <div style={{ fontSize: '0.55rem', color: 'rgba(136,150,171,0.5)', fontWeight: 800, letterSpacing: '0.15em', padding: '0 0.75rem', marginBottom: '0.5rem' }}>CORE</div>
        <div onClick={() => navTo('/manager')} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.7rem 0.75rem', borderRadius: '8px', cursor: 'pointer', color: '#8896ab', fontSize: '0.72rem', fontWeight: 700, marginBottom: '2px' }}>
          <Icons.Grid /><span>Dashboard</span>
        </div>
        <div style={{ fontSize: '0.55rem', color: 'rgba(136,150,171,0.5)', fontWeight: 800, letterSpacing: '0.15em', padding: '1rem 0.75rem 0.5rem' }}>OPERATIONS</div>
        {[{ label: 'Resources', icon: <Icons.Users />, path: '/manager/resources', id: 'RES' }, { label: 'Time Logs', icon: <Icons.Clock />, path: '/manager/logs', id: 'LOGS' }].map(item => (
          <div key={item.id} onClick={() => navTo(item.path)} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 0.75rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700, marginBottom: '2px', transition: 'all 0.2s', background: item.id === 'RES' ? 'rgba(0,255,200,0.06)' : 'transparent', color: item.id === 'RES' ? '#00ffd1' : '#8896ab', borderLeft: item.id === 'RES' ? '2px solid #00ffd1' : '2px solid transparent' }}>
            {item.icon}<span>{item.label}</span>
          </div>
        ))}
        <div style={{ marginTop: 'auto', padding: '1rem 0.75rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#fff', marginBottom: '0.25rem' }}>MANAGER PROFILE</div>
          <div style={{ fontSize: '0.55rem', color: '#8896ab', marginBottom: '1rem' }}>{typeof window !== 'undefined' ? localStorage.getItem('user_email') || 'manager@arche.global' : ''}</div>
          <button onClick={() => { localStorage.clear(); router.push('/'); }} style={{ width: '100%', padding: '0.5rem', background: 'rgba(255,68,68,0.05)', color: '#ff4444', border: '1px solid rgba(255,68,68,0.15)', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 800, cursor: 'pointer' }}>
            <Icons.Logout /> DEACTIVATE SESSION
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, padding: '2rem', overflowY: 'auto', height: '100vh' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 950, margin: 0 }}>RESOURCE <span style={{ color: '#00f2ff' }}>MASTER DATABASE</span></h1>
            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.75rem', fontSize: '0.7rem', color: '#8896ab', fontWeight: 700 }}>
              <span>FLEET TOTAL: <strong style={{ color: '#fff' }}>{stats.total}</strong></span>
              <span style={{ color: 'rgba(255,255,255,0.1)' }}>|</span>
              <span>AVAILABLE: <strong style={{ color: '#00ffd1' }}>{stats.available}</strong></span>
              <span style={{ color: 'rgba(255,255,255,0.1)' }}>|</span>
              <span>ALLOCATED: <strong style={{ color: '#3b82f6' }}>{stats.allocated}</strong></span>
              <span style={{ color: 'rgba(255,255,255,0.1)' }}>|</span>
              <span>BENCH: <strong style={{ color: '#f59e0b' }}>{stats.bench}</strong></span>
              <span style={{ color: 'rgba(255,255,255,0.1)' }}>|</span>
              <span>OVERLOADED: <strong style={{ color: '#ef4444' }}>{stats.overloaded}</strong></span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#0d1117', border: '1px solid rgba(0,242,255,0.15)', padding: '0.5rem 1rem', borderRadius: '10px', width: '260px' }}>
              <Icons.Search />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="FILTER RESOURCE MASTER..."
                style={{ background: 'transparent', border: 'none', color: '#fff', outline: 'none', fontSize: '0.72rem', fontWeight: 700, width: '100%' }} />
            </div>
            <button onClick={() => setAddModal(true)} style={{ background: '#00ffd1', color: '#000', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '10px', fontSize: '0.72rem', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 0 15px rgba(0, 255, 209, 0.3)' }}>
              <Icons.Plus /> REGISTER ENGINEER
            </button>
          </div>
        </div>

        {/* Stats cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          {[
            { label: 'MASTER NODE COUNT', val: stats.total, color: '#fff', subtitle: 'Centralized engineering fleet' },
            { label: 'ACTIVE DEPLOYED FORCE', val: stats.allocated, color: '#3b82f6', subtitle: 'Engaged on project nodes' },
            { label: 'BENCH RESERVE CAPACITY', val: stats.bench, color: '#f59e0b', subtitle: 'Awaiting deployment' },
            { label: 'FLEET AVERAGE UTILIZATION', val: `${stats.avgUtil}%`, color: '#00ffd1', subtitle: 'Booked hours / 160h base' },
          ].map((s, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '1rem 1.25rem' }}>
              <div style={{ fontSize: '0.55rem', color: '#8896ab', fontWeight: 800, marginBottom: '0.35rem' }}>{s.label}</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 950, color: s.color, lineHeight: 1 }}>{s.val}</div>
              <div style={{ fontSize: '0.55rem', color: '#8896ab', marginTop: '0.4rem' }}>{s.subtitle}</div>
            </div>
          ))}
        </div>

        {/* Grid + Detail panel */}
        <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 340px' : '1fr', gap: '1.5rem', transition: 'all 0.3s' }}>
          <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {['EMPLOYEE', 'GRADE', 'ROLE / PRACTICE', 'BILLING VALUE', 'COST VALUE', 'BOOKINGS', 'UTILIZATION', 'STATUS', ''].map((h, i) => (
                    <th key={i} style={{ padding: '0.75rem 1rem', fontSize: '0.6rem', fontWeight: 800, color: '#8896ab', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan="9" style={{ padding: '3rem', textAlign: 'center', color: '#8896ab', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em' }}>
                    NO_FLEET_RESOURCES_FOUND — Create a new master resource card
                  </td></tr>
                ) : filtered.map((r, idx) => (
                  <tr key={idx} onClick={() => setSelected(r === selected ? null : r)}
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', cursor: 'pointer', background: selected?.id === r.id ? 'rgba(0,242,255,0.04)' : 'transparent', transition: 'background 0.2s' }}>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: 32, height: 32, borderRadius: '8px', background: `linear-gradient(135deg, #6C63FF, #3b82f6)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 950 }}>
                          {r.employee_id?.replace('EMP-', '') || 'EE'}
                        </div>
                        <div>
                          <strong style={{ fontSize: '0.78rem', display: 'block' }}>{r.name}</strong>
                          <span style={{ fontSize: '0.6rem', color: '#8896ab' }}>{r.email}</span>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.72rem', color: '#a78bfa', fontWeight: 700 }}>{r.grade}</td>
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.72rem', color: '#8896ab', fontWeight: 700 }}>{r.role_practice}</td>
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.72rem', color: '#00ffd1', fontWeight: 800 }}>₹{r.hourly_billing_rate.toLocaleString()}/h</td>
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.72rem', color: '#ef4444', fontWeight: 800 }}>₹{r.cost_rate.toLocaleString()}/h</td>
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.72rem', color: '#3b82f6', fontWeight: 700 }}>
                      {r.booking_hours}h
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ flex: 1, height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden', minWidth: '60px' }}>
                          <div style={{ height: '100%', width: `${Math.min(r.utilization || 0, 100)}%`, background: r.utilization > 100 ? '#ef4444' : r.utilization > 70 ? '#f59e0b' : '#00ffd1', borderRadius: '4px' }} />
                        </div>
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, color: statusColor(r.status), minWidth: '32px' }}>{r.utilization}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: statusColor(r.status), boxShadow: `0 0 8px ${statusColor(r.status)}`, display: 'inline-block' }} />
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, color: statusColor(r.status) }}>{r.status}</span>
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={(e) => { e.stopPropagation(); router.push('/manager'); }}
                          style={{ background: 'transparent', border: '1px solid rgba(0,255,209,0.3)', color: '#00ffd1', padding: '0.3rem 0.6rem', borderRadius: '5px', fontSize: '0.6rem', fontWeight: 800, cursor: 'pointer' }}>
                          DEPLOY
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(r.id, r.name); }}
                          style={{ background: 'rgba(255,68,68,0.05)', border: '1px solid rgba(255,68,68,0.15)', color: '#ff4444', padding: '0.3rem 0.4rem', borderRadius: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                          <Icons.Trash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Detail Panel */}
          <AnimatePresence>
            {selected && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '1.5rem', height: 'fit-content' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#8896ab', letterSpacing: '0.1em' }}>MASTER_PROFILE</span>
                  <button onClick={() => setSelected(null)} style={{ background: 'transparent', border: 'none', color: '#8896ab', cursor: 'pointer' }}><Icons.X /></button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{ width: 48, height: 48, borderRadius: '12px', background: 'linear-gradient(135deg, #6C63FF, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 950 }}>
                    {selected.employee_id}
                  </div>
                  <div>
                    <div style={{ fontSize: '1rem', fontWeight: 900 }}>{selected.name}</div>
                    <div style={{ fontSize: '0.65rem', color: '#8896ab', fontWeight: 700 }}>{selected.email}</div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.5rem' }}>
                  {[
                    { l: 'GRADE', v: selected.grade, c: '#a78bfa' },
                    { l: 'ROLE / PRACTICE', v: selected.role_practice, c: '#fff' },
                    { l: 'SKILL CATEGORY', v: selected.skill_category || 'General Services', c: '#00ffd1' },
                    { l: 'HOURLY BILLING RATE', v: `₹${selected.hourly_billing_rate.toLocaleString()}/hr`, c: '#00ffd1' },
                    { l: 'COST RATE', v: `₹${selected.cost_rate.toLocaleString()}/hr`, c: '#ef4444' },
                    { l: 'MARGIN SPREAD', v: `₹${(selected.hourly_billing_rate - selected.cost_rate).toLocaleString()}/hr (${Math.round((selected.hourly_billing_rate - selected.cost_rate)/selected.hourly_billing_rate * 100)}%)`, c: '#00ffd1' },
                    { l: 'REGION', v: selected.region || 'GLOBAL', c: '#fff' },
                    { l: 'MAPPED MANAGER', v: selected.manager_email || 'Unassigned', c: '#8896ab' },
                    { l: 'LOGGED HOUR BOOKINGS', v: `${selected.booking_hours} hrs`, c: '#3b82f6' },
                    { l: 'UTILIZATION FACTOR', v: `${selected.utilization}%`, c: statusColor(selected.status) },
                  ].map((s, i) => (
                    <div key={i} style={{ background: 'rgba(255,255,255,0.03)', padding: '0.6rem 0.85rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.55rem', color: '#8896ab', fontWeight: 800 }}>{s.l}</span>
                      <span style={{ fontSize: '0.68rem', fontWeight: 950, color: s.c }}>{s.v}</span>
                    </div>
                  ))}
                </div>
                
                <button onClick={() => router.push('/manager')} style={{ width: '100%', padding: '0.75rem', background: '#00ffd1', color: '#000', border: 'none', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 900, cursor: 'pointer', boxShadow: '0 0 15px rgba(0, 255, 209, 0.2)' }}>
                  ALLOCATE PROJECT NODE
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Add Resource Modal */}
      <AnimatePresence>
        {addModal && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}
            onClick={e => { if(e.target===e.currentTarget) setAddModal(false); }}>
            <motion.div initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.95}}
              style={{ background:'#0b0f14', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'14px', width:520, overflow:'hidden', boxShadow:'0 40px 80px rgba(0,0,0,0.6)' }}>
              <form onSubmit={handleAdd}>
                <div style={{ padding:'1.25rem 1.5rem', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <div style={{ fontSize:'0.65rem', fontWeight:900, color:'#8896ab', letterSpacing:'0.1em' }}>CREATE_CENTRAL_RESOURCE</div>
                    <div style={{ fontSize:'0.95rem', fontWeight:950, color:'#fff', marginTop:'0.25rem' }}>Register New Master Resource</div>
                  </div>
                  <button type="button" onClick={() => setAddModal(false)} style={{ background:'transparent', border:'none', color:'#8896ab', cursor:'pointer' }}><Icons.X /></button>
                </div>
                <div style={{ padding:'1.5rem', overflowY:'auto', maxHeight:'70vh' }}>
                  {error && (
                    <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.75rem', borderRadius: '8px', color: '#ef4444', fontSize: '0.65rem', fontWeight: 800, marginBottom: '1.25rem' }}>
                      {error}
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div>
                      <label style={{ fontSize:'0.6rem', fontWeight:800, color:'#8896ab', display:'block', marginBottom:'0.4rem' }}>EMPLOYEE ID (AUTO-GENERATE IF BLANK)</label>
                      <input value={form.employee_id} onChange={e=>setForm({...form,employee_id:e.target.value})} placeholder="e.g. EMP-107"
                        style={{ width:'100%', background:'#14191f', border:'1px solid rgba(255,255,255,0.1)', color:'#fff', padding:'0.65rem 0.85rem', borderRadius:'7px', fontSize:'0.8rem', outline:'none' }} />
                    </div>
                    <div>
                      <label style={{ fontSize:'0.6rem', fontWeight:800, color:'#8896ab', display:'block', marginBottom:'0.4rem' }}>FULL NAME</label>
                      <input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="e.g. Aarav Sharma"
                        style={{ width:'100%', background:'#14191f', border:'1px solid rgba(255,255,255,0.1)', color:'#fff', padding:'0.65rem 0.85rem', borderRadius:'7px', fontSize:'0.8rem', outline:'none' }} />
                    </div>
                  </div>

                  <div style={{ marginBottom:'1rem' }}>
                    <label style={{ fontSize:'0.6rem', fontWeight:800, color:'#8896ab', display:'block', marginBottom:'0.4rem' }}>EMAIL ADDRESS</label>
                    <input required type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="e.g. aarav.sharma@arche.global"
                      style={{ width:'100%', background:'#14191f', border:'1px solid rgba(255,255,255,0.1)', color:'#fff', padding:'0.65rem 0.85rem', borderRadius:'7px', fontSize:'0.8rem', outline:'none' }} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div>
                      <label style={{ fontSize:'0.6rem', fontWeight:800, color:'#8896ab', display:'block', marginBottom:'0.4rem' }}>GRADE</label>
                      <select value={form.grade} onChange={e=>setForm({...form,grade:e.target.value})}
                        style={{ width:'100%', background:'#14191f', border:'1px solid rgba(255,255,255,0.1)', color:'#fff', padding:'0.65rem 0.85rem', borderRadius:'7px', fontSize:'0.8rem', outline:'none', cursor:'pointer' }}>
                        {['L1 Consultant', 'L2 Senior Consultant', 'L3 Lead Consultant', 'Principal Consultant', 'Architect'].map(g => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize:'0.6rem', fontWeight:800, color:'#8896ab', display:'block', marginBottom:'0.4rem' }}>ROLE / PRACTICE</label>
                      <input required value={form.role_practice} onChange={e=>setForm({...form,role_practice:e.target.value})} placeholder="e.g. Cloud Services"
                        style={{ width:'100%', background:'#14191f', border:'1px solid rgba(255,255,255,0.1)', color:'#fff', padding:'0.65rem 0.85rem', borderRadius:'7px', fontSize:'0.8rem', outline:'none' }} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div>
                      <label style={{ fontSize:'0.6rem', fontWeight:800, color:'#8896ab', display:'block', marginBottom:'0.4rem' }}>HOURLY BILLING RATE (₹/hr)</label>
                      <input required type="number" min="0" value={form.hourly_billing_rate} onChange={e=>setForm({...form,hourly_billing_rate:parseFloat(e.target.value||0)})}
                        style={{ width:'100%', background:'#14191f', border:'1px solid rgba(255,255,255,0.1)', color:'#fff', padding:'0.65rem 0.85rem', borderRadius:'7px', fontSize:'0.8rem', outline:'none' }} />
                    </div>
                    <div>
                      <label style={{ fontSize:'0.6rem', fontWeight:800, color:'#8896ab', display:'block', marginBottom:'0.4rem' }}>COST RATE (₹/hr)</label>
                      <input required type="number" min="0" value={form.cost_rate} onChange={e=>setForm({...form,cost_rate:parseFloat(e.target.value||0)})}
                        style={{ width:'100%', background:'#14191f', border:'1px solid rgba(255,255,255,0.1)', color:'#fff', padding:'0.65rem 0.85rem', borderRadius:'7px', fontSize:'0.8rem', outline:'none' }} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div>
                      <label style={{ fontSize:'0.6rem', fontWeight:800, color:'#8896ab', display:'block', marginBottom:'0.4rem' }}>SKILL CATEGORY</label>
                      <input required value={form.skill_category} onChange={e=>setForm({...form,skill_category:e.target.value})} placeholder="e.g. Cloud & DevOps"
                        style={{ width:'100%', background:'#14191f', border:'1px solid rgba(255,255,255,0.1)', color:'#fff', padding:'0.65rem 0.85rem', borderRadius:'7px', fontSize:'0.8rem', outline:'none' }} />
                    </div>
                    <div>
                      <label style={{ fontSize:'0.6rem', fontWeight:800, color:'#8896ab', display:'block', marginBottom:'0.4rem' }}>REGION</label>
                      <select value={form.region} onChange={e=>setForm({...form,region:e.target.value})}
                        style={{ width:'100%', background:'#14191f', border:'1px solid rgba(255,255,255,0.1)', color:'#fff', padding:'0.65rem 0.85rem', borderRadius:'7px', fontSize:'0.8rem', outline:'none', cursor:'pointer' }}>
                        {['APJ', 'EMEA', 'AMER', 'GLOBAL'].map(r => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={{ fontSize:'0.6rem', fontWeight:800, color:'#8896ab', display:'block', marginBottom:'0.4rem' }}>RESOURCE STATUS</label>
                      <select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}
                        style={{ width:'100%', background:'#14191f', border:'1px solid rgba(255,255,255,0.1)', color:'#fff', padding:'0.65rem 0.85rem', borderRadius:'7px', fontSize:'0.8rem', outline:'none', cursor:'pointer' }}>
                        {['Available', 'Allocated', 'Bench'].map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize:'0.6rem', fontWeight:800, color:'#8896ab', display:'block', marginBottom:'0.4rem' }}>MAPPED MANAGER (EMAIL)</label>
                      <input required type="email" value={form.manager_email} onChange={e=>setForm({...form,manager_email:e.target.value})} placeholder="e.g. manager@digitrac.com"
                        style={{ width:'100%', background:'#14191f', border:'1px solid rgba(255,255,255,0.1)', color:'#fff', padding:'0.65rem 0.85rem', borderRadius:'7px', fontSize:'0.8rem', outline:'none' }} />
                    </div>
                  </div>
                </div>
                <div style={{ padding:'1rem 1.5rem', background:'rgba(0,0,0,0.3)', borderTop:'1px solid rgba(255,255,255,0.05)', display:'flex', justifyContent:'flex-end', gap:'0.75rem' }}>
                  <button type="button" onClick={()=>setAddModal(false)} style={{ background:'transparent', border:'1px solid rgba(255,255,255,0.1)', color:'#fff', padding:'0.6rem 1.2rem', borderRadius:'7px', fontSize:'0.7rem', fontWeight:800, cursor:'pointer' }}>ABORT</button>
                  <button type="submit" disabled={saving}
                    style={{ background:'#00ffd1', color:'#000', border:'none', padding:'0.6rem 1.5rem', borderRadius:'7px', fontSize:'0.7rem', fontWeight:900, cursor:'pointer', boxShadow: '0 0 15px rgba(0, 255, 209, 0.2)' }}>
                    {saving ? 'REGISTERING...' : 'REGISTER MASTER'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
        tr:hover { background: rgba(255,255,255,0.015) !important; }
        @media (max-width: 768px) {
          body > div { flex-direction: column; }
          aside { width: 100% !important; border-right: none !important; border-bottom: 1px solid rgba(0,255,200,0.08); padding: 1rem !important; }
          main > div:first-child { flex-direction: column; align-items: flex-start !important; gap: 1rem; }
          main > div:nth-child(2) { grid-template-columns: 1fr 1fr !important; }
          main > div:nth-child(3) { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
