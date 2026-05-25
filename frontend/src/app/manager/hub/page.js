"use client";
import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

const API = 'http://127.0.0.1:8000';
const tok = () => localStorage.getItem('token');

const Icons = {
  Grid: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>,
  Users: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>,
  Logout: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>,
  Target: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>,
  Activity: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>,
  Briefcase: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>,
  ChevronLeft: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
};

export default function ResourceHub() {
  const router = useRouter();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    try {
      const res = await fetch(`${API}/manager/projects`, { headers: { Authorization: `Bearer ${tok()}` } });
      const data = await res.json();
      if (Array.isArray(data)) setProjects(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchDetail = async (id) => {
    try {
      const res = await fetch(`${API}/manager/projects/${id}`, { headers: { Authorization: `Bearer ${tok()}` } });
      setSelectedProject(await res.json());
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchProjects(); }, []);

  if (loading) return <div className="loading-screen">ACCESSING RESOURCES...</div>;

  return (
    <div className="hub-dashboard">
      <nav className="mng-sidebar">
        <div className="mng-logo" onClick={() => router.push('/manager')} style={{ cursor: 'pointer' }}>
           <Icons.ChevronLeft /> BACK TO EXECUTION
        </div>
        <div className="mng-nav-group">
          <div className="nav-item" onClick={() => router.push('/manager')}><Icons.Grid /> DASHBOARD</div>
          <div className="nav-item active"><Icons.Users /> RESOURCES</div>
        </div>
      </nav>

      <main className="hub-main">
        <header className="hub-header">
           <h1>RESOURCE INTELLIGENCE HUB</h1>
           <select className="hub-dropdown" onChange={e => fetchDetail(e.target.value)}>
              <option value="">Select Project for Details</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
           </select>
        </header>

        <div className="hub-grid">
           {/* Project Profile Card */}
           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="hub-card">
              <div className="card-header">
                <Icons.Target /> <h4>Project Profile</h4>
              </div>
              {selectedProject ? (
                <div className="profile-details">
                  <div className="detail-row"><span>Project ID</span> <strong>DT-{selectedProject.id}</strong></div>
                  <div className="detail-row"><span>Efficiency Target</span> <strong>{selectedProject.efficiency_pct}%</strong></div>
                  <div className="detail-row"><span>Region</span> <strong>{selectedProject.region || 'GLOBAL'}</strong></div>
                  <div className="detail-row"><span>Approved By</span> <strong style={{ color: '#00C9A7' }}>{selectedProject.approved_by}</strong></div>
                </div>
              ) : <div className="hub-placeholder">Select a project to view profile.</div>}
           </motion.div>

           {/* Intelligence Briefing */}
           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="hub-card">
              <div className="card-header">
                <Icons.Briefcase /> <h4>Intelligence Briefing</h4>
              </div>
              <div className="briefing-list">
                {selectedProject?.insights?.map((i, idx) => (
                  <div key={idx} className="briefing-item">
                    <div className="dot" /> <p>{i}</p>
                  </div>
                )) || <div className="hub-placeholder">Awaiting project synchronization...</div>}
              </div>
           </motion.div>

           {/* Performance Metrics */}
           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="hub-card">
              <div className="card-header">
                <Icons.Activity /> <h4>Execution Metrics</h4>
              </div>
              <div className="metrics-row">
                 <div className="metric-box"><span>Hours Used</span> <strong>{selectedProject?.time_used || 0}h</strong></div>
                 <div className="metric-box"><span>Budgeted</span> <strong>{selectedProject?.expected_time || 0}h</strong></div>
              </div>
              <div className="utilization-bar-wrap">
                 <div className="bar-label">Capacity Utilization</div>
                 <div className="bar-bg"><div className="bar-fill" style={{ width: '65%' }}></div></div>
              </div>
           </motion.div>
        </div>
      </main>

      <style jsx>{`
        .loading-screen { background: #05070a; min-height: 100vh; display: flex; align-items: center; justify-content: center; color: #00C9A7; font-weight: 900; letter-spacing: 0.2em; }
        .hub-dashboard { display: flex; min-height: 100vh; background: #05070a; color: #fff; font-family: 'Inter', sans-serif; }
        .mng-sidebar { width: 240px; background: #0a0c10; border-right: 1px solid rgba(255,255,255,0.05); padding: 2rem 1.5rem; display: flex; flex-direction: column; }
        .mng-logo { font-size: 0.75rem; font-weight: 900; color: #8896ab; display: flex; align-items: center; gap: 0.5rem; margin-bottom: 3rem; }
        .nav-item { padding: 0.75rem 1rem; border-radius: 8px; color: #8896ab; cursor: pointer; transition: 0.3s; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.75rem; font-size: 0.75rem; font-weight: 700; }
        .nav-item.active { background: rgba(0, 201, 167, 0.1); color: #00C9A7; }
        
        .hub-main { flex: 1; padding: 3rem 4rem; }
        .hub-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 3rem; }
        .hub-header h1 { font-size: 1.2rem; font-weight: 950; letter-spacing: 0.1em; }
        .hub-dropdown { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 0.6rem 1.2rem; border-radius: 8px; font-weight: 700; outline: none; }
        
        .hub-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 2rem; }
        .hub-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 20px; padding: 2rem; }
        .card-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 2rem; color: #8896ab; }
        .card-header h4 { font-size: 0.8rem; font-weight: 900; text-transform: uppercase; margin: 0; }
        
        .profile-details { display: flex; flex-direction: column; gap: 1rem; }
        .detail-row { display: flex; justify-content: space-between; font-size: 0.8rem; border-bottom: 1px solid rgba(255,255,255,0.03); padding-bottom: 0.5rem; }
        .detail-row span { color: #8896ab; }
        
        .briefing-list { display: flex; flex-direction: column; gap: 1rem; }
        .briefing-item { display: flex; gap: 1rem; align-items: flex-start; }
        .dot { width: 6px; height: 6px; border-radius: 50%; background: #00C9A7; margin-top: 6px; flex-shrink: 0; }
        .briefing-item p { font-size: 0.75rem; color: #ccc; line-height: 1.5; margin: 0; }
        
        .metrics-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 2rem; }
        .metric-box { background: rgba(255,255,255,0.03); padding: 1rem; border-radius: 12px; display: flex; flex-direction: column; gap: 0.25rem; }
        .metric-box span { font-size: 0.6rem; color: #8896ab; text-transform: uppercase; }
        .metric-box strong { font-size: 1.1rem; font-weight: 900; }
        
        .utilization-bar-wrap { display: flex; flex-direction: column; gap: 0.75rem; }
        .bar-label { font-size: 0.65rem; font-weight: 800; color: #8896ab; }
        .bar-bg { height: 8px; background: rgba(255,255,255,0.05); border-radius: 10px; overflow: hidden; }
        .bar-fill { height: 100%; background: #6C63FF; border-radius: 10px; }
        
        .hub-placeholder { text-align: center; padding: 3rem 1rem; color: #555; font-size: 0.75rem; border: 1px dashed rgba(255,255,255,0.05); border-radius: 15px; }
      `}</style>
    </div>
  );
}
