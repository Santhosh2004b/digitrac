"use client";

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  LogOut, Play, CheckCircle2, Clock, Zap, Target, 
  Cpu, Activity, Shield, ChevronRight, BarChart3, 
  AlertCircle, PlayCircle, Timer, Trash2
} from 'lucide-react';

const API = 'http://127.0.0.1:8000';

export default function EmployeeDashboard() {
  const router = useRouter();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [logHours, setLogHours] = useState({});
  const [toasts, setToasts] = useState([]);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [activeTimers, setActiveTimers] = useState({});
  const [now, setNow] = useState(Date.now());

  const getToken = () => localStorage.getItem('token');
  const handleLogout = () => { localStorage.removeItem('token'); router.push('/'); };

  const fetchTasks = async () => {
    const token = getToken();
    if (!token) { router.push('/'); return; }
    try {
      const res = await fetch(`${API}/employee/tasks`, { 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      if (res.status === 401) { router.push('/'); return; }
      const data = await res.json();
      setTasks(data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('digitrac_timers');
    if (saved) {
      try { setActiveTimers(JSON.parse(saved)); } catch (e) {}
    }
  }, []);

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  const logTime = async (taskId, specificHours = null) => {
    const token = getToken();
    const hours = specificHours || parseFloat(logHours[taskId] || '1');
    if (!hours || isNaN(hours)) return;

    try {
      const res = await fetch(`${API}/employee/logs`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ task_id: taskId, hours })
      });
      if (res.ok) {
        showToast(`Logged ${hours}h to project workflow`);
        fetchTasks();
        setLogHours(prev => ({ ...prev, [taskId]: '' }));
      }
    } catch (err) { console.error(err); }
  };

  const handleAction = async (taskId, action) => {
     const token = getToken();
     try {
       const res = await fetch(`${API}/employee/tasks/${taskId}/${action}`, {
         method: 'POST', 
         headers: { 'Authorization': `Bearer ${token}` }
       });
       if (res.ok) {
         showToast(`Project Item ${action === 'start' ? 'Started' : 'Finalized'}`);
         fetchTasks();
       }
     } catch (err) { console.error(err); }
  };

  const startTimer = (taskId) => {
    const hours = parseFloat(logHours[taskId] || '1');
    if (!hours || isNaN(hours)) return;
    
    const durationMs = hours * 3600000;
    const endTime = Date.now() + durationMs;
    
    const newTimers = { ...activeTimers, [taskId]: { endTime, hours } };
    setActiveTimers(newTimers);
    localStorage.setItem('digitrac_timers', JSON.stringify(newTimers));
    showToast(`Timer Started: ${hours}h`);
  };

  const abortTimer = (taskId) => {
    const newTimers = { ...activeTimers };
    delete newTimers[taskId];
    setActiveTimers(newTimers);
    localStorage.setItem('digitrac_timers', JSON.stringify(newTimers));
    showToast("Timer Canceled", "warning");
  };

  useEffect(() => {
    Object.keys(activeTimers).forEach(taskId => {
      if (now >= activeTimers[taskId].endTime) {
        const hours = activeTimers[taskId].hours;
        logTime(parseInt(taskId), hours);
        abortTimer(taskId);
      }
    });
  }, [now]);

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#020406', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1.5rem' }}>
      <motion.div animate={{ rotate: 360, scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }} style={{ width: 60, height: 60, borderRadius: '50%', border: '2px solid rgba(59, 130, 246, 0.1)', borderTopColor: '#3b82f6' }} />
      <div style={{ fontSize: '0.8rem', fontWeight: 900, color: '#3b82f6', letterSpacing: '0.3em', textTransform: 'uppercase' }}>Synchronizing Personal Workspace...</div>
    </div>
  );

  const activeTasks = tasks.filter(t => t.status !== 'completed');
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const topTask = selectedTaskId ? tasks.find(t => t.id === selectedTaskId) : (activeTasks.length > 0 ? activeTasks[0] : null);

  const totalTarget = tasks.reduce((acc, t) => acc + (t.expected_hours || 0), 0);
  const totalLogged = tasks.reduce((acc, t) => acc + (t.logged_hours || 0), 0);
  const progressPercent = Math.round((totalLogged / Math.max(1, totalTarget)) * 100);
  const taskCompletionPercent = Math.round((completedTasks.length / Math.max(1, tasks.length)) * 100);

  const deleteTask = async (taskId, e) => {
    e.stopPropagation();
    const token = getToken();
    try {
      const res = await fetch(`${API}/employee/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showToast("Project item deleted", "warning");
        fetchTasks();
        if (selectedTaskId === taskId) setSelectedTaskId(null);
      }
    } catch (err) { console.error(err); }
  };

  return (
    <div className="emp-dashboard">
      <link rel="stylesheet" href="/employee.css" />
      
      {/* SECTION 1: TOP BAR */}
      <header className="emp-top-bar">
        <div className="emp-logo">
          <div className="logo-icon">DT</div>
          <div className="logo-text">
            <h1>Personal Dashboard</h1>
            <span>PERSONAL WORKSPACE</span>
          </div>
        </div>
        
        <div className="emp-stats-bar">
          <div className="stat-mini">
            <span className="val" style={{ color: '#3b82f6' }}>{progressPercent}%</span>
            <span className="lab">Execution</span>
          </div>
          <div className="stat-mini">
            <span className="val" style={{ color: '#00C9A7' }}>{totalLogged}h</span>
            <span className="lab">Logged</span>
          </div>
          <div className="stat-mini">
            <span className="val" style={{ color: '#FFB347' }}>{activeTasks.length}</span>
            <span className="lab">Pending</span>
          </div>
          <button onClick={handleLogout} className="emp-btn-primary" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.4rem 0.8rem', fontSize: '0.65rem' }}>LOGOUT</button>
        </div>
      </header>

      <div className="emp-grid">
        {/* SECTION 2: WORKFLOW BACKLOG (Left 65%) */}
        <section className="backlog-container">
          <div className="glass-widget" style={{ flex: 1, padding: '0.5rem 0' }}>
            <div className="widget-title" style={{ padding: '0.75rem 1.25rem', marginBottom: 0 }}>
              <Zap size={14} /> WORKFLOW BACKLOG
            </div>
            <div style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 200px)' }}>
              <table className="compact-task-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>PRIO</th>
                    <th>PROJECT ITEM</th>
                    <th>PORTFOLIO</th>
                    <th style={{ width: '80px' }}>STATUS</th>
                    <th style={{ width: '80px' }}>LOGGED</th>
                    <th style={{ width: '40px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {activeTasks.map(task => (
                    <tr 
                      key={task.id} 
                      className={selectedTaskId === task.id ? 'active' : ''} 
                      onClick={() => setSelectedTaskId(task.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td><span className={`task-priority-dot priority-${task.priority.toLowerCase()}`}></span></td>
                      <td style={{ fontWeight: 800 }}>{task.title}</td>
                      <td style={{ color: '#8896ab', fontSize: '0.65rem' }}>{task.project_name}</td>
                      <td><span style={{ fontSize: '0.55rem', fontWeight: 900, opacity: 0.7 }}>{task.status.toUpperCase()}</span></td>
                      <td style={{ fontWeight: 700 }}>{task.logged_hours || 0} / {task.expected_hours}h</td>
                      <td><Trash2 size={12} color="#ef4444" style={{ opacity: 0.4 }} onClick={(e) => deleteTask(task.id, e)} /></td>
                    </tr>
                  ))}
                  {activeTasks.length === 0 && (
                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#8896ab' }}>All clear. No active items.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* SECTION 3: COMMAND PANEL (Right 35%) */}
        <aside className="command-panel">
          {topTask ? (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-widget focus-card">
              <div className="widget-title"><Target size={14} /> ACTIVE PROJECT ITEM</div>
              <h2>{topTask.title}</h2>
              <p>Portfolio Integration: {topTask.project_name}</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="stat-mini" style={{ alignItems: 'flex-start' }}>
                  <span className="lab">Target Hours</span>
                  <span className="val">{topTask.expected_hours}h</span>
                </div>
                <div className="stat-mini" style={{ alignItems: 'flex-start' }}>
                  <span className="lab">Efficiency</span>
                  <span className="val" style={{ color: '#00C9A7' }}>{((topTask.expected_hours / Math.max(1, topTask.logged_hours)) * 100).toFixed(0)}%</span>
                </div>
              </div>

              <div className="progress-ring">
                <svg width="120" height="120" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" stroke="rgba(255,255,255,0.02)" strokeWidth="8" fill="none" />
                  <circle cx="50" cy="50" r="45" stroke="#3b82f6" strokeWidth="8" fill="none" strokeDasharray="283" strokeDashoffset={283 - (283 * (topTask.logged_hours / topTask.expected_hours))} strokeLinecap="round" transform="rotate(-90 50 50)" />
                </svg>
              </div>

              <div className="log-input-group">
                <input 
                  type="number" 
                  className="emp-input" 
                  placeholder="0.0h"
                  value={logHours[topTask.id] || ''} 
                  onChange={(e) => setLogHours(prev => ({ ...prev, [topTask.id]: e.target.value }))}
                />
                <button className="emp-btn-primary" onClick={() => logTime(topTask.id)}>LOG HOURS</button>
              </div>

              <button className="emp-btn-outline" onClick={() => handleAction(topTask.id, 'complete')}>
                <CheckCircle2 size={16} /> COMPLETE ITEM
              </button>
            </motion.div>
          ) : (
            <div className="glass-widget" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <Shield size={48} color="#00C9A7" style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <div style={{ fontSize: '1rem', fontWeight: 900 }}>READY FOR ASSIGNMENT</div>
              <div style={{ fontSize: '0.7rem', color: '#8896ab', marginTop: '0.5rem' }}>Select a project item from the backlog.</div>
            </div>
          )}

          <div className="glass-widget">
            <div className="widget-title"><Activity size={14} /> PERFORMANCE MATRIX</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                  <span style={{ color: '#8896ab' }}>Total Items</span>
                  <span style={{ fontWeight: 800 }}>{tasks.length}</span>
               </div>
               <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                  <span style={{ color: '#8896ab' }}>Completed</span>
                  <span style={{ fontWeight: 800, color: '#00C9A7' }}>{completedTasks.length}</span>
               </div>
               <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                  <span style={{ color: '#8896ab' }}>Active Hours</span>
                  <span style={{ fontWeight: 800 }}>{totalLogged}h</span>
               </div>
            </div>
          </div>
        </aside>
      </div>

      {/* TOAST SYSTEM */}
      <div className="toast-container">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div 
              key={t.id} 
              initial={{ opacity: 0, y: 20, scale: 0.9 }} 
              animate={{ opacity: 1, y: 0, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.9 }} 
              className="toast"
              style={{ borderLeft: `4px solid ${t.type === 'success' ? '#00C9A7' : '#ef4444'}` }}
            >
              {t.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
