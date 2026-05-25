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
  X: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Search: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Check: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>,
  Shield: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
};

export default function ManagerDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('DASHBOARD');
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assignModal, setAssignModal] = useState(null);
  const [centralResources, setCentralResources] = useState([]);
  
  // RIDE Logs for Selected Project
  const [rideItems, setRideItems] = useState([]);
  const [showRideModal, setShowRideModal] = useState(false);

  // New RIDE Form State
  const [rideType, setRideType] = useState('RISK');
  const [rideTitle, setRideTitle] = useState('');
  const [rideDesc, setRideDesc] = useState('');
  const [rideSeverity, setRideSeverity] = useState('MEDIUM');
  const [ridePriority, setRidePriority] = useState('MEDIUM');
  const [rideOwner, setRideOwner] = useState('');
  const [rideOwnerEmail, setRideOwnerEmail] = useState('');
  const [rideDueDate, setRideDueDate] = useState('');
  const [rideEscalated, setRideEscalated] = useState(false);

  // Refined assignment form state
  const [form, setForm] = useState({
    resName: '',
    priority: 'MEDIUM',
    startDate: '',
    endDate: '',
    duration: 0,
    booking_hours: 0
  });
  
  const [saving, setSaving] = useState(false);

  const fetchProjects = async () => {
    if (!tok()) { router.push('/'); return; }
    try {
      const res = await fetch(`${API}/manager/projects`, { headers: { Authorization: `Bearer ${tok()}` } });
      if (res.status === 401) { router.push('/'); return; }
      const data = await res.json();
      if (Array.isArray(data)) {
        setProjects(data);
        if (data.length > 0) {
          if (selectedProject) {
            const updatedSelected = data.find(p => p.id === selectedProject.id);
            if (updatedSelected) {
              setSelectedProject(updatedSelected);
              fetchProjectRideItems(updatedSelected.id);
            }
          } else {
            setSelectedProject(data[0]);
            fetchProjectRideItems(data[0].id);
          }
        }
      }
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchCentralResources = async () => {
    try {
      const res = await fetch(`${API}/manager/centralized-resources`, { headers: { Authorization: `Bearer ${tok()}` } });
      if (res.ok) setCentralResources(await res.json());
    } catch(e) { console.error(e); }
  };

  const fetchProjectRideItems = async (projId) => {
    if (!projId) return;
    try {
      const res = await fetch(`http://127.0.0.1:8000/vp/projects/${projId}/ride`, {
        headers: { Authorization: `Bearer ${tok()}` }
      });
      if (res.ok) setRideItems(await res.json());
    } catch (e) { console.error(e); }
  };

  const loadProject = async (id) => {
    try {
      const res = await fetch(`${API}/manager/projects/${id}`, { headers: { Authorization: `Bearer ${tok()}` } });
      if (res.ok) {
        const pData = await res.json();
        setSelectedProject(pData);
        fetchProjectRideItems(pData.id);
      }
    } catch(e) { console.error(e); }
  };

  useEffect(() => {
    fetchProjects();
    fetchCentralResources();
  }, []);

  const handleAssign = async () => {
    if (!assignModal || !selectedProject) return;
    setSaving(true);
    try {
      const res = await fetch(`${API}/manager/projects/${selectedProject.id}/items/${assignModal.id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` },
        body: JSON.stringify({
          assigned_person: form.resName,
          start_date: form.startDate,
          end_date: form.endDate,
          duration: parseFloat(form.duration || 0),
          priority: form.priority,
          work_mode: 'Days',
          booking_hours: parseFloat(form.booking_hours || 0)
        })
      });
      if (res.ok) {
        setAssignModal(null);
        await fetchCentralResources();
        await loadProject(selectedProject.id);
        await fetchProjects();
      }
    } catch(e) { console.error(e); }
    finally { setSaving(false); }
  };

  // Log RIDE Item
  const handleCreateRideItem = async (e) => {
    e.preventDefault();
    if (!selectedProject) return;
    try {
      const res = await fetch(`http://127.0.0.1:8000/vp/projects/${selectedProject.id}/ride`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` },
        body: JSON.stringify({
          type: rideType,
          title: rideTitle,
          description: rideDesc,
          severity: rideSeverity,
          priority: ridePriority,
          owner_name: rideOwner,
          owner_email: rideOwnerEmail,
          due_date: rideDueDate || null,
          escalated_to_vp: rideEscalated
        })
      });
      if (res.ok) {
        alert("Governance Item logged successfully! Syncing with compliance trail.");
        setShowRideModal(false);
        setRideTitle('');
        setRideDesc('');
        setRideOwner('');
        setRideOwnerEmail('');
        setRideDueDate('');
        fetchProjectRideItems(selectedProject.id);
      }
    } catch (e) { alert("Failed to log governance item"); }
  };

  const handleUpdateRideStatus = async (rideId, currentItem, newStatus) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/vp/projects/${selectedProject.id}/ride/${rideId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` },
        body: JSON.stringify({
          type: currentItem.type,
          title: currentItem.title,
          description: currentItem.description,
          severity: currentItem.severity,
          priority: currentItem.priority,
          owner_name: currentItem.owner_name,
          owner_email: currentItem.owner_email,
          due_date: currentItem.due_date,
          status: newStatus,
          escalated_to_vp: currentItem.escalated_to_vp
        })
      });
      if (res.ok) {
        fetchProjectRideItems(selectedProject.id);
      }
    } catch (e) { console.error(e); }
  };

  const handleDeleteRide = async (rideId) => {
    if (!confirm("Confirm resolution and closure of this item?")) return;
    try {
      const res = await fetch(`http://127.0.0.1:8000/vp/projects/${selectedProject.id}/ride/${rideId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${tok()}` }
      });
      if (res.ok) {
        fetchProjectRideItems(selectedProject.id);
      }
    } catch (e) { console.error(e); }
  };

  const resources = useMemo(() => {
    if (selectedProject) return selectedProject.resources || [];
    return projects.flatMap(p => (p.resources || []).map(r => ({ ...r, _projectName: p.name, _projectId: p.id })));
  }, [projects, selectedProject]);

  const navTo = (path) => router.push(path);

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

        <div style={{ fontSize:'0.55rem', color:'rgba(136,150,171,0.5)', fontWeight:800, letterSpacing:'0.15em', padding:'0 0.75rem', marginBottom:'0.5rem' }}>CORE</div>
        <div onClick={() => setActiveTab('DASHBOARD')} style={{ display:'flex', alignItems:'center', gap:'0.75rem', padding:'0.7rem 0.75rem', borderRadius:'8px', fontSize:'0.72rem', fontWeight:700, marginBottom:'2px', background: activeTab === 'DASHBOARD' ? 'rgba(0,255,200,0.06)' : 'rgba(0,0,0,0)', color: activeTab === 'DASHBOARD' ? '#00ffd1' : '#8896ab', cursor: 'pointer' }}>
          <Icons.Grid /><span>Dashboard</span>
        </div>
        <div onClick={() => setActiveTab('RIDE')} style={{ display:'flex', alignItems:'center', gap:'0.75rem', padding:'0.7rem 0.75rem', borderRadius:'8px', fontSize:'0.72rem', fontWeight:700, marginBottom:'2px', background: activeTab === 'RIDE' ? 'rgba(0,255,200,0.06)' : 'rgba(0,0,0,0)', color: activeTab === 'RIDE' ? '#00ffd1' : '#8896ab', cursor: 'pointer' }}>
          <Icons.Shield /><span>RIDE Governance</span>
        </div>

        <div style={{ fontSize:'0.55rem', color:'rgba(136,150,171,0.5)', fontWeight:800, letterSpacing:'0.15em', padding:'1rem 0.75rem 0.5rem' }}>OPERATIONS</div>
        {[{label:'Resources', icon:<Icons.Users/>, path:'/manager/resources'},{label:'Time Logs', icon:<Icons.Clock/>, path:'/manager/logs'}].map(item => (
          <div key={item.path} onClick={() => navTo(item.path)} style={{ display:'flex', alignItems:'center', gap:'0.75rem', padding:'0.7rem 0.75rem', borderRadius:'8px', cursor:'pointer', color:'#8896ab', fontSize:'0.72rem', fontWeight:700, marginBottom:'2px' }}>
            {item.icon}<span>{item.label}</span>
          </div>
        ))}

        <div style={{ marginTop:'auto', padding:'1rem 0.75rem', borderTop:'1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontSize:'0.65rem', fontWeight:800, color:'#fff', marginBottom:'0.25rem' }}>PROJECT MANAGER</div>
          <div style={{ fontSize:'0.55rem', color:'#8896ab', marginBottom:'1rem' }}>{typeof window!=='undefined' ? localStorage.getItem('user_email')||'manager@arche.global' : ''}</div>
          <button onClick={() => { localStorage.clear(); router.push('/'); }} style={{ width:'100%', padding:'0.5rem', background:'rgba(255,68,68,0.05)', color:'#ff4444', border:'1px solid rgba(255,68,68,0.15)', borderRadius:'6px', fontSize:'0.65rem', fontWeight:800, cursor:'pointer' }}>
            <Icons.Logout /> SIGN OUT
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        {/* Header */}
        <div style={{ padding:'1.5rem 2rem', borderBottom:'1px solid rgba(255,255,255,0.05)', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
          <div>
            <h1 style={{ fontSize:'1.6rem', fontWeight:950, margin:0 }}>PROJECT <span style={{ color:'#00f2ff' }}>EXECUTION HUB</span></h1>
            <div style={{ display:'flex', gap:'1.5rem', marginTop:'0.5rem', fontSize:'0.65rem', color:'#8896ab', fontWeight:700 }}>
              <span>PROJECT: <strong style={{color:'#fff'}}>{selectedProject?.name || 'GLOBAL'}</strong></span>
              <span style={{color:'rgba(255,255,255,0.1)'}}>|</span>
              <span>ITEMS: <strong style={{color:'#00ffd1'}}>{resources.length}</strong></span>
              <span style={{color:'rgba(255,255,255,0.1)'}}>|</span>
              <span>RIDE LOGS: <strong style={{color:'#ef4444'}}>{rideItems.length} active</strong></span>
            </div>
          </div>
          <div style={{ display:'flex', gap:'0.75rem', alignItems:'center' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#00ffd1', letterSpacing: '0.1em' }}>SELECT PROJECT:</div>
            <select value={selectedProject?.id||''} onChange={e => e.target.value ? loadProject(e.target.value) : setSelectedProject(null)}
              style={{ background:'#0d1117', border:'1px solid rgba(255,255,255,0.1)', color:'#fff', padding:'0.5rem 1rem', borderRadius:'8px', fontSize:'0.7rem', fontWeight:700, outline:'none', cursor:'pointer' }}>
              <option value="">GLOBAL PORTFOLIO</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>

        {/* Attachment Banner */}
        {selectedProject?.artifact_path && (
          <div style={{ padding: '0.75rem 2rem', background: 'rgba(108, 99, 255, 0.08)', borderBottom: '1px solid rgba(108, 99, 255, 0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: 28, height: 28, borderRadius: '6px', background: 'rgba(108, 99, 255, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6C63FF' }}>
                <Icons.Grid />
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', fontWeight: 900, color: '#fff' }}>ATTACHED BUDGET FILE</div>
                <div style={{ fontSize: '0.55rem', color: '#8896ab' }}>Microsoft Graph API Synchronized Artifact</div>
              </div>
            </div>
            <a href={`http://127.0.0.1:8000/manager/artifact?path=${encodeURIComponent(selectedProject.artifact_path)}&token=${tok()}`} target="_blank" rel="noopener noreferrer" style={{ padding: '0.4rem 1rem', background: '#6C63FF', color: '#fff', textDecoration: 'none', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 800 }}>
              VIEW / DOWNLOAD ATTACHMENT
            </a>
          </div>
        )}

        <AnimatePresence mode="wait">
          {activeTab === 'DASHBOARD' && (
            <motion.div key="exec-dashboard" style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
              {/* FINANCIAL & DURATION INTELLIGENCE */}
              {selectedProject && (
                <div style={{ padding: '1.5rem 2rem', background: 'radial-gradient(ellipse at top, rgba(0,255,200,0.03) 0%, transparent 70%)', borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
                   <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.75rem' }}>
                      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '1rem' }}>
                         <div style={{ fontSize: '0.55rem', color: '#8896ab', fontWeight: 800, marginBottom: '0.5rem' }}>PLANNED BUDGET</div>
                         <div style={{ fontSize: '1.6rem', fontWeight: 950, color: '#3b82f6' }}>₹{((selectedProject.total_revenue || 0) / 100000).toFixed(2)}<span style={{fontSize:'1rem'}}>L</span></div>
                      </div>
                      <div style={{ background: 'rgba(108, 99, 255, 0.05)', border: '1px solid rgba(108, 99, 255, 0.2)', borderRadius: '12px', padding: '1rem' }}>
                         <div style={{ fontSize: '0.55rem', color: '#a78bfa', fontWeight: 800, marginBottom: '0.5rem' }}>LIVE RESOURCE COST</div>
                         <div style={{ fontSize: '1.6rem', fontWeight: 950, color: '#a78bfa' }}>₹{((selectedProject.actual_resource_cost || 0) / 100000).toFixed(2)}<span style={{fontSize:'1rem'}}>L</span></div>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '1rem' }}>
                         <div style={{ fontSize: '0.55rem', color: '#8896ab', fontWeight: 800, marginBottom: '0.5rem' }}>FORECASTED COST</div>
                         <div style={{ fontSize: '1.6rem', fontWeight: 950, color: '#fff' }}>₹{((selectedProject.actual_total_cost || 0) / 100000).toFixed(2)}<span style={{fontSize:'1rem'}}>L</span></div>
                      </div>
                      <div style={{ background: 'rgba(0,255,200,0.05)', border: '1px solid rgba(0,255,200,0.2)', borderRadius: '12px', padding: '1rem' }}>
                         <div style={{ fontSize: '0.55rem', color: '#00ffd1', fontWeight: 800, marginBottom: '0.5rem' }}>GROSS MARGIN %</div>
                         <div style={{ fontSize: '1.6rem', fontWeight: 950, color: '#00ffd1' }}>{(selectedProject.margin_pct || 0).toFixed(2)}%</div>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '1rem' }}>
                         <div style={{ fontSize: '0.55rem', color: '#8896ab', fontWeight: 800, marginBottom: '0.5rem' }}>MARGIN DEVIATION</div>
                         <div style={{ fontSize: '1.6rem', fontWeight: 950, color: (selectedProject.margin_deviation_pct || 0) < 0 ? '#ef4444' : '#00ffd1' }}>
                            {(selectedProject.margin_deviation_pct || 0)}%
                         </div>
                      </div>
                   </div>
                </div>
              )}

              {/* Table */}
              <div style={{ flex:1, overflowY:'auto', overflowX:'auto', padding:'1.5rem 2rem' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', minWidth:'1500px' }}>
                  <thead>
                    <tr style={{ borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                      {['RESOURCE ASSIGNED', 'EMPLOYEE ID', 'GRADE', 'COST VALUE', 'BILLING VALUE', 'MARGIN AMOUNT', 'BOOKED HRS', 'STATUS', 'ACTION', 'SAP ID', 'PROJECT NODE TASK', 'PRACTICE / ROLE', 'COMPONENT', 'OEM', 'QTY', 'PROGRESS', 'RISK STATUS'].map(h => (
                        <th key={h} style={{ padding:'0.75rem 0.85rem', fontSize:'0.58rem', fontWeight:800, color:'#8896ab', textAlign:'left', whiteSpace:'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {resources.length === 0 ? (
                      <tr><td colSpan="17" style={{ padding:'4rem', textAlign:'center', color:'#8896ab', fontSize:'0.72rem', fontWeight:700 }}>
                        NO PROJECT DATA — Please load a project from dropdown
                      </td></tr>
                    ) : resources.map((r, idx) => {
                      const isAssigned = r.name && r.name !== 'Unassigned';
                      const billingValue = r.billing_value || (r.est_hours * r.hourly_billing_rate) || 0;
                      const costValue = r.resource_cost || 0;
                      const marginAmount = r.resource_margin || (billingValue - costValue) || 0;
                      const marginPct = billingValue > 0 ? (marginAmount / billingValue) * 100 : 0;
                      const riskColor = marginPct > 20 ? '#00ffd1' : marginPct > 10 ? '#f59e0b' : '#ef4444';
                      const riskLabel = marginPct > 20 ? 'LOW RISK' : marginPct > 10 ? 'MED RISK' : 'HIGH RISK';
                      
                      return (
                        <tr key={idx} style={{ borderBottom:'1px solid rgba(255,255,255,0.03)' }}>
                          <td style={{ padding:'0.75rem 0.85rem', fontSize:'0.65rem', color: isAssigned ? '#00ffd1' : '#8896ab', fontWeight:700 }}>
                            {isAssigned ? r.name : 'Unassigned'}
                          </td>
                          <td style={{ padding:'0.75rem 0.85rem', fontSize:'0.65rem', color:'#fff' }}>{r.employee_id || '—'}</td>
                          <td style={{ padding:'0.75rem 0.85rem', fontSize:'0.65rem', color:'#a78bfa' }}>{r.grade || '—'}</td>
                          <td style={{ padding:'0.75rem 0.85rem', fontSize:'0.65rem', color:'#ef4444', fontWeight:700 }}>₹{costValue.toLocaleString()}</td>
                          <td style={{ padding:'0.75rem 0.85rem', fontSize:'0.65rem', color:'#00ffd1', fontWeight:700 }}>₹{billingValue.toLocaleString()}</td>
                          <td style={{ padding:'0.75rem 0.85rem', fontSize:'0.65rem', color:'#3b82f6', fontWeight:700 }}>₹{marginAmount.toLocaleString()}</td>
                          <td style={{ padding:'0.75rem 0.85rem', fontSize:'0.65rem', color:'#fff', fontWeight:700 }}>{r.est_hours}h</td>
                          <td style={{ padding:'0.75rem 0.85rem', textAlign:'center' }}>
                            <span style={{ width:8, height:8, borderRadius:'50%', background: isAssigned ? '#00ffd1' : '#f59e0b', display:'inline-block' }} />
                          </td>
                          <td style={{ padding:'0.75rem 0.85rem' }}>
                            <button onClick={() => {
                              setAssignModal({ ...r, _projectId: r._projectId || selectedProject?.id });
                              setForm({
                                resName: isAssigned ? r.name : '',
                                priority: r.priority || 'MEDIUM',
                                startDate: r.start_date || '',
                                endDate: r.deadline || '',
                                duration: r.duration || 0,
                                booking_hours: r.est_hours || 0
                              });
                            }} style={{ background:'transparent', border:'1px solid rgba(0,255,209,0.3)', color:'#00ffd1', padding:'0.3rem 0.75rem', borderRadius:'5px', fontSize:'0.6rem', fontWeight:800, cursor:'pointer' }}>
                              DEPLOY
                            </button>
                          </td>
                          <td style={{ padding:'0.75rem 0.85rem', fontSize:'0.65rem', color:'#6C63FF' }}>{r.sap_id||'—'}</td>
                          <td style={{ padding:'0.75rem 0.85rem', maxWidth:'200px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.task_name}</td>
                          <td style={{ padding:'0.75rem 0.85rem', fontSize:'0.65rem' }}>{r.role}</td>
                          <td style={{ padding:'0.75rem 0.85rem', fontSize:'0.65rem' }}>{r.component}</td>
                          <td style={{ padding:'0.75rem 0.85rem', fontSize:'0.65rem' }}>{r.oem}</td>
                          <td style={{ padding:'0.75rem 0.85rem', fontSize:'0.65rem' }}>{r.qty}</td>
                          <td>{r.progress_pct}%</td>
                          <td style={{ color: riskColor }}>{riskLabel}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* TAB: RIDE GOVERNANCE FOR MANAGER */}
          {activeTab === 'RIDE' && (
            <motion.div key="ride-logs" style={{ flex:1, padding:'2rem', overflowY:'auto' }}>
               <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
                  <div>
                     <h2 style={{ fontSize:'1.2rem', fontWeight:950, margin:0 }}>RIDE GOVERNANCE BOARD</h2>
                     <p style={{ fontSize:'0.65rem', color:'#8896ab', marginTop:'0.25rem' }}>Risks, Issues, Dependencies & Escalations for active project.</p>
                  </div>
                  <button onClick={() => setShowRideModal(true)} style={{ background:'#00C9A7', border:'none', color:'#000', padding:'0.6rem 1.2rem', borderRadius:'8px', fontSize:'0.7rem', fontWeight:900, cursor:'pointer' }}>
                     + REPORT NEW RIDE ITEM
                  </button>
               </div>

               <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)', borderRadius:'12px', padding:'1rem' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse' }}>
                     <thead>
                        <tr style={{ borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
                           <th style={{ padding:'0.75rem', fontSize:'0.6rem', color:'#8896ab', textAlign:'left' }}>TYPE</th>
                           <th style={{ padding:'0.75rem', fontSize:'0.6rem', color:'#8896ab', textAlign:'left' }}>TITLE / DESCRIPTION</th>
                           <th style={{ padding:'0.75rem', fontSize:'0.6rem', color:'#8896ab', textAlign:'left' }}>OWNER</th>
                           <th style={{ padding:'0.75rem', fontSize:'0.6rem', color:'#8896ab', textAlign: 'center' }}>DUE DATE</th>
                           <th style={{ padding:'0.75rem', fontSize:'0.6rem', color:'#8896ab', textAlign: 'center' }}>SEVERITY</th>
                           <th style={{ padding:'0.75rem', fontSize:'0.6rem', color:'#8896ab', textAlign: 'center' }}>STATUS</th>
                           <th style={{ padding:'0.75rem', fontSize:'0.6rem', color:'#8896ab', textAlign:'right' }}>ACTIONS</th>
                        </tr>
                     </thead>
                     <tbody>
                        {rideItems.length === 0 ? (
                          <tr><td colSpan={7} style={{ padding:'3rem', textAlign:'center', color:'#8896ab', fontSize:'0.75rem' }}>No active RIDE logs reported. Click above to log a new risk.</td></tr>
                        ) : rideItems.map((ride, i) => (
                          <tr key={i} style={{ borderBottom:'1px solid rgba(255,255,255,0.03)' }}>
                             <td style={{ padding:'0.75rem' }}>
                                <span style={{ padding:'0.2rem 0.5rem', borderRadius:'4px', fontSize:'0.55rem', fontWeight:900, background: ride.type === 'ESCALATION' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255,255,255,0.05)', color: ride.type === 'ESCALATION' ? '#ef4444' : '#fff' }}>
                                   {ride.type}
                                </span>
                             </td>
                             <td style={{ padding:'0.75rem' }}>
                                <div style={{ fontSize:'0.75rem', fontWeight:800 }}>{ride.title}</div>
                                <div style={{ fontSize:'0.6rem', color:'#8896ab', marginTop:'2px' }}>{ride.description}</div>
                             </td>
                             <td style={{ padding:'0.75rem', fontSize:'0.7rem' }}>
                                <strong>{ride.owner_name}</strong>
                                <div style={{ fontSize:'0.55rem', color:'#8896ab' }}>{ride.owner_email}</div>
                             </td>
                             <td style={{ padding:'0.75rem', textAlign:'center', fontSize:'0.7rem' }}>
                                {ride.due_date ? new Date(ride.due_date).toLocaleDateString() : 'N/A'}
                             </td>
                             <td style={{ padding:'0.75rem', textAlign:'center', fontSize:'0.7rem', fontWeight:800, color: ride.severity === 'CRITICAL' ? '#ef4444' : '#fff' }}>
                                {ride.severity}
                             </td>
                             <td style={{ padding:'0.75rem', textAlign:'center' }}>
                                <select 
                                  style={{ background:'#14191f', border:'1px solid rgba(255,255,255,0.1)', color:'#fff', fontSize:'0.65rem', padding:'0.2rem 0.5rem', borderRadius:'4px' }}
                                  value={ride.status}
                                  onChange={e => handleUpdateRideStatus(ride.id, ride, e.target.value)}
                                >
                                   <option value="OPEN">OPEN</option>
                                   <option value="IN_PROGRESS">IN PROGRESS</option>
                                   <option value="RESOLVED">RESOLVED</option>
                                </select>
                             </td>
                             <td style={{ padding:'0.75rem', textAlign:'right' }}>
                                <button style={{ color:'#ef4444', background:'none', border:'none', cursor:'pointer', fontSize:'0.65rem', fontWeight:800 }} onClick={() => handleDeleteRide(ride.id)}>
                                   RESOLVE & CLOSE
                                </button>
                             </td>
                          </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* REPORT RIDE ENTRY MODAL */}
      {showRideModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyCent:'center', zIndex:1050 }}
             onClick={() => setShowRideModal(false)}>
           <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:0.95 }}
                       style={{ background:'#0b0f14', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'14px', width:480, padding:'1.5rem' }}
                       onClick={e => e.stopPropagation()}>
              <h3 style={{ fontSize:'1.1rem', fontWeight:950, marginBottom:'1rem' }}>LOG NEW RIDE GOVERNANCE ITEM</h3>
              <form onSubmit={handleCreateRideItem}>
                 <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem', marginBottom:'0.75rem' }}>
                    <div>
                       <label style={{ fontSize:'0.6rem', color:'#8896ab', display:'block', marginBottom:'0.3rem' }}>ENTRY TYPE</label>
                       <select style={{ width:'100%', background:'#14191f', border:'1px solid rgba(255,255,255,0.1)', color:'#fff', padding:'0.5rem', borderRadius:'6px' }} value={rideType} onChange={e => setRideType(e.target.value)}>
                          <option value="RISK">RISK</option>
                          <option value="ISSUE">ISSUE</option>
                          <option value="DEPENDENCY">DEPENDENCY</option>
                          <option value="ESCALATION">ESCALATION</option>
                       </select>
                    </div>
                    <div>
                       <label style={{ fontSize:'0.6rem', color:'#8896ab', display:'block', marginBottom:'0.3rem' }}>SEVERITY</label>
                       <select style={{ width:'100%', background:'#14191f', border:'1px solid rgba(255,255,255,0.1)', color:'#fff', padding:'0.5rem', borderRadius:'6px' }} value={rideSeverity} onChange={e => setRideSeverity(e.target.value)}>
                          <option value="LOW">LOW</option>
                          <option value="MEDIUM">MEDIUM</option>
                          <option value="HIGH">HIGH</option>
                          <option value="CRITICAL">CRITICAL</option>
                       </select>
                    </div>
                 </div>
                 <div style={{ marginBottom:'0.75rem' }}>
                    <label style={{ fontSize:'0.6rem', color:'#8896ab', display:'block', marginBottom:'0.3rem' }}>GOVERNANCE TITLE</label>
                    <input required style={{ width:'100%', background:'#14191f', border:'1px solid rgba(255,255,255,0.1)', color:'#fff', padding:'0.5rem', borderRadius:'6px' }} value={rideTitle} onChange={e => setRideTitle(e.target.value)} />
                 </div>
                 <div style={{ marginBottom:'0.75rem' }}>
                    <label style={{ fontSize:'0.6rem', color:'#8896ab', display:'block', marginBottom:'0.3rem' }}>DETAILED DESCRIPTION</label>
                    <textarea style={{ width:'100%', background:'#14191f', border:'1px solid rgba(255,255,255,0.1)', color:'#fff', padding:'0.5rem', borderRadius:'6px', height:'60px', resize:'none' }} value={rideDesc} onChange={e => setRideDesc(e.target.value)} />
                 </div>
                 <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem', marginBottom:'0.75rem' }}>
                    <div>
                       <label style={{ fontSize:'0.6rem', color:'#8896ab', display:'block', marginBottom:'0.3rem' }}>OWNER NAME</label>
                       <input required style={{ width:'100%', background:'#14191f', border:'1px solid rgba(255,255,255,0.1)', color:'#fff', padding:'0.5rem', borderRadius:'6px' }} value={rideOwner} onChange={e => setRideOwner(e.target.value)} />
                    </div>
                    <div>
                       <label style={{ fontSize:'0.6rem', color:'#8896ab', display:'block', marginBottom:'0.3rem' }}>OWNER CORPORATE EMAIL</label>
                       <input required style={{ width:'100%', background:'#14191f', border:'1px solid rgba(255,255,255,0.1)', color:'#fff', padding:'0.5rem', borderRadius:'6px' }} type="email" value={rideOwnerEmail} onChange={e => setRideOwnerEmail(e.target.value)} />
                    </div>
                 </div>
                 <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem', marginBottom:'1.25rem' }}>
                    <div>
                       <label style={{ fontSize:'0.6rem', color:'#8896ab', display:'block', marginBottom:'0.3rem' }}>DUE DATE</label>
                       <input style={{ width:'100%', background:'#14191f', border:'1px solid rgba(255,255,255,0.1)', color:'#fff', padding:'0.5rem', borderRadius:'6px' }} type="date" value={rideDueDate} onChange={e => setRideDueDate(e.target.value)} />
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', paddingTop:'1rem' }}>
                       <input type="checkbox" checked={rideEscalated} onChange={e => setRideEscalated(e.target.checked)} />
                       <label style={{ fontSize:'0.65rem', fontWeight:800 }}>ESCALATE TO VP</label>
                    </div>
                 </div>
                 <div style={{ display:'flex', justifyContent:'flex-end', gap:'0.5rem' }}>
                    <button style={{ background:'transparent', border:'1px solid rgba(255,255,255,0.1)', color:'#fff', padding:'0.5rem 1rem', borderRadius:'6px', cursor:'pointer' }} onClick={() => setShowRideModal(false)}>CANCEL</button>
                    <button style={{ background:'#00C9A7', border:'none', color:'#000', padding:'0.5rem 1.5rem', borderRadius:'6px', cursor:'pointer', fontWeight:900 }} type="submit">COMMIT</button>
                 </div>
              </form>
           </motion.div>
        </div>
      )}

      {/* Deploy / Assign Modal */}
      <AnimatePresence>
        {assignModal && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}
            onClick={e => { if(e.target===e.currentTarget) setAssignModal(null); }}>
            <motion.div initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.95}}
              style={{ background:'#0b0f14', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'14px', width:500, overflow:'hidden', boxShadow:'0 40px 80px rgba(0,0,0,0.6)' }}>
              <div style={{ padding:'1.25rem 1.5rem', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                   <div style={{ fontSize:'0.65rem', fontWeight:900, color:'#8896ab' }}>RESOURCE_DEPLOYMENT</div>
                   <div style={{ fontSize:'0.75rem', fontWeight:800, color:'#fff', marginTop:'0.25rem' }}>{(assignModal.task_name||'').slice(0,55)}</div>
                </div>
                <button onClick={() => setAssignModal(null)} style={{ background:'transparent', border:'none', color:'#8896ab', cursor:'pointer' }}><Icons.X /></button>
              </div>
              <div style={{ padding:'1.5rem', overflowY: 'auto', maxHeight: '75vh' }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem', marginBottom:'0.75rem', padding:'0.75rem', background:'rgba(255,255,255,0.02)', borderRadius:'8px', fontSize:'0.62rem', color:'#8896ab' }}>
                   <span>SAP ID: <strong style={{color:'#6C63FF'}}>{assignModal.sap_id}</strong></span>
                   <span>Hours: <strong style={{color:'#3b82f6'}}>{assignModal.est_hours}h</strong></span>
                </div>

                <div style={{ marginBottom:'1rem' }}>
                  <label style={{ fontSize:'0.65rem', fontWeight:800, color:'#8896ab', display:'block', marginBottom:'0.45rem' }}>SELECT CENTRALIZED ENGINEER</label>
                  <select value={form.resName} onChange={e=>setForm({...form,resName:e.target.value})}
                    style={{ width:'100%', background:'#14191f', border:'1px solid rgba(255,255,255,0.1)', color:'#fff', padding:'0.65rem 0.85rem', borderRadius:'7px', fontSize:'0.78rem', outline:'none', cursor:'pointer' }}>
                    <option value="">-- CHOOSE FLEET RESOURCE --</option>
                    {centralResources.map(r => (
                      <option key={r.id} value={r.name}>
                        {r.employee_id} | {r.name} ({r.grade}) - Billing: ₹{r.hourly_billing_rate}/h
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom:'1rem' }}>
                  <label style={{ fontSize:'0.65rem', fontWeight:800, color:'#8896ab', display:'block', marginBottom:'0.45rem' }}>EDITABLE BOOKED HOURS</label>
                  <input required type="number" min="0" value={form.booking_hours} onChange={e=>setForm({...form,booking_hours:parseFloat(e.target.value||0)})}
                    style={{ width:'100%', background:'#14191f', border:'1px solid rgba(255,255,255,0.1)', color:'#fff', padding:'0.65rem 0.85rem', borderRadius:'7px', fontSize:'0.78rem', outline:'none' }} />
                </div>

                {(() => {
                  const selectedRes = centralResources.find(r => r.name === form.resName);
                  if (!selectedRes) return null;
                  
                  const activeHours = parseFloat(form.booking_hours || 0);
                  const forecastedCost = activeHours * selectedRes.cost_rate;
                  const forecastedBilling = activeHours * selectedRes.hourly_billing_rate;
                  const forecastedMargin = forecastedBilling - forecastedCost;
                  const forecastedMarginPct = forecastedBilling > 0 ? (forecastedMargin / forecastedBilling) * 100 : 0;
                  
                  return (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                      style={{ background: 'rgba(0, 242, 255, 0.04)', border: '1px solid rgba(0, 242, 255, 0.2)', padding: '0.85rem', borderRadius: '8px', marginBottom: '1rem' }}>
                      <div style={{ fontSize: '0.62rem', color: '#00ffd1', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Live Financial Forecast</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.68rem', color: '#c8d6e5' }}>
                        <div>Cost Rate: <strong>₹{selectedRes.cost_rate}/hr</strong></div>
                        <div>Billing Rate: <strong>₹{selectedRes.hourly_billing_rate}/hr</strong></div>
                        <div>Projected Cost: <strong>₹{forecastedCost.toLocaleString()}</strong></div>
                        <div>Projected Billing: <strong>₹{forecastedBilling.toLocaleString()}</strong></div>
                        <div style={{ gridColumn: 'span 2' }}>Projected Margin: <strong style={{ color: forecastedMargin >= 0 ? '#00ffd1' : '#ef4444' }}>₹{forecastedMargin.toLocaleString()} ({Math.round(forecastedMarginPct)}%)</strong></div>
                      </div>
                    </motion.div>
                  );
                })()}

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem', marginBottom:'1rem' }}>
                  <div>
                    <label style={{ fontSize:'0.6rem', fontWeight:800, color:'#8896ab', display:'block', marginBottom:'0.4rem' }}>START DATE</label>
                    <input type="date" value={form.startDate} onChange={e=>setForm({...form,startDate:e.target.value})}
                      style={{ width:'100%', background:'#14191f', border:'1px solid rgba(255,255,255,0.1)', color:'#fff', padding:'0.65rem 0.85rem', borderRadius:'7px', fontSize:'0.75rem', outline:'none' }} />
                  </div>
                  <div>
                    <label style={{ fontSize:'0.6rem', fontWeight:800, color:'#8896ab', display:'block', marginBottom:'0.4rem' }}>END DATE</label>
                    <input type="date" value={form.endDate} onChange={e=>setForm({...form,endDate:e.target.value})}
                      style={{ width:'100%', background:'#14191f', border:'1px solid rgba(255,255,255,0.1)', color:'#fff', padding:'0.65rem 0.85rem', borderRadius:'7px', fontSize:'0.75rem', outline:'none' }} />
                  </div>
                </div>
                
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem', marginBottom:'1.25rem' }}>
                  <div>
                    <label style={{ fontSize:'0.6rem', fontWeight:800, color:'#8896ab', display:'block', marginBottom:'0.4rem' }}>DURATION (DAYS)</label>
                    <input type="number" min="0" value={form.duration} onChange={e=>setForm({...form,duration:parseFloat(e.target.value||0)})}
                      style={{ width:'100%', background:'#14191f', border:'1px solid rgba(255,255,255,0.1)', color:'#fff', padding:'0.65rem 0.85rem', borderRadius:'7px', fontSize:'0.75rem', outline:'none' }} />
                  </div>
                  <div>
                    <label style={{ fontSize:'0.6rem', fontWeight:800, color:'#8896ab', display:'block', marginBottom:'0.4rem' }}>PRIORITY</label>
                    <select value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}
                      style={{ width:'100%', background:'#14191f', border:'1px solid rgba(255,255,255,0.1)', color:'#fff', padding:'0.65rem 0.85rem', borderRadius:'7px', fontSize:'0.75rem', outline:'none', cursor:'pointer' }}>
                      {['CRITICAL','HIGH','MEDIUM','LOW'].map(p=><option key={p}>{p}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div style={{ padding:'1rem 1.5rem', background:'rgba(0,0,0,0.3)', borderTop:'1px solid rgba(255,255,255,0.05)', display:'flex', justifyContent:'flex-end', gap:'0.75rem' }}>
                <button onClick={()=>setAssignModal(null)} style={{ background:'transparent', border:'1px solid rgba(255,255,255,0.1)', color:'#fff', padding:'0.6rem 1.2rem', borderRadius:'7px', fontSize:'0.7rem', fontWeight:800, cursor:'pointer' }}>ABORT</button>
                <button onClick={handleAssign} disabled={!form.resName||saving}
                  style={{ background:form.resName?'#00ffd1':'#1a1a1a', color:form.resName?'#000':'#444', border:'none', padding:'0.6rem 1.5rem', borderRadius:'7px', fontSize:'0.7rem', fontWeight:900, cursor:form.resName?'pointer':'not-allowed' }}>
                  {saving ? 'DEPLOYING...' : 'INITIALIZE_DEPLOYMENT'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        * { box-sizing:border-box; }
        ::-webkit-scrollbar { width:4px; height:4px; } ::-webkit-scrollbar-track { background:transparent; } ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); border-radius:2px; }
      `}</style>
    </div>
  );
}
