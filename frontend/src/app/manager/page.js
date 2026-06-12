"use client";

import React, { useEffect, useState, useMemo } from 'react';

import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';



const API = 'http://127.0.0.1:8000';

const tok = () => {
    if (typeof window !== 'undefined') return localStorage.getItem('token');
    return null;
};

// Global fetch helper — auto logout on expired token
const fetchWithAuth = async (url, options = {}) => {
  const token = tok();
  if (!token) {
    if (typeof window !== 'undefined') window.location.href = '/';
    return null;
  }
  const res = await fetch(url, {
    ...options,
    headers: { ...options.headers, Authorization: `Bearer ${token}` }
  });
  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.clear();
      window.location.href = '/';
    }
    return null;
  }
  return res;
};



const Icons = {
  Grid: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  Folder: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>,
  Bell: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>,
  Logout: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  Clock: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>,
  Menu: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
};

const EMPLOYEE_RATES = {
  'D2': { day: 1500, hour: 187.5 },
  'D1': { day: 1750, hour: 219 },
  'C4': { day: 2727.27, hour: 341 },
  'C3': { day: 3636.36, hour: 455 },
  'C2': { day: 5454.55, hour: 682 },
  'C1': { day: 6818.18, hour: 852 },
  'B4': { day: 8181.82, hour: 1023 },
  'B3': { day: 9545.45, hour: 1193 },
  'B2': { day: 11363.64, hour: 1420 },
  'B1': { day: 13636.36, hour: 1705 },
  'A3': { day: 18181.82, hour: 2273 },
  'A2': { day: 22727.27, hour: 2841 },
};



export default function ManagerDashboard() {

  const router = useRouter();

  const [activeTab, setActiveTab] = useState('DASHBOARD');

  

  const [projects, setProjects] = useState([]);

  const [selectedProject, setSelectedProject] = useState(null);

  

  const [notifications, setNotifications] = useState([]);

  const [showNotifications, setShowNotifications] = useState(false);



  const [projectData, setProjectData] = useState(null);

  const [innerTab, setInnerTab] = useState('COSTING'); // COSTING, WORKFORCE, OVERVIEW
  
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [hoverRowId, setHoverRowId] = useState(null);



  // Resource Assignment Modals & Data

  const [centralResources, setCentralResources] = useState([]);

  const [showAssignModal, setShowAssignModal] = useState(false);

  const [assignItem, setAssignItem] = useState(null);

  const [assignForm, setAssignForm] = useState({ assigned_person: '', start_date: '', planned_hours: 0, travel_cost: 0, food_cost: 0, stay_cost: 0, other_cost: 0, manhour_cost_per_day: 0, manpower_cost_per_hour: 0 });

  const [durationMonths, setDurationMonths] = useState(0);

  const [durationYears, setDurationYears] = useState(0);

  const [durationWeeks, setDurationWeeks] = useState(0);

  const [durationDays, setDurationDays] = useState(0);

  const [showDays, setShowDays] = useState(false);

  const [showCosts, setShowCosts] = useState(false);
  const [isDurationConfirmed, setIsDurationConfirmed] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Hours Logging Modal & Data

  const [showLogModal, setShowLogModal] = useState(false);

  const [logItem, setLogItem] = useState(null);

  const [logForm, setLogForm] = useState({ date: '', hours: 0, remarks: '' });

  // AI Chat Box State
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [chatMessages, setChatMessages] = useState([
    { role: 'ai', content: 'Hello Manager! I am your tactical AI assistant. Select a question below to analyze your projects:' }
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  
  const suggestedQuestions = [
    "What is the current burn rate for my active project?",
    "Are there any resources with 0 hours logged?",
    "Show me my project's margin health."
  ];

  const handleChatQuestion = async (question) => {
    setChatMessages(prev => [...prev, { role: 'user', content: question }]);
    setIsChatLoading(true);
    try {
      const res = await fetch(`${API}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` },
        body: JSON.stringify({ question })
      });
      const data = await res.json();
      setChatMessages(prev => [...prev, { role: 'ai', content: data.answer || data.detail || 'Error connecting to intelligence feed.' }]);
    } catch (e) {
      setChatMessages(prev => [...prev, { role: 'ai', content: 'Connection to AI framework failed.' }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Client‑only user email – avoids server/client HTML mismatch

  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {

    if (typeof window !== 'undefined') {

      const email = localStorage.getItem('user_email') || '';

      setUserEmail(email);

    }

  }, []);



  const fetchProjects = async () => {
    const res = await fetchWithAuth(`${API}/manager/projects`);
    if (res?.ok) setProjects(await res.json());
  };



  const fetchCentralResources = async () => {
    const res = await fetchWithAuth(`${API}/manager/centralized-resources`);
    if (res?.ok) setCentralResources(await res.json());
  };



  const fetchNotifications = async () => {
    const token = tok();
    if (!token) return;
    try {
      const res = await fetchWithAuth(`${API}/notifications/`);
      if (res?.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setNotifications(data);
      }
    } catch(e) { console.error(e); }
  };



  const loadProject = async (id) => {
    const res = await fetchWithAuth(`${API}/manager/projects/${id}`);
    if (res?.ok) {
      const pData = await res.json();
      setSelectedProject(pData);
      setActiveTab('PROJECTS');
      const scrollContainer = document.getElementById('main-scroll-container');
      if (scrollContainer) scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };



  useEffect(() => {

    fetchProjects();

    fetchNotifications();

    fetchCentralResources();

    const intv = setInterval(fetchNotifications, 120000); // poll every 2 minutes

    return () => clearInterval(intv);

  }, []);



  const handleNotificationClick = async (notif) => {

    try {

      await fetch(`${API}/notifications/${notif.id}/read`, { method: 'POST', headers: { Authorization: `Bearer ${tok()}` } });

      fetchNotifications();

    } catch(e) {}

    setShowNotifications(false);

    if (notif.project_id) {

        loadProject(notif.project_id);

    }

  };



  const HOURS_PER_MONTH = 160; // 8 hrs/day × 5 days/week × 4 weeks



  const calcHoursFromDuration = (months, years, weeks = 0, days = 0) => {

    const totalMonths = (parseInt(years) || 0) * 12 + (parseInt(months) || 0);

    return totalMonths * HOURS_PER_MONTH + (parseInt(weeks) || 0) * 40 + (parseInt(days) || 0) * 8;

  };



  const openAssignModal = (item) => {

      setAssignItem(item);

      setAssignForm({ assigned_person: '', start_date: new Date().toISOString().split('T')[0], planned_hours: 0, travel_cost: 0, food_cost: 0, stay_cost: 0, other_cost: 0, manhour_cost_per_day: 0, manpower_cost_per_hour: 0 });

      setDurationMonths(0);

      setDurationYears(0);

      setDurationWeeks(0);

      setDurationDays(0);

      setShowDays(false);

      setShowCosts(false);

      setShowAssignModal(true);

  };



  const submitAssign = async () => {

      if (!assignForm.assigned_person) return alert("Select a person");

      try {

          const res = await fetchWithAuth(`${API}/manager/projects/${selectedProject.id}/items/${assignItem.id}/assign`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(assignForm)
          });

          if (res.ok) {
              setShowAssignModal(false);
              loadProject(selectedProject.id); // reload specific project
              fetchProjects(); // refresh global dashboard data to be 'live'
          } else {

              alert("Error assigning resource");

          }

      } catch (e) {

          alert("Error assigning");

      }

  };



  const openLogModal = (item) => {

      setLogItem(item);

      setLogForm({ date: new Date().toISOString().split('T')[0], hours: 0, remarks: '' });

      setShowLogModal(true);

  };



  const submitLog = async () => {

      if (logForm.hours <= 0) return alert("Enter valid hours");

      try {

          const res = await fetchWithAuth(`${API}/manager/projects/${selectedProject.id}/items/${logItem.id}/log-hours`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(logForm)
          });

          if (res.ok) {
              setShowLogModal(false);
              loadProject(selectedProject.id);
              fetchProjects(); // refresh global dashboard data to be 'live'
          } else {

              alert("Error logging hours");

          }

      } catch (e) {

          alert("Error logging hours");

      }

  };



  

  const [feed, setFeed] = useState([]);

  

  useEffect(() => {

    if (innerTab === 'INTELLIGENCE') {

        fetch(`${API}/intelligence/feed`, { headers: { Authorization: `Bearer ${tok()}` } })

            .then(res => res.json())

            .then(data => setFeed(data.filter(e => e.project_id === selectedProject?.id)))

            .catch(console.error);

    }

  }, [innerTab, selectedProject]);



  const unreadCount = notifications.filter(n => !n.is_read).length;



  return (

    <div style={{ 
      display:'flex', 
      minHeight:'100vh', 
      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', 
      position: 'relative',
      color:'#1e293b', 
      fontFamily:"'Inter',sans-serif" 
    }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .data-table th:not(:last-child), .data-table td:not(:last-child) {
          border-right: 1px solid rgba(0,0,0,0.06);
        }
      ` }} />
      {/* Elite Main Background Glows */}
      <div style={{ position: 'absolute', top: 0, right: 0, width: '40vw', height: '40vw', background: 'radial-gradient(circle, rgba(59,130,246,0.03) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }}></div>
      <div style={{ position: 'absolute', bottom: 0, left: '260px', width: '30vw', height: '30vw', background: 'radial-gradient(circle, rgba(139,92,246,0.03) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }}></div>


      {/* Sidebar */}

      <aside style={{ 
        width: isSidebarOpen ? 260 : 70, 
        transition: isSidebarOpen ? 'width 2s cubic-bezier(0.4, 0, 0.2, 1) 0s' : 'width 2s cubic-bezier(0.4, 0, 0.2, 1) 0.5s',
        height: '100vh',
        position: 'sticky',
        top: 0,
        background: 'radial-gradient(ellipse at 50% -20%, rgba(59,130,246,0.2), transparent 60%), radial-gradient(circle at 100% 100%, rgba(139,92,246,0.15), transparent 50%), linear-gradient(180deg, #020617 0%, #080f20 100%)', 
        borderRight: '1px solid rgba(255,255,255,0.08)', 
        display: 'flex', 
        flexDirection: 'column', 
        padding: '1.5rem 0.5rem', 
        flexShrink: 0, 
        zIndex: 10, 
        overflow: 'hidden',
        boxShadow: '2px 0 20px rgba(0,0,0,0.2)'
      }}>

        {/* Advanced Neural Grid Overlay */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '20px 20px', pointerEvents: 'none', zIndex: 0 }}></div>

        {/* Ambient Top Glow */}
        <div style={{ position: 'absolute', top: 0, left: '20%', width: '60%', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.5), transparent)', boxShadow: '0 2px 20px rgba(59,130,246,0.5)', zIndex: 0 }}></div>



        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2.5rem', position: 'relative', zIndex: 1 }}>

          {/* Toggle Menu Button */}
          <motion.div 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            animate={{ rotate: isSidebarOpen ? 180 : 0 }}
            transition={{ duration: 2, ease: "easeInOut" }}
            style={{ position: 'absolute', right: isSidebarOpen ? '-10px' : 'auto', top: '-10px', color: '#94a3b8', cursor: 'pointer', padding: '0.5rem', display: 'flex', justifyContent: 'center' }}
          >
            <Icons.Menu />
          </motion.div>

          <motion.div 
            animate={{ filter: ['drop-shadow(0 2px 10px rgba(255,255,255,0.1))', 'drop-shadow(0 0 15px rgba(59,130,246,0.6))', 'drop-shadow(0 2px 10px rgba(255,255,255,0.1))'] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            style={{ fontSize: isSidebarOpen ? '1.5rem' : '1rem', fontWeight: 900, background: 'linear-gradient(180deg, #ffffff 0%, #94a3b8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.02em', lineHeight: 1, marginTop: '2rem', transition: 'font-size 2s' }}
          >
            {isSidebarOpen ? 'DIGITRAC' : 'DT'}
          </motion.div>

          <div style={{ 
            opacity: isSidebarOpen ? 1 : 0, 
            visibility: isSidebarOpen ? 'visible' : 'hidden',
            transition: isSidebarOpen ? 'opacity 0.5s ease 1.5s, visibility 0s 1.5s' : 'opacity 0.5s ease 0s, visibility 0s 0.5s',
            whiteSpace: 'nowrap',
            fontSize: '0.65rem', fontWeight: 800, color: '#3b82f6', letterSpacing: '0.15em', marginTop: '0.4rem', textShadow: '0 0 10px rgba(59,130,246,0.4)' 
          }}>PROJECT MANAGER</div>

        </div>



        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', position: 'relative', zIndex: 1 }}>

          <motion.div 
            onClick={() => { setActiveTab('DASHBOARD'); setSelectedProject(null); }} 
            animate={(activeTab === 'DASHBOARD' || activeTab === 'PROJECTS') ? { boxShadow: ['inset 2px 0 0 #3b82f6, inset 0 0 10px rgba(59,130,246,0.05)', 'inset 2px 0 0 #3b82f6, inset 0 0 30px rgba(59,130,246,0.25)', 'inset 2px 0 0 #3b82f6, inset 0 0 10px rgba(59,130,246,0.05)'] } : { boxShadow: 'inset 0 0 0 transparent' }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            style={{ 
              display:'flex', alignItems:'center', justifyContent: isSidebarOpen ? 'flex-start' : 'center', gap: isSidebarOpen ? '0.75rem' : '0', padding:'0.85rem 1rem', borderRadius:'8px', fontSize:'0.85rem', fontWeight:600, 
              background: (activeTab === 'DASHBOARD' || activeTab === 'PROJECTS') ? 'rgba(59,130,246,0.08)' : 'transparent', 
              color: (activeTab === 'DASHBOARD' || activeTab === 'PROJECTS') ? '#60a5fa' : '#64748b', 
              cursor: 'pointer', transition: 'background 0.3s, color 0.3s, justify-content 0.3s, gap 0.3s'
            }}
            onMouseOver={e => { if(activeTab !== 'DASHBOARD' && activeTab !== 'PROJECTS') { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = '#e2e8f0'; } }}
            onMouseOut={e => { if(activeTab !== 'DASHBOARD' && activeTab !== 'PROJECTS') { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b'; } }}
          >
            <Icons.Grid />
            <span style={{ 
              opacity: isSidebarOpen ? 1 : 0, 
              width: isSidebarOpen ? 'auto' : 0,
              visibility: isSidebarOpen ? 'visible' : 'hidden',
              transition: isSidebarOpen ? 'opacity 0.5s ease 1.5s, visibility 0s 1.5s' : 'opacity 0.5s ease 0s, visibility 0s 0.5s, width 0.5s',
              whiteSpace: 'nowrap',
              overflow: 'hidden'
            }}>Dashboard</span>
          </motion.div>

          





          <div style={{ 
              opacity: isSidebarOpen ? 1 : 0, 
              visibility: isSidebarOpen ? 'visible' : 'hidden',
              transition: isSidebarOpen ? 'opacity 0.5s ease 1.5s, visibility 0s 1.5s' : 'opacity 0.5s ease 0s, visibility 0s 0.5s',
              whiteSpace: 'nowrap',
              marginTop: '1.5rem', padding: '0 1rem', fontSize: '0.6rem', fontWeight: 800, color: '#334155', letterSpacing: '0.15em' 
          }}>SYSTEM ALERTS</div>

          

          <div 

            onClick={() => setShowNotifications(!showNotifications)} 

            style={{ display:'flex', alignItems:'center', justifyContent: isSidebarOpen ? 'space-between' : 'center', padding:'0.85rem 1rem', borderRadius:'8px', fontSize:'0.85rem', fontWeight:600, color: '#94a3b8', cursor: 'pointer', position: 'relative', transition: 'all 0.2s', borderLeft: '3px solid transparent' }}
            onMouseOver={e => { e.currentTarget.style.color = '#f8fafc'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
            onMouseOut={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'transparent' }}

          >

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: isSidebarOpen ? 'flex-start' : 'center', gap: isSidebarOpen ? '0.75rem' : '0' }}>

                <Icons.Bell /><span style={{ 
                  opacity: isSidebarOpen ? 1 : 0, 
                  width: isSidebarOpen ? 'auto' : 0,
                  visibility: isSidebarOpen ? 'visible' : 'hidden',
                  transition: isSidebarOpen ? 'opacity 0.5s ease 1.5s, visibility 0s 1.5s' : 'opacity 0.5s ease 0s, visibility 0s 0.5s, width 0.5s',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden'
                }}>Notifications</span>

            </div>

            {unreadCount > 0 && isSidebarOpen && (

                <div style={{ background: '#ef4444', color: '#fff', fontSize: '0.65rem', fontWeight: 800, padding: '0.1rem 0.4rem', borderRadius: '12px', boxShadow: '0 0 8px rgba(239,68,68,0.4)' }}>{unreadCount}</div>

            )}
            {unreadCount > 0 && !isSidebarOpen && (
                <div style={{ position: 'absolute', top: '10px', right: '10px', width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%', boxShadow: '0 0 8px rgba(239,68,68,0.6)' }}></div>
            )}

          </div>

        </div>



        <div style={{ marginTop:'auto', padding:'1rem 0.5rem 0 0.5rem', position: 'relative', zIndex: 1 }}>
          <button 
            onClick={() => { localStorage.clear(); router.push('/'); }} 
            style={{ 
              width:'100%', padding:'0.75rem', background:'linear-gradient(135deg, rgba(239,68,68,0.1), rgba(185,28,28,0.2))', color:'#fca5a5', 
              border:'1px solid rgba(239,68,68,0.25)', borderRadius:'8px', fontSize:'0.75rem', fontWeight:800, 
              cursor:'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: isSidebarOpen ? '0.6rem' : '0', 
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', backdropFilter: 'blur(10px)', letterSpacing: '0.05em',
              boxShadow: '0 4px 15px rgba(239,68,68,0.1)'
            }} 
            onMouseOver={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(185,28,28,0.3))'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.boxShadow = '0 0 20px rgba(239,68,68,0.3)'; e.currentTarget.style.transform = 'translateY(-1px)'; }} 
            onMouseOut={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(239,68,68,0.1), rgba(185,28,28,0.2))'; e.currentTarget.style.color = '#fca5a5'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(239,68,68,0.1)'; e.currentTarget.style.transform = 'none'; }}
          >
            <Icons.Logout /> <span style={{ 
              opacity: isSidebarOpen ? 1 : 0, 
              width: isSidebarOpen ? 'auto' : 0,
              visibility: isSidebarOpen ? 'visible' : 'hidden',
              transition: isSidebarOpen ? 'opacity 0.5s ease 1.5s, visibility 0s 1.5s' : 'opacity 0.5s ease 0s, visibility 0s 0.5s, width 0.5s',
              whiteSpace: 'nowrap',
              overflow: 'hidden'
            }}>SIGN OUT</span>
          </button>
        </div>

      </aside>



      {/* Main Content */}

      <main style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', position: 'relative' }}>

        

        {/* Header */}

        <header style={{ background: '#ffffff', padding: '0.75rem 2rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>

            {/* Left: Title or Active Project Chip */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
              {!selectedProject ? (
                <h1 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#0f172a', whiteSpace: 'nowrap' }}>Project Hub</h1>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', border: '1px solid #bfdbfe', borderRadius: '20px', padding: '0.4rem 0.5rem 0.4rem 1rem', maxWidth: '400px', boxShadow: '0 2px 8px rgba(37,99,235,0.1)' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: selectedProject.status === 'Red' ? '#ef4444' : selectedProject.status === 'Orange' ? '#f59e0b' : '#10b981', flexShrink: 0, boxShadow: `0 0 6px ${selectedProject.status === 'Red' ? '#ef4444' : selectedProject.status === 'Orange' ? '#f59e0b' : '#10b981'}` }}></div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#1e40af', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>P{selectedProject.id} — {selectedProject.name}</span>
                  <button
                    onClick={() => { setSelectedProject(null); setActiveTab('DASHBOARD'); }}
                    style={{ background: '#bfdbfe', border: 'none', color: '#1e40af', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, fontWeight: 900, fontSize: '0.7rem', transition: 'all 0.2s' }}
                    onMouseOver={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = '#fff'; }}
                    onMouseOut={e => { e.currentTarget.style.background = '#bfdbfe'; e.currentTarget.style.color = '#1e40af'; }}
                    title="Close project"
                  >✕</button>
                </div>
              )}
            </div>

            {/* Right: Project switcher + user */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>

                <div style={{ position: 'relative' }}>
                  <div 
                    onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
                    style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: isProjectDropdownOpen ? '#f8fafc' : '#fff', fontSize: '0.75rem', cursor: 'pointer', color: '#0f172a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.03)', letterSpacing: '0.03em' }}
                    onMouseOver={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseOut={e => e.currentTarget.style.background = isProjectDropdownOpen ? '#f8fafc' : '#fff'}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                    SWITCH PROJECT
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ transform: isProjectDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}><polyline points="6 9 12 15 18 9"></polyline></svg>
                  </div>
                  <AnimatePresence>
                  {isProjectDropdownOpen && (
                    <motion.div 
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      variants={{
                        hidden: { opacity: 0, y: -10, scale: 0.95, transition: { staggerChildren: 0.05, staggerDirection: -1 } },
                        visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.2, ease: "easeOut", staggerChildren: 0.05, delayChildren: 0.05 } }
                      }}
                      style={{ position: 'absolute', top: '110%', right: 0, marginTop: '0.25rem', width: '320px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.05)', zIndex: 100, overflow: 'hidden', transformOrigin: 'top right' }}
                    >
                      <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
                        <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#64748b', letterSpacing: '0.1em' }}>SELECT PROJECT</div>
                      </div>
                      <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                        {projects.map((p, idx) => (
                          <motion.div 
                            key={p.id ?? `proj-${idx}`} 
                            variants={{
                              hidden: { opacity: 0, x: 20 },
                              visible: { opacity: 1, x: 0 }
                            }}
                            onClick={() => { loadProject(p.id); setIsProjectDropdownOpen(false); }}
                            style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', cursor: 'pointer', color: selectedProject?.id === p.id ? '#2563eb' : '#334155', fontWeight: selectedProject?.id === p.id ? 800 : 600, transition: 'background 0.15s, border 0.15s', display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid #f8fafc', borderLeft: selectedProject?.id === p.id ? '3px solid #3b82f6' : '3px solid transparent' }}
                            onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'}
                            onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: p.status === 'Red' ? '#ef4444' : p.status === 'Orange' ? '#f59e0b' : '#10b981', flexShrink: 0 }}></div>
                            <div>
                              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: selectedProject?.id === p.id ? '#1e40af' : '#0f172a' }}>P{p.id} — {p.name}</div>
                              <div style={{ fontSize: '0.6rem', color: '#64748b', marginTop: '1px', fontWeight: 500 }}>{p.customer_name || 'No customer'}</div>
                            </div>
                          </motion.div>
                        ))}
                        {projects.length === 0 && (
                          <div style={{ padding: '2rem', textAlign: 'center', fontSize: '0.75rem', color: '#64748b' }}>No projects assigned</div>
                        )}
                      </div>
                    </motion.div>
                  )}
                  </AnimatePresence>
                </div>

                {userEmail && <div style={{ background: '#f1f5f9', padding: '0.4rem 0.75rem', borderRadius: '20px', fontSize: '0.72rem', color: '#475569', fontWeight: 700, border: '1px solid #e2e8f0' }}>{userEmail}</div>}

            </div>

        </header>



        {/* Notifications Panel — Professional Light Theme */}
        {showNotifications && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }} onClick={() => setShowNotifications(false)}>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              onClick={e => e.stopPropagation()}
              style={{ position: 'absolute', top: '4.5rem', left: '270px', width: '360px', background: 'rgba(255,255,255,0.98)', backdropFilter: 'blur(20px)', borderRadius: '16px', boxShadow: '0 20px 40px -12px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)', zIndex: 1000, overflow: 'hidden' }}
            >
              {/* Header */}
              <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6', boxShadow: '0 0 8px rgba(59,130,246,0.4)' }}></div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 900, color: '#0f172a', letterSpacing: '0.05em' }}>NOTIFICATIONS</span>
                  {unreadCount > 0 && <span style={{ background: '#ef4444', color: '#fff', fontSize: '0.6rem', fontWeight: 800, padding: '0.1rem 0.4rem', borderRadius: '10px' }}>{unreadCount}</span>}
                </div>
                <button onClick={() => setShowNotifications(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', borderRadius: '6px', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', transition: 'all 0.2s' }} onMouseOver={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#0f172a'; }} onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8'; }}>✕</button>
              </div>
              {/* Body */}
              <div style={{ maxHeight: '380px', overflowY: 'auto', padding: '0.5rem' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '3rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🔔</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>You're all caught up!</div>
                  </div>
                ) : notifications.map(n => (
                  <div key={n.id} onClick={() => handleNotificationClick(n)}
                    style={{ padding: '0.85rem 1rem', margin: '0.25rem 0', borderRadius: '10px', cursor: 'pointer', background: n.is_read ? '#fff' : '#eff6ff', border: `1px solid ${n.is_read ? '#e2e8f0' : '#bfdbfe'}`, transition: 'all 0.2s', display: 'flex', alignItems: 'flex-start', gap: '0.75rem', boxShadow: n.is_read ? 'none' : '0 2px 4px rgba(59,130,246,0.05)' }}
                    onMouseOver={e => e.currentTarget.style.background = n.is_read ? '#f8fafc' : '#dbeafe'}
                    onMouseOut={e => e.currentTarget.style.background = n.is_read ? '#fff' : '#eff6ff'}
                  >
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: n.is_read ? '#f1f5f9' : '#bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.9rem' }}>{n.is_read ? '📁' : '🚀'}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: n.is_read ? '#64748b' : '#0f172a' }}>Project Assigned</span>
                        {!n.is_read && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3b82f6', flexShrink: 0, marginTop: '4px', boxShadow: '0 0 6px rgba(59,130,246,0.4)' }}></span>}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#2563eb', fontWeight: 700, marginBottom: '0.15rem' }}>{n.project_name}</div>
                      <div style={{ fontSize: '0.65rem', color: '#64748b' }}>Click to open project details</div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}



        <div id="main-scroll-container" style={{ flex: 1, padding: '1rem 1.5rem', overflowY: 'auto', scrollBehavior: 'smooth' }}>

            {activeTab === 'DASHBOARD' && !selectedProject && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', height: '100%' }}>

                    {/* Compact Header + KPI inline row */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(135deg, #0f172a, #1e293b)', borderRadius: '10px', padding: '0.75rem 1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div>
                                <div style={{ fontSize: '0.55rem', fontWeight: 800, color: '#3b82f6', letterSpacing: '0.12em' }}>COMMAND CENTER</div>
                                <div style={{ fontSize: '1rem', fontWeight: 900, color: '#f8fafc', letterSpacing: '-0.02em' }}>Portfolio Overview</div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '20px', padding: '0.2rem 0.6rem' }}>
                                <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }}></div>
                                <span style={{ fontSize: '0.55rem', fontWeight: 800, color: '#10b981' }}>LIVE</span>
                            </div>
                        </div>
                        {/* Inline KPI chips */}
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {[
                                { label: 'TOTAL', value: projects.length, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)' },
                                { label: 'AT RISK', value: projects.filter(p => p.status === 'Red' || p.status === 'Orange').length, color: projects.filter(p => p.status === 'Red' || p.status === 'Orange').length > 0 ? '#ef4444' : '#10b981', bg: projects.filter(p => p.status === 'Red' || p.status === 'Orange').length > 0 ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', border: projects.filter(p => p.status === 'Red' || p.status === 'Orange').length > 0 ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)' },
                                { label: 'HEALTHY', value: projects.filter(p => p.status === 'Green').length, color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)' },
                            ].map(kpi => (
                                <div key={kpi.label} style={{ background: kpi.bg, border: `1px solid ${kpi.border}`, borderRadius: '8px', padding: '0.3rem 0.75rem', textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.5rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.08em' }}>{kpi.label}</div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 900, color: kpi.color, lineHeight: 1.1 }}>{kpi.value}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Ultra-compact Project Table */}
                    <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column' }}>
                        {/* Table header row */}
                        <div style={{ padding: '0.5rem 1rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fafbfc', flexShrink: 0 }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0f172a' }}>Active Missions <span style={{ color: '#94a3b8', fontWeight: 500 }}>({projects.length})</span></div>
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                {['Green', 'Orange', 'Red'].map(s => (
                                    <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.6rem', color: '#64748b', fontWeight: 600 }}>
                                        <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: s === 'Red' ? '#ef4444' : s === 'Orange' ? '#f59e0b' : '#10b981' }}></div>
                                        {projects.filter(p => p.status === s).length} {s}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {projects.length === 0 ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem' }}>No projects assigned yet.</div>
                        ) : (
                            <div style={{ overflowX: 'auto', overflowY: 'auto', flex: 1 }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                                        <tr style={{ background: '#f8fafc' }}>
                                            {['#', 'PROJECT', 'CUSTOMER', 'HEALTH', 'PROGRESS', 'ACTION'].map(h => (
                                                <th key={h} style={{ padding: '0.4rem 0.75rem', fontSize: '0.6rem', fontWeight: 800, color: '#64748b', letterSpacing: '0.07em', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {projects.map((p, idx) => {
                                            const statusColor = p.status === 'Red' ? '#ef4444' : p.status === 'Orange' ? '#f59e0b' : '#10b981';
                                            const statusBg = p.status === 'Red' ? '#fef2f2' : p.status === 'Orange' ? '#fffbeb' : '#ecfdf5';
                                            const progress = Math.min(100, p.kpis?.progress_pct || 0);
                                            return (
                                                <tr key={idx}
                                                    style={{ borderBottom: idx === projects.length - 1 ? 'none' : '1px solid #f1f5f9', transition: 'background 0.12s', cursor: 'pointer' }}
                                                    onMouseOver={e => e.currentTarget.style.background = '#f8fafc'}
                                                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                                                    onClick={() => loadProject(p.id)}
                                                >
                                                    <td style={{ padding: '0.45rem 0.75rem', fontSize: '0.65rem', fontWeight: 700, color: '#cbd5e1', width: '30px' }}>{idx + 1}</td>
                                                    <td style={{ padding: '0.45rem 0.75rem' }}>
                                                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '220px' }}>{p.name}</div>
                                                        <div style={{ fontSize: '0.58rem', color: '#94a3b8', fontWeight: 600 }}>P{p.id}</div>
                                                    </td>
                                                    <td style={{ padding: '0.45rem 0.75rem', fontSize: '0.68rem', color: '#475569', maxWidth: '180px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.customer_name || '—'}</td>
                                                    <td style={{ padding: '0.45rem 0.75rem' }}>
                                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: statusBg, padding: '0.15rem 0.5rem', borderRadius: '20px' }}>
                                                            <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: statusColor, boxShadow: `0 0 4px ${statusColor}` }}></div>
                                                            <span style={{ fontSize: '0.6rem', fontWeight: 800, color: statusColor }}>{p.status}</span>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '0.45rem 0.75rem', minWidth: '120px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                            <div style={{ flex: 1, height: '3px', background: '#e2e8f0', borderRadius: '2px', overflow: 'hidden' }}>
                                                                <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, #3b82f6, #6366f1)', borderRadius: '2px' }}></div>
                                                            </div>
                                                            <span style={{ fontSize: '0.6rem', color: '#475569', fontWeight: 700, minWidth: '28px' }}>{progress}%</span>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '0.45rem 0.75rem', textAlign: 'right' }}>
                                                        <button
                                                            onClick={e => { e.stopPropagation(); loadProject(p.id); }}
                                                            style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', color: '#fff', border: 'none', padding: '0.25rem 0.6rem', borderRadius: '5px', fontSize: '0.62rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 1px 4px rgba(59,130,246,0.3)' }}
                                                            onMouseOver={e => e.currentTarget.style.opacity = '0.85'}
                                                            onMouseOut={e => e.currentTarget.style.opacity = '1'}
                                                        >
                                                            Open →
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}




            {activeTab === 'PROJECTS' && selectedProject && (
                <motion.div 
                    initial="hidden" 
                    animate="show" 
                    variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } }}
                >

                    

                    {selectedProject.status === 'Red' && (
                        <motion.div variants={{ hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } } }} style={{ background: '#fef2f2', border: '1px solid #fecaca', borderLeft: '4px solid #ef4444', padding: '1rem', borderRadius: '6px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>

                            <div style={{ color: '#ef4444', fontWeight: 800 }}>CRITICAL</div>

                            <div style={{ fontSize: '0.85rem', color: '#7f1d1d' }}>Project Operating Below Approved Margin Target. A Margin Escalation record has been sent to the Coordinator. You may continue operations, but please review costing immediately.</div>
                        </motion.div>
                    )}

                    {selectedProject.status === 'Orange' && (
                        <motion.div variants={{ hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } } }} style={{ background: '#fffbeb', border: '1px solid #fde68a', borderLeft: '4px solid #f59e0b', padding: '1rem', borderRadius: '6px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>

                            <div style={{ color: '#f59e0b', fontWeight: 800 }}>WARNING</div>

                            <div style={{ fontSize: '0.85rem', color: '#92400e' }}>Margin Risk Detected. Over 50% hours consumed and margin is slipping.</div>
                        </motion.div>
                    )}



                    {/* KPI RIBBON */}
                    <motion.div variants={{ hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } } }} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem', marginBottom: '0.75rem', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem', alignItems: 'center', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>

                        <div>

                            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b', marginBottom: '0.25rem', letterSpacing: '0.05em' }}>PROJECT HEALTH</div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>

                                <div style={{ 

                                    width: '12px', height: '12px', borderRadius: '50%', 

                                    background: selectedProject.status === 'Red' ? '#ef4444' : selectedProject.status === 'Orange' ? '#f59e0b' : '#10b981',

                                    boxShadow: `0 0 8px ${selectedProject.status === 'Red' ? '#ef4444' : selectedProject.status === 'Orange' ? '#f59e0b' : '#10b981'}`

                                }}></div>

                                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>{selectedProject.status}</span>

                            </div>

                        </div>

                        <div>

                            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b', marginBottom: '0.25rem', letterSpacing: '0.05em' }}>HOURS (P / A)</div>

                            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#0f172a' }}>{selectedProject.kpis?.planned_hours || 0} / <span style={{ color: selectedProject.kpis?.hours_variance > 0 ? '#ef4444' : '#059669' }}>{selectedProject.kpis?.actual_hours || 0}</span></div>

                        </div>

                        <div>

                            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b', marginBottom: '0.25rem', letterSpacing: '0.05em' }}>COST (P / A)</div>

                            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#0f172a' }}>₹{Math.round(selectedProject.kpis?.planned_cost || 0).toLocaleString('en-IN')} / <span style={{ color: selectedProject.kpis?.cost_variance > 0 ? '#ef4444' : '#059669' }}>₹{Math.round(selectedProject.kpis?.actual_cost || 0).toLocaleString('en-IN')}</span></div>

                        </div>

                        <div>

                            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b', marginBottom: '0.25rem', letterSpacing: '0.05em' }}>MARGIN (T / C)</div>

                            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#0f172a' }}>{selectedProject.kpis?.target_margin_pct?.toFixed(2)}% / <span style={{ color: selectedProject.kpis?.current_margin_pct < selectedProject.kpis?.target_margin_pct ? '#ef4444' : '#059669' }}>{selectedProject.kpis?.current_margin_pct?.toFixed(2)}%</span></div>

                        </div>

                        <div>

                            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b', marginBottom: '0.25rem', letterSpacing: '0.05em' }}>FORECAST MARGIN</div>

                            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#2563eb' }}>{selectedProject.kpis?.forecast_margin_pct?.toFixed(2)}%</div>

                        </div>

                    </motion.div>



                    {/* Tabs Navigation */}
                    <motion.div variants={{ hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } } }} style={{ display: 'flex', borderBottom: '1px solid #cbd5e1', marginBottom: '0.75rem' }}>

                        {['COSTING', 'WORKFORCE', 'OVERVIEW', 'EXTENSIONS'].map(tab => (
                            <div 
                                key={tab} 
                                onClick={() => setInnerTab(tab)}
                                style={{ 
                                    padding: '0.5rem 1rem', 
                                    fontSize: '0.8rem', 
                                    fontWeight: 600, 
                                    cursor: 'pointer',
                                    color: innerTab === tab ? '#2563eb' : '#64748b',
                                    borderBottom: innerTab === tab ? '2px solid #2563eb' : '2px solid transparent'
                                }}
                            >
                                {tab === 'COSTING' ? 'Project Costing' : tab === 'WORKFORCE' ? 'Workforce Budget' : tab === 'OVERVIEW' ? 'Project Overview' : 'Extensions'}
                            </div>
                        ))}

                    </motion.div>



                    {/* Tab Contents */}
                    <motion.div variants={{ hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } } }} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.5rem 0.75rem', minHeight: '400px', overflowX: 'auto', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>

                        {innerTab === 'COSTING' && (
                            <div style={{ display: 'flex', flexDirection: 'column' }}>

                                {/* Overall Project Lead & Tracking Box */}
                                {(() => {
                                    const startDateStr = selectedProject.assigned_at ? new Date(selectedProject.assigned_at).toISOString().split('T')[0] : '';
                                    const endDateStr = selectedProject.assigned_at ? (() => { const d = new Date(selectedProject.assigned_at); d.setMonth(d.getMonth() + (selectedProject.kpis?.duration_months || selectedProject.duration || 0)); return d.toISOString().split('T')[0]; })() : '';
                                    let elapsedPct = 0;
                                    if (startDateStr && endDateStr) {
                                        const s = new Date(startDateStr);
                                        const e = new Date(endDateStr);
                                        const now = new Date();
                                        if (now > e) elapsedPct = 100;
                                        else if (now > s) elapsedPct = Math.round(((now - s) / (e - s)) * 100);
                                    }
                                    let themeColor, themeBg, themeText;
                                    if (elapsedPct >= 85) {
                                        themeColor = 'rgba(239, 68, 68, 0.08)'; // Red wipe
                                        themeBg = '#fee2e2'; themeText = '#b91c1c';
                                    } else if (elapsedPct >= 60) {
                                        themeColor = 'rgba(245, 158, 11, 0.08)'; // Amber wipe
                                        themeBg = '#fef3c7'; themeText = '#b45309';
                                    } else if (elapsedPct > 0) {
                                        themeColor = 'rgba(16, 185, 129, 0.08)'; // Green wipe
                                        themeBg = '#d1fae5'; themeText = '#047857';
                                    } else {
                                        themeColor = 'rgba(37, 99, 235, 0.05)'; // Blue wipe
                                        themeBg = '#dbeafe'; themeText = '#1d4ed8';
                                    }

                                    return (
                                        <div style={{ position: 'relative', overflow: 'hidden', background: '#ffffff', border: `1px solid ${elapsedPct >= 85 ? '#fca5a5' : '#e2e8f0'}`, borderRadius: '6px', padding: '0.5rem 0.75rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                                            {/* Full Height Background Wipe */}
                                            <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${elapsedPct}%`, background: themeColor, zIndex: 0 }}></div>
                                            
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', zIndex: 1, position: 'relative' }}>
                                                <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: themeBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: themeText }}>
                                                    <Icons.Clock />
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#64748b', letterSpacing: '0.05em', marginBottom: '0.1rem', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        Overall Project Lead & Timeline
                                                        {elapsedPct > 0 && <span style={{ padding: '0.1rem 0.3rem', background: themeBg, color: themeText, borderRadius: '4px', fontSize: '0.5rem' }}>{elapsedPct}% ELAPSED</span>}
                                                    </div>
                                                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.15rem' }}>{selectedProject.name}</div>
                                                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                                        <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700 }}>START:</span>
                                                        <input type="date" defaultValue={startDateStr} style={{ padding: '0.1rem 0.3rem', border: `1px solid ${elapsedPct >= 85 ? '#fca5a5' : '#cbd5e1'}`, borderRadius: '4px', fontSize: '0.7rem', outline: 'none', color: '#0f172a', fontWeight: 600, background: 'rgba(255,255,255,0.8)' }} />
                                                        <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700, marginLeft: '0.5rem' }}>END:</span>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                            <input type="date" defaultValue={endDateStr} style={{ padding: '0.1rem 0.3rem', border: `1px solid ${elapsedPct >= 85 ? '#fca5a5' : '#cbd5e1'}`, borderRadius: '4px', fontSize: '0.7rem', outline: 'none', color: '#0f172a', fontWeight: 600, background: 'rgba(255,255,255,0.8)' }} />
                                                            <button 
                                                                onClick={() => { setIsDurationConfirmed(true); alert("Project duration confirmed successfully!"); }}
                                                                style={{ background: isDurationConfirmed ? '#d1fae5' : '#10b981', color: isDurationConfirmed ? '#047857' : '#fff', border: isDurationConfirmed ? '1px solid #10b981' : 'none', borderRadius: '4px', padding: '0.2rem 0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', justifyContent: 'center', boxShadow: isDurationConfirmed ? 'none' : '0 1px 2px rgba(0,0,0,0.1)', height: '22px', fontSize: '0.65rem', fontWeight: 700 }}
                                                                title="Confirm Duration"
                                                                onMouseOver={(e) => { if(!isDurationConfirmed) e.currentTarget.style.opacity = '0.8' }}
                                                                onMouseOut={(e) => { if(!isDurationConfirmed) e.currentTarget.style.opacity = '1' }}
                                                            >
                                                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                                                {isDurationConfirmed ? "Confirmed" : "Confirm"}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', zIndex: 1, position: 'relative' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <label style={{ fontSize: '0.6rem', fontWeight: 700, color: '#64748b' }}>MANAGER EMAIL (EDITABLE)</label>
                                                    <input 
                                                        type="email"
                                                        defaultValue={selectedProject.manager_name ? `${selectedProject.manager_name.toLowerCase().replace(' ', '.')}@arche.global` : ''}
                                                        style={{ padding: '0.3rem 0.5rem', border: `1px solid ${elapsedPct >= 85 ? '#fca5a5' : '#cbd5e1'}`, borderRadius: '4px', fontSize: '0.75rem', width: '200px', background: 'rgba(255,255,255,0.8)', outline: 'none', color: '#0f172a', fontWeight: 600 }}
                                                    />
                                                </div>
                                                <button 
                                                    onClick={() => alert("Manager assignment & timing updated successfully!")}
                                                    style={{ background: '#2563eb', border: 'none', color: '#fff', padding: '0.35rem 0.75rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}
                                                    onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
                                                    onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
                                                >
                                                    Update Action
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })()}

                                <div style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 100%)', borderRadius: '8px', overflow: 'visible', boxShadow: '0 4px 15px rgba(0, 0, 0, 0.02)' }}>
                                <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', color: '#0f172a' }}>

                                <thead>
                                    <tr style={{ borderBottom: '2px solid #cbd5e1', background: '#ffffff', boxShadow: '0 2px 5px rgba(0,0,0,0.02)' }}>
                                        {['SAP Material ID', 'Description', 'Assigned To', 'Start Date', 'End Date', 'Planned Hrs', 'Actual Hrs', 'Remaining', 'Util %', 'Action'].map(h => (
                                            <th key={h} style={{ padding: '0.7rem 0.5rem', fontSize: '0.7rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>

                                <tbody>

                                    {selectedProject.resources?.map((row, i) => {
                                        const endDateStr = row.end_date || '—';
                                        
                                        return (
                                        <tr key={i} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.6)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>

                                            <td style={{ padding: '0.5rem 0.5rem', fontSize: '0.8rem', color: '#0f172a', fontWeight: 600 }}>{row.sap_id || '—'}</td>

                                            <td style={{ padding: '0.5rem 0.5rem', fontSize: '0.8rem', color: '#475569', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={row.task_name}>{row.task_name || '—'}</td>

                                            <td 
                                                onMouseEnter={() => setHoverRowId(`proj-row-${i}`)} 
                                                onMouseLeave={() => setHoverRowId(null)}
                                                style={{ position: 'relative', padding: '0.5rem 0.5rem', fontSize: '0.8rem', color: '#0f172a', fontWeight: 600, cursor: 'pointer' }}
                                            >
                                                {row.name !== "Unassigned" ? (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                        <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#dbeafe', color: '#1e40af', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.55rem', fontWeight: 800 }}>
                                                            {row.name.substring(0,2).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: 700, lineHeight: 1.1, whiteSpace: 'nowrap' }}>
                                                                {row.name} <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 500 }}>({row.grade})</span>
                                                            </div>
                                                        </div>
                                                        <AnimatePresence>
                                                        {hoverRowId === `proj-row-${i}` && (
                                                            <motion.div 
                                                                initial={{ opacity: 0, x: -10, scale: 0.95 }}
                                                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                                                exit={{ opacity: 0, x: -10, scale: 0.95 }}
                                                                style={{ position: 'absolute', top: '-10px', left: '100%', marginLeft: '1rem', background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(10px)', color: '#fff', padding: '1rem', borderRadius: '12px', width: '260px', zIndex: 100, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)', border: '1px solid rgba(255,255,255,0.1)', transformOrigin: 'left top' }}
                                                            >
                                                                <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginBottom: '0.5rem', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Assignment Brief</div>
                                                                <div style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: '0.2rem', color: '#f8fafc' }}>{row.name} <span style={{ color: '#60a5fa' }}>({row.grade})</span></div>
                                                                <div style={{ fontSize: '0.75rem', color: '#cbd5e1', marginBottom: '0.75rem', lineHeight: 1.3 }}>{row.task_name}</div>
                                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.75rem' }}>
                                                                    <div>
                                                                        <div style={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: 600 }}>START DATE</div>
                                                                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f8fafc' }}>{row.start_date}</div>
                                                                    </div>
                                                                    <div>
                                                                        <div style={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: 600 }}>END DATE</div>
                                                                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f8fafc' }}>{endDateStr}</div>
                                                                    </div>
                                                                    <div>
                                                                        <div style={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: 600 }}>PLANNED HRS</div>
                                                                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#60a5fa' }}>{row.planned_hours}h</div>
                                                                    </div>
                                                                    <div>
                                                                        <div style={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: 600 }}>LOGGED HRS</div>
                                                                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#34d399' }}>{row.actual_hours || 0}h</div>
                                                                    </div>
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                        </AnimatePresence>
                                                    </div>
                                                ) : <span style={{ color: '#94a3b8' }}>Unassigned</span>}
                                            </td>

                                            <td style={{ padding: '0.5rem 0.5rem', fontSize: '0.8rem', color: '#475569', whiteSpace: 'nowrap' }}>{row.start_date || '—'}</td>

                                            <td style={{ padding: '0.5rem 0.5rem', fontSize: '0.8rem', color: '#475569', whiteSpace: 'nowrap' }}>
                                                {row.end_date || '—'}
                                            </td>

                                            <td style={{ padding: '0.5rem 0.5rem', fontSize: '0.8rem', color: '#0f172a', whiteSpace: 'nowrap' }}>{row.planned_hours}</td>

                                            <td style={{ padding: '0.5rem 0.5rem', fontSize: '0.8rem', color: '#2563eb', fontWeight: 800, whiteSpace: 'nowrap' }}>{row.actual_hours}</td>

                                            <td style={{ padding: '0.5rem 0.5rem', fontSize: '0.8rem', color: row.remaining_hours === 0 && row.planned_hours > 0 ? '#ef4444' : '#059669', fontWeight: 600, whiteSpace: 'nowrap' }}>{row.remaining_hours}</td>

                                            <td style={{ padding: '0.5rem 0.5rem', fontSize: '0.8rem', color: '#0f172a' }}>

                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>

                                                    <div style={{ width: '40px', background: '#e2e8f0', height: '4px', borderRadius: '2px' }}>

                                                        <div style={{ width: `${Math.min(100, row.utilization)}%`, background: row.utilization > 100 ? '#ef4444' : '#2563eb', height: '100%' }}></div>

                                                    </div>

                                                    <span>{row.utilization}%</span>

                                                </div>

                                            </td>



                                            <td style={{ padding: '0.75rem 0.5rem' }}>

                                                {row.name === "Unassigned" ? (

                                                    <button onClick={() => openAssignModal(row)} style={{ background: '#2563eb', border: 'none', color: '#fff', padding: '0.4rem 0.75rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer' }}>

                                                        Assign Resource

                                                    </button>

                                                ) : (

                                                    <div style={{ display: 'flex', gap: '0.5rem' }}>

                                                        <button onClick={() => openLogModal(row)} style={{ background: '#10b981', border: 'none', color: '#fff', padding: '0.4rem 0.75rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer' }}>

                                                            Log Hours

                                                        </button>

                                                    </div>

                                                )}

                                            </td>

                                        </tr>

                                    )})}
                                    {(!selectedProject.resources || selectedProject.resources.length === 0) && (
                                        <tr><td colSpan="10" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No project items available</td></tr>
                                    )}
                                </tbody>
                            </table>
                            </div>
                            </div>
                        )}
                        {innerTab === 'WORKFORCE' && (
                            <div style={{ background: 'linear-gradient(135deg, #fdf4ff 0%, #ede9fe 100%)', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0, 0, 0, 0.02)' }}>
                            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1200px', color: '#0f172a' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid #cbd5e1', background: '#ffffff', boxShadow: '0 2px 5px rgba(0,0,0,0.02)' }}>
                                        {['Task', 'Employee', 'ID / Grade', 'Practice', 'Cost/Hr', 'Bill/Hr', 'Total Cost', 'Billable Value', 'Margin'].map(h => (
                                            <th key={h} style={{ padding: '0.7rem 0.5rem', fontSize: '0.7rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedProject.resources?.map((row, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.6)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                                            <td style={{ padding: '0.5rem 0.5rem', fontSize: '0.8rem', color: '#475569', maxWidth: '180px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={row.task_name}>{row.task_name || '—'}</td>
                                            <td style={{ padding: '0.5rem 0.5rem', fontSize: '0.8rem', color: '#0f172a', fontWeight: 600 }}>{row.name !== "Unassigned" ? row.name : 'Unassigned'}</td>
                                            <td style={{ padding: '0.5rem 0.5rem', fontSize: '0.8rem', color: '#475569' }}>
                                                <div style={{ fontWeight: 600 }}>{row.employee_id !== "N/A" ? row.employee_id : 'TBD'}</div>
                                                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{row.grade || '—'}</div>
                                            </td>
                                            <td style={{ padding: '0.5rem 0.5rem', fontSize: '0.8rem', color: '#475569' }}>{row.role_practice || 'N/A'}</td>
                                            <td style={{ padding: '0.5rem 0.5rem', fontSize: '0.8rem', color: '#ef4444' }}>₹{row.cost_per_hour?.toLocaleString() || 0}</td>
                                            <td style={{ padding: '0.5rem 0.5rem', fontSize: '0.8rem', color: '#059669' }}>₹{(row.cost_per_hour * 1.5)?.toLocaleString() || 0}</td>
                                            <td style={{ padding: '0.5rem 0.5rem', fontSize: '0.8rem', color: '#0f172a', fontWeight: 600 }}>₹{row.resource_cost?.toLocaleString() || 0}</td>
                                            <td style={{ padding: '0.5rem 0.5rem', fontSize: '0.8rem', color: '#2563eb', fontWeight: 600 }}>₹{(row.actual_hours * (row.cost_per_hour * 1.5))?.toLocaleString() || 0}</td>
                                            <td style={{ padding: '0.5rem 0.5rem', fontSize: '0.8rem', color: (row.actual_hours * (row.cost_per_hour * 1.5)) - row.resource_cost >= 0 ? '#10b981' : '#ef4444', fontWeight: 600 }}>₹{((row.actual_hours * (row.cost_per_hour * 1.5)) - row.resource_cost)?.toLocaleString() || 0}</td>
                                        </tr>
                                    ))}
                                    {(!selectedProject.resources || selectedProject.resources.length === 0) && (
                                        <tr><td colSpan="10" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No workforce items available</td></tr>
                                    )}
                                </tbody>
                            </table>
                            </div>
                        )}
                        
                        {innerTab === 'EXTENSIONS' && (
                            <div style={{ padding: '1rem' }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.5rem' }}>Governance & Extensions</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                    
                                    <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                        <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>Request Additional Hours</h4>
                                        <div style={{ marginBottom: '1rem' }}>
                                            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#475569', marginBottom: '0.3rem' }}>SELECT SAP NODE</label>
                                            <select id="req_node" style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none', background: '#fff', color: '#0f172a' }}>
                                                <option value="">-- Select Node --</option>
                                                {selectedProject.resources?.map((r, idx) => <option key={`node-${idx}`} value={r.id}>{r.sap_id} - {r.task_name}</option>)}
                                            </select>
                                        </div>
                                        <div style={{ marginBottom: '1rem' }}>
                                            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#475569', marginBottom: '0.3rem' }}>ADDITIONAL HOURS REQUESTED</label>
                                            <input type="number" id="req_hrs" style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none', background: '#fff', color: '#0f172a' }} />
                                        </div>
                                        <div style={{ marginBottom: '1.5rem' }}>
                                            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#475569', marginBottom: '0.3rem' }}>BUSINESS JUSTIFICATION</label>
                                            <textarea id="req_reason_hrs" style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none', height: '60px', resize: 'none', background: '#fff', color: '#0f172a' }}></textarea>
                                        </div>
                                        <button onClick={async () => {
                                            const node = document.getElementById('req_node').value;
                                            const hrs = parseFloat(document.getElementById('req_hrs').value);
                                            const reason = document.getElementById('req_reason_hrs').value;
                                            if(!node || !hrs || !reason) return alert('Fill all fields');
                                            const r = selectedProject.resources.find(x => x.id === node);
                                            await fetch(`${API}/workflow/requests/hours`, {
                                                method: 'POST', headers: { 'Content-Type':'application/json', Authorization: `Bearer ${tok()}` },
                                                body: JSON.stringify({ project_id: selectedProject.id, node_id: node, current_planned_hours: r.planned_hours, requested_additional_hours: hrs, reason })
                                            });
                                            alert('Hours Request Submitted to Coordinator');
                                            document.getElementById('req_hrs').value = ''; document.getElementById('req_reason_hrs').value = '';
                                        }} style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '0.75rem 1rem', borderRadius: '6px', fontWeight: 600, width: '100%', cursor: 'pointer' }}>Submit Hours Request</button>
                                    </div>

                                    <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                        <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>Request Duration Extension</h4>
                                        <div style={{ marginBottom: '1rem' }}>
                                            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#475569', marginBottom: '0.3rem' }}>REQUESTED NEW END DATE</label>
                                            <input type="date" id="req_date" style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none', background: '#fff', color: '#0f172a' }} />
                                        </div>
                                        <div style={{ marginBottom: '1.5rem' }}>
                                            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#475569', marginBottom: '0.3rem' }}>REASON FOR DELAY</label>
                                            <textarea id="req_reason_date" style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none', height: '135px', resize: 'none', background: '#fff', color: '#0f172a' }}></textarea>
                                        </div>
                                        <button onClick={async () => {
                                            const date = document.getElementById('req_date').value;
                                            const reason = document.getElementById('req_reason_date').value;
                                            if(!date || !reason) return alert('Fill all fields');
                                            await fetch(`${API}/workflow/requests/duration`, {
                                                method: 'POST', headers: { 'Content-Type':'application/json', Authorization: `Bearer ${tok()}` },
                                                body: JSON.stringify({ project_id: selectedProject.id, current_end_date: '', requested_end_date: date, additional_days: 0, reason })
                                            });
                                            alert('Duration Request Submitted to Coordinator');
                                        }} style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '0.75rem 1rem', borderRadius: '6px', fontWeight: 600, width: '100%', cursor: 'pointer' }}>Submit Duration Request</button>
                                    </div>
                                    
                                </div>
                            </div>
                        )}

                        
                        {innerTab === 'INTELLIGENCE' && (
                            <div style={{ padding: '1rem', maxWidth: '800px', margin: '0 auto' }}>
                                <div style={{ marginBottom: '2rem' }}>
                                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>Project Intelligence Feed</h3>
                                    <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Automated updates for {selectedProject.name}</p>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {feed.length === 0 ? (
                                        <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px' }}>No intelligence events yet.</div>
                                    ) : feed.map((e, i) => (
                                        <div key={i} style={{ 
                                            background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem',
                                            borderLeft: e.priority === 'CRITICAL' ? '4px solid #ef4444' : e.priority === 'WARNING' ? '4px solid #f59e0b' : e.priority === 'SUCCESS' ? '4px solid #10b981' : '4px solid #3b82f6',
                                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <div style={{ 
                                                        width: '10px', height: '10px', borderRadius: '50%',
                                                        background: e.priority === 'CRITICAL' ? '#ef4444' : e.priority === 'WARNING' ? '#f59e0b' : e.priority === 'SUCCESS' ? '#10b981' : '#3b82f6' 
                                                    }}></div>
                                                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', letterSpacing: '0.05em' }}>{e.category} EVENT</span>
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{new Date(e.created_at).toLocaleString()}</div>
                                            </div>
                                            
                                            {e.sap_node_id && <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1rem' }}>Node: {e.sap_node_id} ({e.sap_node_name})</div>}
                                            
                                            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0f172a', marginBottom: '1.5rem' }}>{e.message}</div>
                                            
                                            {e.metrics && Object.keys(e.metrics).length > 0 && (
                                                <div style={{ display: 'flex', gap: '2rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                                    {Object.entries(e.metrics).map(([k, v], idx) => (
                                                        <div key={idx}>
                                                            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>{k.toUpperCase()}</div>
                                                            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>{v}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {innerTab === 'OVERVIEW' && (
                            <div style={{ padding: '1.5rem' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                    {/* Financial Overview */}
                                    <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                        <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{ fontSize: '1.2rem' }}>💰</span> Financial Summary
                                        </h4>
                                        
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                                                <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Total Revenue (Sell Price)</span>
                                                <span style={{ fontSize: '0.9rem', color: '#0f172a', fontWeight: 800 }}>₹{selectedProject.kpis?.total_revenue?.toLocaleString() || 0}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                                                <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Planned Total Cost</span>
                                                <span style={{ fontSize: '0.9rem', color: '#0f172a', fontWeight: 800 }}>₹{selectedProject.kpis?.planned_cost?.toLocaleString() || 0}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                                                <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Actual Live Cost</span>
                                                <span style={{ fontSize: '0.9rem', color: '#ef4444', fontWeight: 800 }}>₹{selectedProject.kpis?.actual_cost?.toLocaleString() || 0}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', background: '#eff6ff', padding: '1rem', borderRadius: '8px', marginTop: '0.5rem' }}>
                                                <span style={{ fontSize: '0.85rem', color: '#2563eb', fontWeight: 700 }}>Margin Target vs Current</span>
                                                <span style={{ fontSize: '1rem', color: '#2563eb', fontWeight: 900 }}>{selectedProject.kpis?.target_margin_pct?.toFixed(1) || 0}% / {selectedProject.kpis?.current_margin_pct?.toFixed(1) || 0}%</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Logistics & Scope */}
                                    <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                        <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{ fontSize: '1.2rem' }}>📅</span> Timeline & Scope
                                        </h4>
                                        
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                                                <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Assignment Date</span>
                                                <span style={{ fontSize: '0.85rem', color: '#0f172a', fontWeight: 700 }}>
                                                    {selectedProject.assigned_at ? new Date(selectedProject.assigned_at).toLocaleDateString() : 'N/A'}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                                                <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Duration</span>
                                                <span style={{ fontSize: '0.85rem', color: '#0f172a', fontWeight: 700 }}>{selectedProject.kpis?.duration_months || 0} Months</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                                                <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Region</span>
                                                <span style={{ fontSize: '0.85rem', color: '#0f172a', fontWeight: 700 }}>{selectedProject.region || 'GLOBAL'}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', background: selectedProject.kpis?.margin_variance < 0 ? '#fef2f2' : '#ecfdf5', padding: '1rem', borderRadius: '8px', marginTop: '0.5rem' }}>
                                                <span style={{ fontSize: '0.85rem', color: selectedProject.kpis?.margin_variance < 0 ? '#ef4444' : '#059669', fontWeight: 700 }}>Margin Deviation</span>
                                                <span style={{ fontSize: '1rem', color: selectedProject.kpis?.margin_variance < 0 ? '#ef4444' : '#059669', fontWeight: 900 }}>{selectedProject.kpis?.margin_variance > 0 ? '+' : ''}{selectedProject.kpis?.margin_variance?.toFixed(2) || 0}%</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                </div>
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </div>

      </main>



      {/* ASSIGN RESOURCE MODAL */}

      {showAssignModal && assignItem && (

          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>

              <div style={{ background: '#fff', padding: '1rem', borderRadius: '12px', width: '520px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>

                  <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>Assign Resource to Node</h2>

                  {/* EMPLOYEE — Dropdown */}
                  <div style={{ marginBottom: '0.5rem' }}>
                      <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 700, color: '#475569', marginBottom: '0.2rem' }}>EMPLOYEE GRADE</label>
                      <select
                        value={assignForm.assigned_person}
                        onChange={e => {
                          const grade = e.target.value;
                          setAssignForm({...assignForm, assigned_person: grade, manhour_cost_per_day: EMPLOYEE_RATES[grade]?.day || 0, manpower_cost_per_hour: EMPLOYEE_RATES[grade]?.hour || 0});
                        }}
                        style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.75rem', outline: 'none', boxSizing: 'border-box', background: '#fff', cursor: 'pointer' }}
                      >
                        <option value="">-- Select Grade --</option>
                        {Object.keys(EMPLOYEE_RATES).map(grade => (
                          <option key={grade} value={grade}>{grade}</option>
                        ))}
                      </select>
                      
                      {assignForm.assigned_person && (
                        <div style={{ marginTop: '0.25rem', background: '#f8fafc', padding: '0.4rem', borderRadius: '4px', border: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                          <div>
                            <div style={{ fontSize: '0.55rem', fontWeight: 800, color: '#64748b', letterSpacing: '0.05em', marginBottom: '0.1rem' }}>MANHOUR COST / DAY</div>
                            <div style={{ display: 'flex', alignItems: 'center', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '0 0.2rem' }}>
                              <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>₹</span>
                              <input type="number" value={assignForm.manhour_cost_per_day} onChange={e => setAssignForm({...assignForm, manhour_cost_per_day: parseFloat(e.target.value) || 0})} style={{ width: '100%', padding: '0.25rem', border: 'none', fontSize: '0.75rem', outline: 'none', fontWeight: 700, color: '#0f172a', background: 'transparent' }} />
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: '0.55rem', fontWeight: 800, color: '#64748b', letterSpacing: '0.05em', marginBottom: '0.1rem' }}>MANPOWER COST / HOUR</div>
                            <div style={{ display: 'flex', alignItems: 'center', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '0 0.2rem' }}>
                              <span style={{ fontSize: '0.7rem', color: '#2563eb', fontWeight: 600 }}>₹</span>
                              <input type="number" value={assignForm.manpower_cost_per_hour} onChange={e => setAssignForm({...assignForm, manpower_cost_per_hour: parseFloat(e.target.value) || 0})} style={{ width: '100%', padding: '0.25rem', border: 'none', fontSize: '0.75rem', outline: 'none', fontWeight: 700, color: '#2563eb', background: 'transparent' }} />
                            </div>
                          </div>
                        </div>
                      )}
                  </div>



                  {/* PLANNED HOURS — Premium Duration Widget */}

                  <div style={{ marginBottom: '0.5rem' }}>

                      {/* Glowing hours result — only shown after chips selected */}
                      {(durationMonths > 0 || durationYears > 0 || durationWeeks > 0 || durationDays > 0) ? (
                        <div style={{
                          background: '#eff6ff',
                          borderRadius: '6px',
                          padding: '0.5rem',
                          marginBottom: '0.5rem',
                          border: '1px solid #bfdbfe',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
                            <span style={{ fontSize: '1.25rem', fontWeight: 900, letterSpacing: '-0.04em', color: '#2563eb', fontFamily: "'Inter', monospace", lineHeight: 1 }}>
                              {assignForm.planned_hours}
                            </span>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#60a5fa', letterSpacing: '0.05em' }}>HRS</span>
                          </div>

                          <div style={{ fontSize: '0.65rem', color: '#64748b', letterSpacing: '0.03em', fontWeight: 600 }}>
                            {[durationYears ? `${durationYears}yr` : null, durationMonths ? `${durationMonths}mo` : null, durationWeeks ? `${durationWeeks}w` : null, durationDays ? `${durationDays}d` : null].filter(Boolean).join(' + ')}
                          </div>
                        </div>

                      ) : (
                        <div style={{
                          background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '6px',
                          padding: '0.5rem', marginBottom: '0.5rem', textAlign: 'center',
                          fontSize: '0.7rem', color: '#94a3b8', fontWeight: 500,
                        }}>
                          Select months / years below to calculate hours
                        </div>
                      )}

                      {/* Duration chip picker */}
                      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.5rem' }}>
                        <div style={{ fontSize: '0.55rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>⚡ QUICK DURATION · 8 HRS/DAY · 5 DAYS/WEEK</div>

                        {/* Month chips */}
                        <div style={{ fontSize: '0.55rem', fontWeight: 700, color: '#64748b', marginBottom: '0.2rem', letterSpacing: '0.05em' }}>MONTHS</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.2rem', marginBottom: '0.4rem', alignItems: 'center' }}>
                          {[1,2,3,4,5,6,7,8,9,10,11].map(m => {
                            const active = durationMonths === m;
                            return (
                              <button
                                key={m}
                                onClick={() => {
                                  const newM = active ? 0 : m;
                                  setDurationMonths(newM);
                                  const hrs = calcHoursFromDuration(newM, durationYears, durationWeeks, durationDays);
                                  setAssignForm(f => ({...f, planned_hours: hrs > 0 ? hrs : (active ? 0 : f.planned_hours)}));
                                }}
                                style={{
                                  padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer',
                                  border: active ? '1px solid #3b82f6' : '1px solid #e2e8f0',
                                  background: active ? '#2563eb' : '#fff',
                                  color: active ? '#fff' : '#475569',
                                  transition: 'all 0.15s ease',
                                }}
                              >
                                {m}M
                              </button>
                            );
                          })}
                          {durationMonths > 0 && (
                            <button
                              onClick={() => { setDurationMonths(0); setAssignForm(f => ({...f, planned_hours: calcHoursFromDuration(0, durationYears, durationWeeks, durationDays)})); }}
                              title="Clear months"
                              style={{ padding: '0.1rem 0.35rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 900, cursor: 'pointer', border: '1px solid #fca5a5', background: '#fef2f2', color: '#ef4444', lineHeight: 1 }}
                            >×</button>
                          )}
                        </div>

                        {/* Year chips */}
                        <div style={{ fontSize: '0.55rem', fontWeight: 700, color: '#64748b', marginBottom: '0.2rem', letterSpacing: '0.05em' }}>YEARS</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.2rem', alignItems: 'center' }}>
                          {[0,1,2,3,4,5].map(y => {
                            const active = durationYears === y;
                            return (
                              <button
                                key={y}
                                onClick={() => {
                                  const newY = active ? 0 : y;
                                  setDurationYears(newY);
                                  const hrs = calcHoursFromDuration(durationMonths, newY, durationWeeks, durationDays);
                                  setAssignForm(f => ({...f, planned_hours: hrs > 0 ? hrs : (active ? 0 : f.planned_hours)}));
                                }}
                                style={{
                                  padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer',
                                  border: active ? '1px solid #7c3aed' : '1px solid #e2e8f0',
                                  background: active ? '#7c3aed' : '#fff',
                                  color: active ? '#fff' : '#475569',
                                  transition: 'all 0.15s ease',
                                }}
                              >
                                {y}Y
                              </button>
                            );
                          })}
                          {durationYears > 0 && (
                            <button
                              onClick={() => { setDurationYears(0); setAssignForm(f => ({...f, planned_hours: calcHoursFromDuration(durationMonths, 0, durationWeeks, durationDays)})); }}
                              title="Clear years"
                              style={{ padding: '0.1rem 0.35rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 900, cursor: 'pointer', border: '1px solid #fca5a5', background: '#fef2f2', color: '#ef4444', lineHeight: 1 }}
                            >×</button>
                          )}
                        </div>

                        {/* Weeks chips */}
                        <div style={{ fontSize: '0.55rem', fontWeight: 700, color: '#64748b', marginBottom: '0.2rem', letterSpacing: '0.05em', marginTop: '0.4rem' }}>WEEKS</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.2rem', alignItems: 'center' }}>
                          <button
                            onClick={() => {
                              const newShowDays = !showDays;
                              setShowDays(newShowDays);
                              if (!newShowDays) {
                                setDurationDays(0);
                                setAssignForm(f => ({...f, planned_hours: calcHoursFromDuration(durationMonths, durationYears, durationWeeks, 0)}));
                              }
                            }}
                            style={{
                              padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer',
                              border: showDays ? '1px solid #f59e0b' : '1px solid #e2e8f0',
                              background: showDays ? '#f59e0b' : '#fff',
                              color: showDays ? '#fff' : '#475569',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            &lt;1W
                          </button>
                          {[1,2,3].map(w => {
                            const active = durationWeeks === w;
                            return (
                              <button
                                key={w}
                                onClick={() => {
                                  const newW = active ? 0 : w;
                                  setDurationWeeks(newW);
                                  const hrs = calcHoursFromDuration(durationMonths, durationYears, newW, durationDays);
                                  setAssignForm(f => ({...f, planned_hours: hrs > 0 ? hrs : (active ? 0 : f.planned_hours)}));
                                }}
                                style={{
                                  padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer',
                                  border: active ? '1px solid #10b981' : '1px solid #e2e8f0',
                                  background: active ? '#10b981' : '#fff',
                                  color: active ? '#fff' : '#475569',
                                  transition: 'all 0.15s ease',
                                }}
                              >
                                {w}W
                              </button>
                            );
                          })}
                          {durationWeeks > 0 && (
                            <button
                              onClick={() => { setDurationWeeks(0); setAssignForm(f => ({...f, planned_hours: calcHoursFromDuration(durationMonths, durationYears, 0, durationDays)})); }}
                              title="Clear weeks"
                              style={{ padding: '0.1rem 0.35rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 900, cursor: 'pointer', border: '1px solid #fca5a5', background: '#fef2f2', color: '#ef4444', lineHeight: 1 }}
                            >×</button>
                          )}
                        </div>

                        {/* Days chips */}
                        {showDays && (
                          <>
                            <div style={{ fontSize: '0.55rem', fontWeight: 700, color: '#64748b', marginBottom: '0.2rem', letterSpacing: '0.05em', marginTop: '0.4rem' }}>DAYS</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.2rem', alignItems: 'center' }}>
                              {[1,2,3,4,5].map(d => {
                                const active = durationDays === d;
                                return (
                                  <button
                                    key={d}
                                    onClick={() => {
                                      const newD = active ? 0 : d;
                                      setDurationDays(newD);
                                      const hrs = calcHoursFromDuration(durationMonths, durationYears, durationWeeks, newD);
                                      setAssignForm(f => ({...f, planned_hours: hrs > 0 ? hrs : (active ? 0 : f.planned_hours)}));
                                    }}
                                    style={{
                                      padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer',
                                      border: active ? '1px solid #f97316' : '1px solid #e2e8f0',
                                      background: active ? '#f97316' : '#fff',
                                      color: active ? '#fff' : '#475569',
                                      transition: 'all 0.15s ease',
                                    }}
                                  >
                                    {d}D
                                  </button>
                                );
                              })}
                              {durationDays > 0 && (
                                <button
                                  onClick={() => { setDurationDays(0); setAssignForm(f => ({...f, planned_hours: calcHoursFromDuration(durationMonths, durationYears, durationWeeks, 0)})); }}
                                  title="Clear days"
                                  style={{ padding: '0.1rem 0.35rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 900, cursor: 'pointer', border: '1px solid #fca5a5', background: '#fef2f2', color: '#ef4444', lineHeight: 1 }}
                                >×</button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                  </div>



                  {/* START DATE */}
                  <div style={{ marginBottom: '0.5rem' }}>
                      <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 700, color: '#475569', marginBottom: '0.2rem' }}>START DATE</label>
                      <input type="date" value={assignForm.start_date} onChange={e => setAssignForm({...assignForm, start_date: e.target.value})} style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.75rem', outline: 'none', boxSizing: 'border-box', background: '#fff', color: '#0f172a' }} />
                  </div>

                  {/* OPTIONAL COSTS */}
                  <div style={{ marginBottom: '0.5rem' }}>
                      <button
                        onClick={() => setShowCosts(!showCosts)}
                        style={{ background: 'none', border: '1px dashed #cbd5e1', borderRadius: '4px', padding: '0.4rem 0.5rem', fontSize: '0.7rem', fontWeight: 600, color: '#64748b', cursor: 'pointer', width: '100%', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                      >
                          <span>💰 Additional Costs</span>
                          <span style={{ fontSize: '0.65rem' }}>{showCosts ? '▲ Hide' : '▼ Expand'}</span>
                      </button>

                      {showCosts && (
                          <div style={{ marginTop: '0.25rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', background: '#f8fafc', padding: '0.5rem', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                              {[
                                { key: 'travel_cost', label: 'TRAVEL COST' },
                                { key: 'food_cost',   label: 'FOOD COST' },
                                { key: 'stay_cost',   label: 'STAY COST' },
                                { key: 'other_cost',  label: 'OTHER COST' },
                              ].map(({ key, label }) => (
                                  <div key={key}>
                                      <label style={{ display: 'block', fontSize: '0.6rem', fontWeight: 700, color: '#475569', marginBottom: '0.2rem' }}>{label}</label>
                                      <input
                                        type="number"
                                        placeholder="0"
                                        value={assignForm[key] || ''}
                                        onChange={e => setAssignForm({...assignForm, [key]: parseFloat(e.target.value) || 0})}
                                        style={{ width: '100%', padding: '0.3rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.7rem', outline: 'none', boxSizing: 'border-box', background: '#fff', color: '#0f172a' }}
                                      />
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>

                  {/* ESTIMATED TOTAL COST CALCULATION */}
                  {assignForm.assigned_person && assignForm.planned_hours > 0 && (() => {
                      const manpowerCost = assignForm.planned_hours * (assignForm.manpower_cost_per_hour || 0);
                      const additionalCosts = (assignForm.travel_cost || 0) + (assignForm.food_cost || 0) + (assignForm.stay_cost || 0) + (assignForm.other_cost || 0);
                      const totalEstimatedCost = manpowerCost + additionalCosts;
                      
                      return (
                          <div style={{ background: '#f0fdfa', border: '1px solid #ccfbf1', borderRadius: '4px', padding: '0.5rem', marginBottom: '0.75rem', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
                              <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#0f766e', marginBottom: '0.4rem', letterSpacing: '0.05em' }}>ESTIMATED ASSIGNMENT COST</div>
                              
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem', fontSize: '0.7rem', color: '#0f766e' }}>
                                  <span>Manpower ({assignForm.planned_hours} hrs × ₹{assignForm.manpower_cost_per_hour})</span>
                                  <span style={{ fontWeight: 600 }}>₹{manpowerCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                              </div>
                              
                              {additionalCosts > 0 && (
                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem', fontSize: '0.7rem', color: '#0f766e' }}>
                                      <span>Additional Costs</span>
                                      <span style={{ fontWeight: 600 }}>₹{additionalCosts.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                  </div>
                              )}
                              
                              <div style={{ borderTop: '1px solid #99f6e4', margin: '0.4rem 0' }}></div>
                              
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#115e59' }}>Total Estimated Cost</span>
                                  <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0d9488' }}>₹{totalEstimatedCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                              </div>
                          </div>
                      );
                  })()}

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                      <button onClick={() => setShowAssignModal(false)} style={{ background: '#f1f5f9', color: '#475569', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                      <button onClick={submitAssign} style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>Confirm Allocation</button>
                  </div>

              </div>

          </div>

      )}



      {/* LOG HOURS MODAL */}

      {showLogModal && logItem && (

          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>

              <div style={{ background: '#fff', padding: '2rem', borderRadius: '12px', width: '400px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>

                  <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', fontWeight: 700, color: '#0f172a' }}>Log Actual Hours</h2>

                  <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.5rem' }}>{logItem.task_name} ({logItem.name})</p>

                  

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>

                      <div>

                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.5rem' }}>DATE</label>

                          <input type="date" value={logForm.date} onChange={e => setLogForm({...logForm, date: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none', background: '#fff', color: '#0f172a' }} />

                      </div>

                      <div>

                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.5rem' }}>HOURS WORKED</label>

                          <input type="number" step="0.5" value={logForm.hours} onChange={e => setLogForm({...logForm, hours: parseFloat(e.target.value) || 0})} style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none', background: '#fff', color: '#0f172a' }} />

                      </div>

                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>

                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.5rem' }}>REMARKS</label>

                      <textarea value={logForm.remarks} onChange={e => setLogForm({...logForm, remarks: e.target.value})} placeholder="What was achieved?" style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none', resize: 'none', height: '80px', background: '#fff', color: '#0f172a' }}></textarea>

                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>

                      <button onClick={() => setShowLogModal(false)} style={{ background: '#f1f5f9', color: '#475569', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>

                      <button onClick={submitLog} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>Submit Hours</button>

                  </div>

              </div>

          </div>

      )}



      {/* Floating AI ChatBox (Elite Redesign) */}
      <AnimatePresence>
        {isChatOpen ? (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            style={{ position: 'fixed', bottom: '2rem', right: '2rem', width: '320px', height: '480px', background: 'rgba(255, 255, 255, 0.98)', backdropFilter: 'blur(20px)', borderRadius: '16px', boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', overflow: 'hidden', zIndex: 1000 }}
          >
            {/* Header */}
            <div style={{ padding: '0.8rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ position: 'relative', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: 'linear' }} style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: '50%', border: '1px dashed #3b82f6', opacity: 0.5 }}></motion.div>
                  <div style={{ width: '8px', height: '8px', background: '#3b82f6', borderRadius: '50%', boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)' }}></div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 900, color: '#0f172a', letterSpacing: '0.05em' }}>DIGITRAC AI</div>
                  <div style={{ fontSize: '0.55rem', color: '#3b82f6', fontWeight: 800, letterSpacing: '0.1em' }}>TACTICAL OVERVIEW</div>
                </div>
              </div>
              <button onClick={() => setIsChatOpen(false)} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            {/* Chat Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {chatMessages.map((msg, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{ 
                    maxWidth: '85%', 
                    padding: '0.6rem 0.8rem', 
                    borderRadius: '12px', 
                    fontSize: '0.75rem', 
                    lineHeight: '1.5',
                    background: msg.role === 'user' ? '#3b82f6' : '#f8fafc',
                    color: msg.role === 'user' ? '#fff' : '#0f172a',
                    border: msg.role === 'user' ? 'none' : '1px solid #e2e8f0',
                    borderBottomRightRadius: msg.role === 'user' ? '4px' : '12px',
                    borderBottomLeftRadius: msg.role === 'ai' ? '4px' : '12px',
                    boxShadow: msg.role === 'user' ? '0 4px 12px rgba(59,130,246,0.2)' : '0 2px 4px rgba(0,0,0,0.02)'
                  }}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isChatLoading && (
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div style={{ padding: '0.6rem 0.8rem', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', gap: '0.2rem', alignItems: 'center' }}>
                    <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0 }} style={{ width: '4px', height: '4px', background: '#94a3b8', borderRadius: '50%' }}></motion.div>
                    <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0.2 }} style={{ width: '4px', height: '4px', background: '#94a3b8', borderRadius: '50%' }}></motion.div>
                    <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0.4 }} style={{ width: '4px', height: '4px', background: '#94a3b8', borderRadius: '50%' }}></motion.div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area / Suggested Questions */}
            <div style={{ padding: '0.8rem', borderTop: '1px solid rgba(0,0,0,0.06)', background: '#f8fafc' }}>
              <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.6rem', letterSpacing: '0.1em' }}>Suggested Queries</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '120px', overflowY: 'auto', paddingRight: '0.2rem' }}>
                {suggestedQuestions.map((q, i) => (
                  <button 
                    key={i} 
                    onClick={() => handleChatQuestion(q)}
                    disabled={isChatLoading}
                    style={{ textAlign: 'left', background: '#fff', border: '1px solid #e2e8f0', padding: '0.5rem 0.6rem', borderRadius: '6px', fontSize: '0.65rem', color: '#334155', cursor: isChatLoading ? 'not-allowed' : 'pointer', transition: 'all 0.2s', opacity: isChatLoading ? 0.5 : 1 }}
                    onMouseOver={e => { if(!isChatLoading) { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#0f172a'; e.currentTarget.style.borderColor = '#cbd5e1'; } }}
                    onMouseOut={e => { if(!isChatLoading) { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#334155'; e.currentTarget.style.borderColor = '#e2e8f0'; } }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            onClick={() => setIsChatOpen(true)}
            style={{ position: 'fixed', bottom: '2rem', right: '2rem', width: '48px', height: '48px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '50%', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6', cursor: 'pointer', zIndex: 1000 }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

