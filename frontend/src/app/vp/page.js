"use client";
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import './vp.css';

const API = 'http://127.0.0.1:8000';
const tok = () => {
    if (typeof window !== 'undefined') return localStorage.getItem('token');
    return null;
};

const Icons = {
  Folder: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>,

  Overview: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>,
  Cube: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>,
  Check: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>,
  CheckSquare: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><polyline points="9 11 12 14 22 4"></polyline></svg>,
  Logout: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  Bell: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>,
  Bot: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>,
  Menu: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
};

const TypewriterText = ({ text, delay = 15 }) => {
  const safeText = typeof text === 'string' ? text : JSON.stringify(text) || '';
  const [displayedText, setDisplayedText] = useState("");
  
  useEffect(() => {
    setDisplayedText("");
    let i = 0;
    const interval = setInterval(() => {
      setDisplayedText(safeText.slice(0, i + 1));
      i++;
      if (i >= safeText.length) clearInterval(interval);
    }, delay);
    return () => clearInterval(interval);
  }, [safeText, delay]);

  return <>{displayedText}</>;
};

export default function CoordinatorDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('OVERVIEW');
  const [step, setStep] = useState(1);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [assignmentHistory, setAssignmentHistory] = useState([]);
  const [assignmentTab, setAssignmentTab] = useState('NEW');
  const [step3Page, setStep3Page] = useState(1);
  const [previewHtml, setPreviewHtml] = useState({});
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 4000);
  };
  
  const [vpAlertOpen, setVpAlertOpen] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setVpAlertOpen(false), 5000);
    return () => clearTimeout(t);
  }, []);
  
  // State
  const [managerEmail, setManagerEmail] = useState('');
  const [managerValidated, setManagerValidated] = useState(false);
  const [managerName, setManagerName] = useState('');
  
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  
  const [parsedData, setParsedData] = useState(null);
  const [assigning, setAssigning] = useState(false);

  const [portfolio, setPortfolio] = useState([]);
  const [portfolioFilter, setPortfolioFilter] = useState('ALL');
  const [portfolioPage, setPortfolioPage] = useState(1);
  const [selectedVpProject, setSelectedVpProject] = useState(null);

  const [requests, setRequests] = useState([]);
  const [escalations, setEscalations] = useState([]);
  const [resourceUtilModalProject, setResourceUtilModalProject] = useState(null);
  
  
  const [feed, setFeed] = useState([]);
  const [feedFilter, setFeedFilter] = useState('');
  
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { role: 'ai', content: 'Hello! I am your AI assistant. Select a question below to analyze the portfolio:' }
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatInput, setChatInput] = useState('');
  
  const messagesEndRef = useRef(null);
  const chatRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (chatRef.current && !chatRef.current.contains(event.target)) {
        setIsChatOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isChatLoading]);
  
  const suggestedQuestions = [
    "What is the overall portfolio health and total enterprise burn?",
    "Which projects are currently operating below their target margin?",
    "Show me the highest performing project by margin.",
    "Are there any critical governance escalations?",
    "Summarize the total planned vs actual cost across all projects.",
    "Which projects have the largest margin deviation?",
    "Show me all critical (Behind Schedule) projects.",
    "What is the total implementation cost across the portfolio?"
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
      const content = typeof data.answer === 'string' ? data.answer
        : typeof data.detail === 'string' ? data.detail
        : 'Error connecting to intelligence feed.';
      setChatMessages(prev => [...prev, { role: 'ai', content }]);
    } catch (e) {
      setChatMessages(prev => [...prev, { role: 'ai', content: 'Connection to AI framework failed.' }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const q = chatInput.trim();
    setChatInput('');
    handleChatQuestion(q);
  };
  
  useEffect(() => {
    if (activeTab === 'INTELLIGENCE') {
        const url = feedFilter ? `${API}/intelligence/feed?category=${feedFilter}` : `${API}/intelligence/feed`;
        fetch(url, { headers: { Authorization: `Bearer ${tok()}` } })
            .then(res => res.json())
            .then(data => { if (Array.isArray(data)) setFeed(data); })
            .catch(console.error);
    }
  }, [activeTab, feedFilter]);

  useEffect(() => {
    if (activeTab === 'APPROVALS') {
        fetch(`${API}/workflow/requests`, { headers: { Authorization: `Bearer ${tok()}` } })
            .then(res => res.json())
            .then(data => { if (Array.isArray(data)) setRequests(data); })
            .catch(console.error);
        fetch(`${API}/workflow/escalations`, { headers: { Authorization: `Bearer ${tok()}` } })
            .then(res => res.json())
            .then(data => { if (Array.isArray(data)) setEscalations(data); })
            .catch(console.error);
    }
  }, [activeTab]);

  const handleRequestAction = async (id, action) => {
      const comments = prompt(`Enter comments for ${action}:`);
      if (comments === null) return;
      try {
          await fetch(`${API}/workflow/requests/${id}/action`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` },
              body: JSON.stringify({ action, comments })
          });
          // Refresh
          const res = await fetch(`${API}/workflow/requests`, { headers: { Authorization: `Bearer ${tok()}` } });
          const d = await res.json(); if(Array.isArray(d)) setRequests(d);
      } catch (e) {
          showToast('Action failed', 'error');
      }
  };




  useEffect(() => {
    if (activeTab === 'OVERVIEW') {
        fetch(`${API}/manager/projects`, { headers: { Authorization: `Bearer ${tok()}` } })
            .then(res => res.json())
            .then(data => { if (Array.isArray(data)) setPortfolio(data); })
            .catch(console.error);
    }
  }, [activeTab]);

  const validateManager = async () => {
    if (!managerEmail) return;
    try {
      const res = await fetch(`${API}/excel/validate-manager`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` },
        body: JSON.stringify({ email: managerEmail })
      });
      if (res.ok) {
        setManagerValidated(true);
        setManagerName(managerEmail.split('@')[0].toUpperCase());
      } else {
        const errorData = await res.json();
        showToast(errorData.detail || "Invalid PM Email. Must be @arche.global", "error");
      }
    } catch (e) {
      showToast("Error validating manager", "error");
    }
  };

  const handleFileUpload = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    setUploading(true);
    
    const formData = new FormData();
    formData.append("file", selectedFile);
    
    try {
      const res = await fetch(`${API}/excel/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tok()}` },
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        setParsedData(data);
        
        try {
          const previewRes = await fetch(`${API}/excel/preview-mail`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` },
            body: JSON.stringify({
              manager_email: managerEmail,
              project_name: data.summary.project_name || "Unknown Project",
              summary: data.summary,
              project_costing: data.project_costing,
              workforce_budget: data.workforce_budget,
              implementation_resources: data.implementation_resources
            })
          });
          if (previewRes.ok) {
            const previewData = await previewRes.json();
            setPreviewHtml(previewData);
          }
        } catch (e) { console.error("Preview error", e); }
        
        setStep(3);
        setStep3Page(1);
      } else {
        const err = await res.json();
        const detail = err.detail;
        const msg = typeof detail === 'string' ? detail
          : typeof detail?.message === 'string' ? `${detail.message} Missing: ${(detail.missing || []).join(', ')}`
          : 'Failed to parse Excel file.';
        showToast(msg, "error");
      }
    } catch (error) {
      showToast("Upload error", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleAssignProject = async () => {
    if (!parsedData || !managerValidated) return;
    setAssigning(true);
    try {
      const res = await fetch(`${API}/excel/approve-assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` },
        body: JSON.stringify({
          manager_email: managerEmail,
          project_name: parsedData.summary.project_name || "Unknown Project",
          summary: parsedData.summary,
          items: parsedData.items || [],
          implementation_resources: parsedData.implementation_resources || []
        })
      });
      if (res.ok) {
        showToast("Project assigned successfully to PM!", "success");
        // Reset
        setStep(1);
        setManagerEmail('');
        setManagerValidated(false);
        setFile(null);
        setParsedData(null);
        setActiveTab('OVERVIEW');
      } else {
        showToast("Failed to assign project.", "error");
      }
    } catch (e) {
      showToast("Assignment error", "error");
    } finally {
      setAssigning(false);
    }
  };

  const navItems = [
    { id: 'OVERVIEW', label: 'PORTFOLIO OVERVIEW', sub: 'ALL PROJECTS', icon: <Icons.Overview /> }
  ];

  return (
    <div style={{ 
      display:'flex', 
      minHeight:'100vh', 
      backgroundColor: '#f8fafc',
      backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
      backgroundSize: '20px 20px',
      position: 'relative',
      color:'#1e293b', 
      fontFamily:"'Inter',sans-serif" 
    }}>
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
          }}>PROJECT COORDINATOR</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', position: 'relative', zIndex: 1 }}>
          {navItems.map(item => (
            <motion.div 
              key={item.id}
              onClick={() => setActiveTab(item.id)} 
              animate={activeTab === item.id ? { boxShadow: ['inset 2px 0 0 #3b82f6, inset 0 0 10px rgba(59,130,246,0.05)', 'inset 2px 0 0 #3b82f6, inset 0 0 30px rgba(59,130,246,0.25)', 'inset 2px 0 0 #3b82f6, inset 0 0 10px rgba(59,130,246,0.05)'] } : { boxShadow: 'inset 0 0 0 transparent' }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              style={{ 
                display:'flex', alignItems:'center', justifyContent: isSidebarOpen ? 'flex-start' : 'center', gap: isSidebarOpen ? '0.75rem' : '0', padding:'0.85rem 1rem', borderRadius:'8px', fontSize:'0.85rem', fontWeight:600, 
                background: activeTab === item.id ? 'rgba(59,130,246,0.08)' : 'transparent', 
                color: activeTab === item.id ? '#60a5fa' : '#64748b', 
                cursor: 'pointer', transition: 'background 0.3s, color 0.3s, justify-content 0.3s, gap 0.3s'
              }}
              onMouseOver={e => { if(activeTab !== item.id) { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = '#e2e8f0'; } }}
              onMouseOut={e => { if(activeTab !== item.id) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b'; } }}
            >
              <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>{item.icon}</div>
              <span style={{ 
                opacity: isSidebarOpen ? 1 : 0, 
                width: isSidebarOpen ? 'auto' : 0,
                visibility: isSidebarOpen ? 'visible' : 'hidden',
                transition: isSidebarOpen ? 'opacity 0.5s ease 1.5s, visibility 0s 1.5s' : 'opacity 0.5s ease 0s, visibility 0s 0.5s, width 0.5s',
                whiteSpace: 'nowrap',
                overflow: 'hidden'
              }}>{item.label}</span>
            </motion.div>
          ))}
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

      {/* MAIN AREA */}
      <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>
        
        {activeTab === 'ASSIGNMENT' && (
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>Project Assignment Module</h1>
                <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.5rem' }}>Assign new projects to Project Managers by uploading the standard Excel template.</p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', background: '#f1f5f9', padding: '0.25rem', borderRadius: '8px' }}>
                <button 
                  onClick={() => setAssignmentTab('NEW')}
                  style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', fontWeight: 800, border: 'none', borderRadius: '6px', background: assignmentTab === 'NEW' ? '#fff' : 'transparent', color: assignmentTab === 'NEW' ? '#0f172a' : '#64748b', boxShadow: assignmentTab === 'NEW' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  NEW ASSIGNMENT
                </button>
                <button 
                  onClick={() => {
                    setAssignmentTab('HISTORY');
                    fetch(`${API}/excel/assignment-history`, { headers: { Authorization: `Bearer ${tok()}` } })
                      .then(res => res.json())
                      .then(data => { if (Array.isArray(data)) setAssignmentHistory(data); })
                      .catch(console.error);
                  }}
                  style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', fontWeight: 800, border: 'none', borderRadius: '6px', background: assignmentTab === 'HISTORY' ? '#fff' : 'transparent', color: assignmentTab === 'HISTORY' ? '#0f172a' : '#64748b', boxShadow: assignmentTab === 'HISTORY' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  ASSIGNMENT HISTORY
                </button>
              </div>
            </div>

            {assignmentTab === 'NEW' ? (
            <div style={{ display: 'flex', gap: '2rem' }}>
              {/* Steps Sidebar */}
              <div style={{ width: '220px', flexShrink: 0, position: 'relative', paddingLeft: '1rem', marginTop: '1rem' }}>
                <div style={{ position: 'absolute', left: '32px', top: '16px', bottom: '60px', width: '2px', background: '#e2e8f0', zIndex: 0 }}></div>
                {/* Active Connecting Line Glow */}
                <div style={{ position: 'absolute', left: '32px', top: '16px', height: step === 1 ? '0%' : step === 2 ? '45%' : '90%', width: '2px', background: 'linear-gradient(to bottom, #3b82f6, #10b981)', zIndex: 1, transition: 'height 0.6s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: '0 0 12px rgba(37,99,235,0.6)' }}></div>

                {[
                  { num: 1, title: 'Identify PM', desc: 'Assign via Email' },
                  { num: 2, title: 'Upload Excel', desc: 'Project & Budget' },
                  { num: 3, title: 'Review & Assign', desc: 'Finalize Data' }
                ].map((s) => (
                  <div key={s.num} onClick={() => s.num <= step && setStep(s.num)} style={{ display: 'flex', gap: '1.25rem', marginBottom: '3rem', opacity: step >= s.num ? 1 : 0.4, cursor: s.num <= step ? 'pointer' : 'default', position: 'relative', zIndex: 2, transition: 'all 0.3s' }}>
                    <motion.div 
                      animate={step === s.num ? { scale: [1, 1.15, 1], boxShadow: ['0 0 0px rgba(59,130,246,0)', '0 0 20px rgba(59,130,246,0.6)', '0 0 0px rgba(59,130,246,0)'] } : {}}
                      transition={{ duration: 2, repeat: step === s.num ? Infinity : 0 }}
                      style={{ 
                        width: '32px', height: '32px', borderRadius: '50%', 
                        background: step === s.num ? '#0f172a' : step > s.num ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : '#fff', 
                        color: step >= s.num ? '#fff' : '#64748b', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 900,
                        border: step === s.num ? '2px solid #3b82f6' : step > s.num ? 'none' : '2px solid #cbd5e1',
                        boxShadow: step > s.num ? '0 6px 12px rgba(37,99,235,0.3), inset 0 2px 4px rgba(255,255,255,0.4)' : 'none',
                        textShadow: step === s.num ? '0 0 8px rgba(255,255,255,0.5)' : 'none'
                      }}
                    >
                      {step > s.num ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12"></polyline></svg> : s.num}
                    </motion.div>
                    <div style={{ paddingTop: '0.25rem' }}>
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: step === s.num ? '#2563eb' : '#0f172a', transition: 'color 0.3s' }}>{s.title}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem', fontWeight: 600 }}>{s.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Step Content */}
              <div style={{ flex: 1, background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '2rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                
                {step === 1 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                    <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', borderRadius: '16px', padding: '2.5rem', position: 'relative', overflow: 'hidden', color: 'white', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
                      
                      {/* Decorative Background */}
                      <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(255,255,255,0) 70%)', borderRadius: '50%' }}></div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
                        <div style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 15px -3px rgba(37,99,235,0.3)' }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                        </div>
                        <div>
                          <h2 style={{ fontSize: '1.5rem', fontWeight: 900, margin: 0, letterSpacing: '-0.02em', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>Select Project Manager</h2>
                          <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0, marginTop: '0.2rem' }}>Enter the PM's email address to get started.</p>
                        </div>
                      </div>
                      
                      <div style={{ position: 'relative', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', border: managerValidated ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '0.5rem', boxShadow: managerValidated ? '0 0 20px rgba(16,185,129,0.2)' : 'none', transition: 'all 0.3s ease' }}>
                        <div style={{ padding: '0 1rem', color: managerValidated ? '#10b981' : '#64748b' }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                        </div>
                        <input 
                          type="email" 
                          value={managerEmail}
                          onChange={e => { setManagerEmail(e.target.value); setManagerValidated(false); }}
                          placeholder="pm.name@arche.global" 
                          style={{ flex: 1, border: 'none', background: 'transparent', padding: '0.75rem 0', color: '#f8fafc', fontSize: '1.1rem', fontWeight: 600, outline: 'none' }} 
                        />
                        <motion.button 
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={validateManager} 
                          style={{ background: managerValidated ? '#10b981' : '#f8fafc', color: managerValidated ? '#fff' : '#0f172a', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer', transition: 'all 0.3s', boxShadow: managerValidated ? '0 4px 10px rgba(16,185,129,0.3)' : '0 4px 6px rgba(0,0,0,0.1)' }}
                        >
                          {managerValidated ? 'VERIFIED' : 'VERIFY'}
                        </motion.button>
                      </div>

                      {managerValidated && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }} 
                          animate={{ opacity: 1, y: 0 }} 
                          transition={{ duration: 0.4 }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '12px', marginBottom: '2rem' }}>
                            <div style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.25rem', fontWeight: 800, boxShadow: '0 4px 10px rgba(16,185,129,0.4)' }}>
                              {managerName.charAt(0).toUpperCase()}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>Manager Verified</div>
                              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>{managerName}</div>
                              <div style={{ fontSize: '0.8rem', color: '#a7f3d0', marginTop: '0.1rem' }}>Active Project Manager</div>
                            </div>
                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: 'linear' }} style={{ color: '#10b981', opacity: 0.5 }}>
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                            </motion.div>
                          </div>
                        </motion.div>
                      )}

                      <motion.button 
                        whileHover={managerValidated ? { scale: 1.02, boxShadow: '0 10px 25px -5px rgba(37,99,235,0.5)' } : {}}
                        whileTap={managerValidated ? { scale: 0.98 } : {}}
                        onClick={() => setStep(2)} 
                        disabled={!managerValidated} 
                        style={{ 
                          marginTop: managerValidated ? '0' : '2rem', 
                          background: managerValidated ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : 'rgba(255,255,255,0.05)', 
                          color: managerValidated ? '#fff' : '#475569', 
                          border: managerValidated ? 'none' : '1px solid rgba(255,255,255,0.1)', 
                          padding: '1.1rem 2rem', 
                          borderRadius: '12px', 
                          fontWeight: 800, 
                          fontSize: '0.95rem',
                          cursor: managerValidated ? 'pointer' : 'not-allowed',
                          width: '100%',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          gap: '0.75rem',
                          transition: 'all 0.3s'
                        }}
                      >
                        Continue to Upload 
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                      </motion.button>
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 1.5rem 0', color: '#0f172a' }}>Step 2: Upload Project Excel</h2>
                    
                    <div style={{ position: 'relative' }}>
                      <input 
                        type="file" 
                        accept=".xlsx, .xls, .csv"
                        onChange={handleFileUpload}
                        style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                      />
                      <div style={{ background: '#f8fafc', border: '2px dashed #cbd5e1', borderRadius: '8px', padding: '3rem', textAlign: 'center' }}>
                        <div style={{ color: '#2563eb', marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
                          <Icons.Cube />
                        </div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>
                          {uploading ? 'Processing File...' : 'Click or drag Excel file to upload'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Must contain Project Information, Costing, and Workforce Budget</div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 3 && parsedData && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>Step 3: Review & Assign</h2>
                      <div style={{ display: 'flex', gap: '0.25rem', background: '#e2e8f0', padding: '0.25rem', borderRadius: '6px' }}>
                        <button onClick={() => setStep3Page(1)} style={{ padding: '0.25rem 0.75rem', fontSize: '0.7rem', fontWeight: 800, border: 'none', borderRadius: '4px', background: step3Page === 1 ? '#fff' : 'transparent', color: step3Page === 1 ? '#0f172a' : '#64748b', boxShadow: step3Page === 1 ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', cursor: 'pointer', transition: 'all 0.2s' }}>1. Financials</button>
                        <button onClick={() => setStep3Page(2)} style={{ padding: '0.25rem 0.75rem', fontSize: '0.7rem', fontWeight: 800, border: 'none', borderRadius: '4px', background: step3Page === 2 ? '#fff' : 'transparent', color: step3Page === 2 ? '#0f172a' : '#64748b', boxShadow: step3Page === 2 ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', cursor: 'pointer', transition: 'all 0.2s' }}>2. Mail Preview</button>
                      </div>
                    </div>
                    
                    {step3Page === 1 ? (
                      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.75rem', marginBottom: '0.75rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem', marginBottom: '0.75rem' }}>
                          <div style={{ gridColumn: 'span 2' }}>
                            <div style={{ fontSize: '0.55rem', fontWeight: 800, color: '#64748b', letterSpacing: '0.05em' }}>PROJECT NAME</div>
                            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a' }}>{parsedData.summary.project_name || 'N/A'}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: '0.55rem', fontWeight: 800, color: '#64748b', letterSpacing: '0.05em' }}>CUSTOMER</div>
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0f172a' }}>{parsedData.summary.customer_name || 'N/A'}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: '0.55rem', fontWeight: 800, color: '#64748b', letterSpacing: '0.05em' }}>ACCOUNT MANAGER</div>
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0f172a' }}>{parsedData.summary.account_manager || 'N/A'}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: '0.55rem', fontWeight: 800, color: '#64748b', letterSpacing: '0.05em' }}>PROJECT DURATION</div>
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0f172a' }}>{parsedData.summary.project_duration || 'N/A'}</div>
                          </div>
                          <div style={{ gridColumn: 'span 5' }}>
                            <div style={{ width: '100%', height: '1px', background: '#e2e8f0', margin: '0.2rem 0' }}></div>
                          </div>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem' }}>
                          {[
                            { label: 'TOTAL COST PRICE', value: `₹${parsedData.summary.total_cost_price?.toLocaleString() || '0'}` },
                            { label: 'TOTAL SELL PRICE', value: `₹${parsedData.summary.total_sell_price?.toLocaleString() || '0'}`, color: '#2563eb' },
                            { label: 'GST', value: `₹${parsedData.summary.gst?.toLocaleString() || '0'}` },
                            { label: 'SELL PRICE W/ GST', value: `₹${parsedData.summary.total_sell_price_with_gst?.toLocaleString() || '0'}` },
                            { label: 'IMPLEMENTATION', value: `₹${parsedData.summary.implementation_cost?.toLocaleString() || '0'}` },
                            { label: 'PMC COST', value: `₹${parsedData.summary.pmc_cost?.toLocaleString() || '0'}` },
                            { label: 'FREIGHT COST', value: `₹${parsedData.summary.freight_cost?.toLocaleString() || '0'}` },
                            { label: 'SBU', value: parsedData.summary.sbu || 'N/A' },
                            { label: 'MARGIN AMOUNT', value: `₹${parsedData.summary.margin_amount?.toLocaleString() || '0'}`, color: '#10b981' },
                            { label: 'MARGIN %', value: `${(parsedData.summary.margin_pct * 100).toFixed(2)}%`, color: '#10b981' },
                            { label: 'MARGIN TARGET', value: `${(parsedData.summary.margin_target * 100).toFixed(2)}%` },
                            { label: 'MARGIN DEVIATION', value: `${(parsedData.summary.margin_deviation_pct * 100).toFixed(2)}%`, color: (parsedData.summary.margin_deviation_pct || 0) < 0 ? '#ef4444' : '#10b981' },
                          ].map((item, idx) => (
                            <div key={idx} style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '0.3rem 0.5rem', borderRadius: '4px' }}>
                              <div style={{ fontSize: '0.5rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</div>
                              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: item.color || '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.value}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '1rem', marginBottom: '0.75rem' }}>
                        <div style={{ marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid #f1f5f9' }}>
                          <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}><strong>From:</strong> <span style={{ color: '#0f172a' }}>{previewHtml.from_email || 'Loading...'}</span></div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}><strong>To:</strong> <span style={{ color: '#0f172a' }}>{previewHtml.to_email || managerEmail}</span></div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}><strong>Subject:</strong> <span style={{ color: '#0f172a' }}>[DigiTrac] New Project Assigned</span></div>
                        </div>
                        <div style={{ fontSize: '0.8rem', maxHeight: '250px', overflowY: 'auto' }} dangerouslySetInnerHTML={{ __html: previewHtml.html_body || "Generating preview..." }}></div>
                      </div>
                    )}

                    <button onClick={handleAssignProject} disabled={assigning} style={{ background: '#1e293b', color: '#fff', border: 'none', padding: '0.85rem 2rem', borderRadius: '6px', fontWeight: 700, cursor: assigning ? 'not-allowed' : 'pointer', width: '100%' }}>
                      {assigning ? 'Assigning...' : 'Confirm Assignment to PM'}
                    </button>
                  </motion.div>
                )}

              </div>
            </div>
            ) : (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <tr>
                        <th style={{ padding: '1rem', fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date Assigned</th>
                        <th style={{ padding: '1rem', fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>From</th>
                        <th style={{ padding: '1rem', fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>To (Manager)</th>
                        <th style={{ padding: '1rem', fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Project</th>
                        <th style={{ padding: '1rem', fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Duration</th>
                        <th style={{ padding: '1rem', fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Margin</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignmentHistory.map(item => (
                        <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '1rem', fontSize: '0.8rem', color: '#64748b' }}>{new Date(item.assigned_date).toLocaleDateString()}</td>
                          <td style={{ padding: '1rem', fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>{item.assigned_by}</td>
                          <td style={{ padding: '1rem', fontSize: '0.85rem', fontWeight: 700, color: '#2563eb' }}>{item.manager_email}</td>
                          <td style={{ padding: '1rem' }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>{item.project_name}</div>
                            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{item.customer_name}</div>
                          </td>
                          <td style={{ padding: '1rem', fontSize: '0.8rem', color: '#64748b' }}>{item.duration}</td>
                          <td style={{ padding: '1rem' }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#10b981' }}>₹{item.margin_amount?.toLocaleString() || '0'}</div>
                            <div style={{ fontSize: '0.7rem', color: '#10b981' }}>{((item.margin_pct || 0) * 100).toFixed(2)}%</div>
                          </td>
                        </tr>
                      ))}
                      {assignmentHistory.length === 0 && (
                        <tr>
                          <td colSpan="6" style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>No assignment history found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {activeTab === 'OVERVIEW' && (() => {
          const validPortfolio = Array.isArray(portfolio) ? portfolio : [];
          
          // Normalizing backend legacy statuses to new governance terminology
          const normalizedPortfolio = validPortfolio.map(p => {
              let s = p.status || p.kpis?.health || '';
              if (s === 'Green' || s === 'GREEN' || s === 'Good' || s === 'GOOD') s = 'Ahead of Schedule';
              else if (s === 'Orange' || s === 'ORANGE') s = 'At Risk';
              else if (s === 'Red' || s === 'RED') s = 'Behind Schedule';
              else if (s === 'Blue' || s === 'BLUE' || s === 'On Track') s = 'On Track';
              else if (s === 'Pending' || s === 'PENDING' || s === 'Pending Assignment' || !s) s = 'Pending Assignment';

              // Derive Project Health from resource statuses
              const implRes = p.implementation_resources || p.kpis?.implementation_resources || [];
              if (implRes.length > 0) {
                  let behindCount = 0;
                  let atRiskCount = 0;
                  
                  implRes.forEach(res => {
                      if (res.start_date && res.individuals) {
                          res.individuals.forEach(ind => {
                              let expectedPct = 0;
                              const elapsedDays = (new Date() - new Date(res.start_date)) / (1000 * 60 * 60 * 24);
                              const elapsedMonths = elapsedDays / 30.0;
                              expectedPct = Math.min(100, (elapsedMonths / (res.Months || 1)) * 100);
                              
                              if (ind.actual_pct < (expectedPct - 10)) behindCount++;
                              else if (ind.actual_pct >= (expectedPct - 10) && ind.actual_pct < expectedPct) atRiskCount++;
                          });
                      }
                  });
                  
                  if (behindCount > 0) {
                      s = 'Behind Schedule';
                  } else if (atRiskCount >= 2) {
                      s = 'At Risk';
                  } else {
                      s = 'Ahead of Schedule';
                  }
              }

              return { ...p, status: s };
          });

          // Sort newest assigned first
          const sortedPortfolio = [...normalizedPortfolio].sort((a, b) => new Date(b.assigned_at || 0) - new Date(a.assigned_at || 0));
          const filteredPortfolio = sortedPortfolio.filter(p => {
              if (portfolioFilter === 'ALL') return true;
              if (portfolioFilter === 'Healthy') return p.status === 'Ahead of Schedule' || p.status === 'On Track';
              if (portfolioFilter === 'At-Risk') return p.status === 'At Risk';
              if (portfolioFilter === 'Critical') return p.status === 'Behind Schedule';
              return p.status === portfolioFilter;
          });
          
          const ITEMS_PER_PAGE = 10;
          const totalPages = Math.max(1, Math.ceil(filteredPortfolio.length / ITEMS_PER_PAGE));
          const paginatedPortfolio = filteredPortfolio.slice((portfolioPage - 1) * ITEMS_PER_PAGE, portfolioPage * ITEMS_PER_PAGE);

          const totalProjects = normalizedPortfolio.length;
          const greenCount = normalizedPortfolio.filter(p => p.status === 'Ahead of Schedule' || p.status === 'On Track').length;
          const orangeCount = normalizedPortfolio.filter(p => p.status === 'At Risk').length;
          const redCount = normalizedPortfolio.filter(p => p.status === 'Behind Schedule').length;
          
          const greenEnd = totalProjects ? (greenCount / totalProjects) * 360 : 0;
          const orangeEnd = greenEnd + (totalProjects ? (orangeCount / totalProjects) * 360 : 0);
          
          const totalPlannedHours = validPortfolio.reduce((acc, p) => acc + (p.kpis?.planned_hours || 0), 0);
          const totalActualHours = validPortfolio.reduce((acc, p) => acc + (p.kpis?.actual_hours || 0), 0);
          
          return (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ padding: '0 1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem' }}>
                <div>
                  <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>Portfolio Overview</h1>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>Real-time health and margin tracking of all assigned projects.</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {/* Filter Toggles */}
                  <div style={{ display: 'flex', gap: '0.4rem', background: '#f1f5f9', padding: '0.2rem', borderRadius: '8px' }}>
                    {['ALL', 'Healthy', 'At-Risk', 'Critical'].map(f => (
                      <button 
                        key={f} 
                        onClick={() => { setPortfolioFilter(f); setPortfolioPage(1); }}
                        style={{ 
                          border: 'none', 
                          background: portfolioFilter === f ? '#fff' : 'transparent', 
                          boxShadow: portfolioFilter === f ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                          color: portfolioFilter === f ? '#0f172a' : '#64748b',
                          fontWeight: portfolioFilter === f ? 800 : 600,
                          fontSize: '0.65rem',
                          padding: '0.3rem 0.8rem',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        {f === 'ALL' ? 'All Projects' : f}
                      </button>
                    ))}
                  </div>
                  {/* New Project Button */}
                  <button 
                    onClick={() => setActiveTab('ASSIGNMENT')}
                    style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 6px -1px rgba(37,99,235,0.2)' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    New Project
                  </button>
                </div>
              </div>

              {/* Data Dashboards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                 {/* Donut Chart Widget */}
                 <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.8rem', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                    <div style={{ position: 'relative', width: '40px', height: '40px' }}>
                       <div style={{
                          width: '100%', height: '100%', borderRadius: '50%',
                          background: totalProjects === 0 
                            ? '#e2e8f0' 
                            : `conic-gradient(#10b981 0deg ${greenEnd}deg, #f59e0b ${greenEnd}deg ${orangeEnd}deg, #ef4444 ${orangeEnd}deg 360deg)`
                       }}></div>
                       <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '28px', height: '28px', background: '#fff', borderRadius: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                         <div style={{ fontSize: '0.75rem', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>{totalProjects}</div>
                       </div>
                    </div>
                    <div>
                       <div style={{ display: 'flex', gap: '0.75rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.55rem', fontWeight: 700, color: '#475569' }}><div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></div> {greenCount} Healthy</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.55rem', fontWeight: 700, color: '#475569' }}><div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b' }}></div> {orangeCount} At-Risk</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.55rem', fontWeight: 700, color: '#475569' }}><div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444' }}></div> {redCount} Critical</div>
                       </div>
                    </div>
                 </div>

                 {/* Hours Tracking Widget */}
                 <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.4rem 0.8rem', boxShadow: '0 1px 2px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                      <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Icons.Overview /> Enterprise Burn</div>
                      <div style={{ fontSize: '0.55rem', fontWeight: 700, color: '#64748b' }}>
                        <span style={{ color: '#2563eb', fontWeight: 900 }}>{totalActualHours.toLocaleString()}</span> / {totalPlannedHours.toLocaleString()} hrs
                      </div>
                    </div>
                    <div style={{ width: '100%', height: '3px', background: '#e2e8f0', borderRadius: '1.5px', overflow: 'hidden', position: 'relative' }}>
                      <div style={{ width: `${totalPlannedHours ? Math.min(100, (totalActualHours / totalPlannedHours) * 100) : 0}%`, background: 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)', height: '100%', borderRadius: '1.5px' }}></div>
                    </div>
                 </div>
              </div>

              {/* Compact List View */}
              {totalProjects === 0 ? (
                 <div style={{ textAlign: 'center', padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '2px dashed #e2e8f0' }}>
                   <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>No active projects assigned.</div>
                 </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                    {paginatedPortfolio.map((p, i) => (
                      <div key={i}
                        onClick={() => { setSelectedVpProject(p); setResourceUtilModalProject(p); }}
                        style={{ borderBottom: i === paginatedPortfolio.length - 1 ? 'none' : '1px solid #f1f5f9', padding: '0.2rem 0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: selectedVpProject?.id === p.id ? '#eff6ff' : '#fff', cursor: 'pointer', transition: 'background 0.15s' }}
                        onMouseOver={e => e.currentTarget.style.background = '#f8fafc'}
                        onMouseOut={e => e.currentTarget.style.background = selectedVpProject?.id === p.id ? '#eff6ff' : '#fff'}
                      >
                         {/* Status Indicator */}
                         <div style={{ width: '3px', height: '16px', borderRadius: '1.5px', background: p.status === 'Behind Schedule' ? '#ef4444' : p.status === 'At Risk' ? '#f59e0b' : p.status === 'On Track' ? '#3b82f6' : p.status === 'Ahead of Schedule' ? '#10b981' : '#94a3b8', flexShrink: 0 }}></div>
                         
                         {/* Project Info */}
                         <div style={{ flex: '2', minWidth: '120px', overflow: 'hidden' }}>
                           <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.name}>{p.name}</div>
                           <div style={{ fontSize: '0.55rem', color: '#64748b', marginTop: '0', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                             <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.customer_name}</span>
                             <span style={{ color: '#cbd5e1' }}>|</span>
                             <span>{p.duration}Mos</span>
                           </div>
                         </div>
                         
                         {/* Manager */}
                         <div style={{ flex: '1', minWidth: '70px', display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.6rem', fontWeight: 700, color: '#475569' }}>
                           <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> 
                           <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{(p.manager_name || '').split('@')[0]}</span>
                         </div>

                         {/* Timeline */}
                         <div style={{ flex: '1.5', minWidth: '90px', display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                           <div style={{ fontSize: '0.45rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.05em' }}>TIMELINE</div>
                           {(() => {
                             if (!p.assigned_at) return <div style={{ fontSize: '0.65rem', color: '#64748b' }}>N/A</div>;
                             const start = new Date(p.assigned_at);
                             const end = new Date(start);
                             end.setMonth(end.getMonth() + (parseFloat(p.duration) || 0));
                             const remainingDays = Math.max(0, Math.ceil((end - new Date()) / (1000 * 60 * 60 * 24)));
                             return (
                               <div style={{ display: 'flex', flexDirection: 'column' }}>
                                 <div style={{ fontSize: '0.65rem', fontWeight: 700, color: remainingDays <= 30 ? '#ef4444' : '#0f172a' }}>
                                   {remainingDays} Days Left
                                 </div>
                                 <div style={{ fontSize: '0.55rem', color: '#64748b' }}>{end.toLocaleDateString()}</div>
                               </div>
                             );
                           })()}
                         </div>

                         {/* Margins / Progress */}
                         {(() => {
                           const implRes = p.implementation_resources || p.kpis?.implementation_resources || [];
                           let totalExpected = 0;
                           let totalActual = 0;
                           let totalIndividuals = 0;
                           
                           implRes.forEach(r => {
                               const sd = r.start_date ? new Date(r.start_date) : null;
                               let expectedPct = 0;
                               if (sd && r.Months > 0) {
                                   const elapsedDays = (new Date() - sd) / (1000 * 60 * 60 * 24);
                                   expectedPct = Math.min(100, (elapsedDays / 30.0 / r.Months) * 100);
                               }
                               if (r.individuals && r.individuals.length > 0) {
                                   r.individuals.forEach(ind => {
                                       totalExpected += expectedPct;
                                       totalActual += ind.actual_pct || 0;
                                       totalIndividuals++;
                                   });
                               }
                           });
                           
                           const avgExpected = totalIndividuals > 0 ? parseFloat((totalExpected / totalIndividuals).toFixed(1)) : 0;
                           const avgActual = totalIndividuals > 0 ? parseFloat((totalActual / totalIndividuals).toFixed(1)) : 0;
                           const variance = parseFloat((avgActual - avgExpected).toFixed(1));
                           const isProfit = variance >= 0;

                           return (
                             <div style={{ flex: '1.5', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                               <div>
                                 <div style={{ fontSize: '0.45rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.05em' }}>TARGET</div>
                                 <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#0f172a' }}>{avgExpected}%</div>
                               </div>
                               <div>
                                 <div style={{ fontSize: '0.45rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.05em' }}>ACTUAL</div>
                                 <div style={{ fontSize: '0.7rem', fontWeight: 900, color: '#0f172a' }}>{avgActual}%</div>
                               </div>
                               <div>
                                 <div style={{ fontSize: '0.45rem', fontWeight: 800, color: isProfit ? '#059669' : '#dc2626', letterSpacing: '0.05em' }}>VARIANCE</div>
                                 <div style={{ fontSize: '0.7rem', fontWeight: 900, color: isProfit ? '#10b981' : '#ef4444' }}>{variance > 0 ? '+' : ''}{variance}%</div>
                               </div>
                             </div>
                           );
                         })()}

                         {/* Resource Utilization */}
                         {/* Resource Utilization */}
                         {(() => {
                           const implRes = p.implementation_resources || p.kpis?.implementation_resources || [];
                           let avgUtil = 0;
                           if (implRes.length > 0) {
                             const total = implRes.reduce((sum, r) => sum + (r.utilization || 0), 0);
                             avgUtil = Math.round(total / implRes.length);
                           }
                           return (
                             <div 
                               onClick={(e) => { e.stopPropagation(); setResourceUtilModalProject(p); }}
                               style={{ flex: '1.2', minWidth: '90px', display: 'flex', flexDirection: 'column', gap: '0.1rem', cursor: 'pointer', padding: '0.2rem', borderRadius: '4px', border: '1px dashed transparent' }}
                               onMouseOver={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                               onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}
                               title="Click to view Resource Utilization Breakdown"
                             >
                               <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.5rem', fontWeight: 800 }}>
                                 <span style={{ color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Resource Util</span>
                                 <span style={{ color: avgUtil > 100 ? '#ef4444' : avgUtil > 80 ? '#f59e0b' : '#10b981' }}>{avgUtil}%</span>
                               </div>
                               <div style={{ width: '100%', height: '4px', background: '#e2e8f0', borderRadius: '2px', overflow: 'hidden' }}>
                                 <div style={{ width: `${Math.min(100, avgUtil)}%`, background: avgUtil > 100 ? '#ef4444' : avgUtil > 80 ? '#f59e0b' : '#10b981', height: '100%', borderRadius: '2px' }}></div>
                               </div>
                             </div>
                           );
                         })()}
                      </div>
                    ))}
                  </div>
                  {filteredPortfolio.length === 0 && (
                     <div style={{ padding: '1.5rem', textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, border: '1px dashed #e2e8f0', borderRadius: '8px' }}>
                       No projects match the selected filter.
                     </div>
                  )}
                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', padding: '0 0.5rem' }}>
                      <div style={{ fontSize: '0.65rem', fontWeight: 600, color: '#64748b' }}>
                        Showing {(portfolioPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(portfolioPage * ITEMS_PER_PAGE, filteredPortfolio.length)} of {filteredPortfolio.length}
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          disabled={portfolioPage === 1}
                          onClick={() => setPortfolioPage(p => Math.max(1, p - 1))}
                          style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '0.2rem 0.5rem', fontSize: '0.65rem', fontWeight: 600, cursor: portfolioPage === 1 ? 'not-allowed' : 'pointer', color: portfolioPage === 1 ? '#cbd5e1' : '#475569' }}
                        >
                          Prev
                        </button>
                        <span style={{ fontSize: '0.65rem', fontWeight: 600, color: '#0f172a', padding: '0.2rem 0' }}>Page {portfolioPage} of {totalPages}</span>
                        <button 
                          disabled={portfolioPage === totalPages}
                          onClick={() => setPortfolioPage(p => Math.min(totalPages, p + 1))}
                          style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '0.2rem 0.5rem', fontSize: '0.65rem', fontWeight: 600, cursor: portfolioPage === totalPages ? 'not-allowed' : 'pointer', color: portfolioPage === totalPages ? '#cbd5e1' : '#475569' }}
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          );
        })()}
      
        {activeTab === 'OVERVIEW' && selectedVpProject && (() => {
          const sp = selectedVpProject;
          const implRes = sp.implementation_resources || sp.kpis?.implementation_resources || [];
          const costing = sp.project_costing || [];
          return (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              style={{ marginTop: '1rem', padding: '0 1rem' }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: sp.status === 'Behind Schedule' ? '#ef4444' : sp.status === 'At Risk' ? '#f59e0b' : sp.status === 'On Track' ? '#3b82f6' : sp.status === 'Ahead of Schedule' ? '#10b981' : '#94a3b8', boxShadow: `0 0 8px ${sp.status === 'Behind Schedule' ? '#ef4444' : sp.status === 'At Risk' ? '#f59e0b' : sp.status === 'On Track' ? '#3b82f6' : sp.status === 'Ahead of Schedule' ? '#10b981' : '#94a3b8'}` }}></div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>{sp.name}</h2>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{sp.customer_name} · PM: {sp.manager_name}</div>
                  </div>
                </div>
                <button onClick={() => setSelectedVpProject(null)} style={{ background: '#e2e8f0', border: 'none', padding: '0.4rem 0.9rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.75rem', color: '#475569' }}>✕ Close</button>
              </div>

              {(() => {
                  const vpAlerts = [];
                  implRes.forEach(res => {
                      if (res.start_date && res.individuals) {
                          res.individuals.forEach(ind => {
                              let expectedPct = 0;
                              const elapsedDays = (new Date() - new Date(res.start_date)) / (1000 * 60 * 60 * 24);
                              const elapsedMonths = elapsedDays / 30.0;
                              expectedPct = Math.min(100, (elapsedMonths / (res.Months || 1)) * 100);
                              
                              let status = 'On Track';
                              if (ind.actual_pct > expectedPct) status = 'Ahead of Schedule';
                              else if (ind.actual_pct === expectedPct) status = 'On Track';
                              else if (ind.actual_pct >= (expectedPct - 10)) status = 'At Risk';
                              else status = 'Behind Schedule';
                              
                              if (status === 'At Risk' || status === 'Behind Schedule') {
                                  vpAlerts.push({
                                      resourceName: res['Resource Name'],
                                      personName: ind.name,
                                      projectName: sp.name,
                                      variance: parseFloat((ind.actual_pct - expectedPct).toFixed(1)),
                                      triggerDate: new Date().toLocaleDateString(),
                                      status
                                  });
                              }
                          });
                      }
                  });

                  if (vpAlerts.length > 0) {
                      return (
                          <motion.div variants={{ hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } } }} style={{ background: '#fef2f2', border: '1px solid #fecaca', borderLeft: '4px solid #ef4444', borderRadius: '6px', marginBottom: '1rem', overflow: 'hidden' }}>
                              <div 
                                  onClick={() => setVpAlertOpen(!vpAlertOpen)}
                                  style={{ cursor: 'pointer', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                              >
                                  <div style={{ color: '#ef4444', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                      <Icons.Bell /> ⚠ Action Required ({vpAlerts.length})
                                  </div>
                                  <span style={{ color: '#ef4444', fontSize: '0.7rem', fontWeight: 800 }}>{vpAlertOpen ? 'COLLAPSE ▲' : 'EXPAND ▼'}</span>
                              </div>
                              <AnimatePresence>
                                  {vpAlertOpen && (
                                      <motion.div 
                                          initial={{ height: 0, opacity: 0 }} 
                                          animate={{ height: 'auto', opacity: 1 }} 
                                          exit={{ height: 0, opacity: 0 }}
                                          transition={{ duration: 0.3 }}
                                      >
                                          <div style={{ padding: '0 1rem 1rem 1rem' }}>
                                              <table style={{ width: '100%', fontSize: '0.75rem', textAlign: 'left', borderCollapse: 'collapse' }}>
                                                  <thead>
                                                      <tr style={{ borderBottom: '1px solid #fca5a5' }}>
                                                          <th style={{ padding: '0.4rem', color: '#991b1b' }}>Project Name</th>
                                                          <th style={{ padding: '0.4rem', color: '#991b1b' }}>Resource Name</th>
                                                          <th style={{ padding: '0.4rem', color: '#991b1b' }}>Person Name</th>
                                                          <th style={{ padding: '0.4rem', color: '#991b1b' }}>Variance %</th>
                                                          <th style={{ padding: '0.4rem', color: '#991b1b' }}>Date</th>
                                                      </tr>
                                                  </thead>
                                                  <tbody>
                                                      {vpAlerts.map((alert, i) => (
                                                          <tr key={i} style={{ borderBottom: '1px solid #fee2e2' }}>
                                                              <td style={{ padding: '0.4rem', color: '#7f1d1d', fontWeight: 600 }}>{alert.projectName}</td>
                                                              <td style={{ padding: '0.4rem', color: '#7f1d1d' }}>{alert.resourceName}</td>
                                                              <td style={{ padding: '0.4rem', color: '#7f1d1d' }}>{alert.personName}</td>
                                                              <td style={{ padding: '0.4rem', color: '#ef4444', fontWeight: 800 }}>{alert.variance > 0 ? '+' : ''}{alert.variance}% ({alert.status})</td>
                                                              <td style={{ padding: '0.4rem', color: '#7f1d1d' }}>{alert.triggerDate}</td>
                                                          </tr>
                                                      ))}
                                                  </tbody>
                                              </table>
                                          </div>
                                      </motion.div>
                                  )}
                              </AnimatePresence>
                          </motion.div>
                      );
                  }
                  return null;
              })()}

              {/* KPI Ribbon */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
                {[
                  { label: 'PROJECT HEALTH', value: sp.status, color: sp.status === 'Behind Schedule' ? '#ef4444' : sp.status === 'At Risk' ? '#f59e0b' : sp.status === 'On Track' ? '#3b82f6' : sp.status === 'Ahead of Schedule' ? '#10b981' : '#94a3b8' },
                  { label: 'TARGET MARGIN', value: `${sp.kpis?.target_margin_pct?.toFixed(1) || 0}%`, color: '#2563eb' },
                  { label: 'FORECAST MARGIN', value: `${sp.kpis?.forecast_margin_pct?.toFixed(1) || 0}%`, color: sp.status === 'Behind Schedule' ? '#ef4444' : '#10b981' },
                  { label: 'TOTAL SELL PRICE', value: `₹${(sp.kpis?.total_revenue || 0).toLocaleString('en-IN')}`, color: '#0f172a' },
                  { label: 'DURATION', value: `${sp.duration || 0} Months`, color: '#0f172a' },
                ].map(k => (
                  <div key={k.label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.75rem 1rem', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
                    <div style={{ fontSize: '0.55rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>{k.label}</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: k.color }}>{k.value}</div>
                  </div>
                ))}
              </div>

              {/* Implementation Resources */}
              {implRes.length > 0 && (
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '1rem', overflow: 'hidden' }}>
                  <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a' }}>📋 Implementation Resources</span>
                    <span style={{ fontSize: '0.65rem', color: '#64748b' }}>{implRes.filter(r => r.start_date).length}/{implRes.length} Tracking</span>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc' }}>
                        {['Resource Name','Qty','Planned Duration','Actual Duration','Start Date','Expected End Date','Actual End Date','Util %','Status'].map(h => (
                          <th key={h} style={{ padding: '0.5rem 0.75rem', color: '#475569', fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {implRes.map((r, idx) => {
                        const sd = r.start_date ? new Date(r.start_date) : null;
                        let expectedEndDateStr = '—';
                        if (sd && r.Months > 0) { const e = new Date(sd); e.setMonth(e.getMonth() + r.Months); expectedEndDateStr = e.toISOString().split('T')[0]; }
                        const util = r.utilization || 0;
                        const status = !sd ? 'Pending Assignment' : (util > 100 ? 'Behind Schedule' : util > 80 ? 'At Risk' : 'Ahead of Schedule');
                        const sc = status === 'Behind Schedule' ? '#ef4444' : status === 'At Risk' ? '#f59e0b' : status === 'Ahead of Schedule' ? '#10b981' : '#94a3b8';
                        return (
                          <tr key={idx} style={{ borderTop: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '0.5rem 0.75rem', fontWeight: 600, color: '#0f172a' }}>{r['Resource Name']}</td>
                            <td style={{ padding: '0.5rem 0.75rem', color: '#475569' }}>{r.Qty || 0}</td>
                            <td style={{ padding: '0.5rem 0.75rem', color: '#475569' }}>{r.Months || 0} Mo</td>
                            <td style={{ padding: '0.5rem 0.75rem', color: '#475569' }}>{r.actual_duration !== undefined ? r.actual_duration + ' Mo' : '—'}</td>
                            <td style={{ padding: '0.5rem 0.75rem', color: sd ? '#059669' : '#94a3b8' }}>{sd ? sd.toISOString().split('T')[0] : 'Not Started'}</td>
                            <td style={{ padding: '0.5rem 0.75rem', color: '#475569' }}>{expectedEndDateStr}</td>
                            <td style={{ padding: '0.5rem 0.75rem', color: '#475569' }}>{r.actual_end_date || '—'}</td>
                            <td style={{ padding: '0.5rem 0.75rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{ flex: 1, height: '4px', background: '#e2e8f0', borderRadius: '2px', overflow: 'hidden' }}>
                                  <div style={{ width: `${Math.min(util, 100)}%`, height: '100%', background: sc }}></div>
                                </div>
                                <span style={{ fontSize: '0.7rem', color: sc, fontWeight: 700 }}>{util}%</span>
                              </div>
                            </td>
                            <td style={{ padding: '0.5rem 0.75rem' }}><span style={{ padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.6rem', fontWeight: 800, background: `${sc}22`, color: sc, textTransform: 'uppercase' }}>{status}</span></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Project Costing */}
              {costing.length > 0 && (
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                  <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a' }}>💰 Project Costing ({costing.length} items)</span>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc' }}>
                        {['Description','Qty','Unit Price (INR)','Total Price (INR)','Unit Cost','Total Cost'].map(h => (
                          <th key={h} style={{ padding: '0.5rem 0.75rem', color: '#475569', fontWeight: 700, fontSize: '0.62rem', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {costing.slice(0,15).map((row, idx) => (
                        <tr key={idx} style={{ borderTop: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '0.4rem 0.75rem', color: '#0f172a', maxWidth: '220px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={row.Description}>{row.Description}</td>
                          <td style={{ padding: '0.4rem 0.75rem', color: '#475569' }}>{row.Qty || 0}</td>
                          <td style={{ padding: '0.4rem 0.75rem', color: '#2563eb', fontWeight: 700 }}>₹{(row['Unit Price (INR)'] || 0).toLocaleString()}</td>
                          <td style={{ padding: '0.4rem 0.75rem', color: '#059669', fontWeight: 700 }}>₹{(row['Total Price (INR)'] || 0).toLocaleString()}</td>
                          <td style={{ padding: '0.4rem 0.75rem', color: '#475569' }}>₹{(row['Unit Cost'] || 0).toLocaleString()}</td>
                          <td style={{ padding: '0.4rem 0.75rem', color: '#ef4444' }}>₹{(row['Total Cost'] || 0).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                </div>
              )}
            </motion.div>
          );
        })()}

        {activeTab === 'APPROVALS' && (

          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.4 }}
            style={{ padding: '0.5rem 1rem', maxWidth: '100%', margin: '0 auto' }}
          >
            {/* Header Section */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '0.75rem',
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              padding: '0.5rem 1.5rem',
              borderRadius: '12px',
              color: 'white',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <h1 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Icons.Folder /> Portfolio Overview
                </h1>
                <div style={{ height: '20px', width: '1px', background: 'rgba(255,255,255,0.2)' }}></div>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0, fontWeight: 500 }}>
                  Strategic oversight and resolution interface.
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(255,255,255,0.05)', padding: '0.4rem 0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <span style={{ position: 'relative', display: 'flex', height: '10px', width: '10px' }}>
                  <motion.span animate={{ scale: [1, 2, 1], opacity: [0.8, 0, 0.8] }} transition={{ duration: 2, repeat: Infinity }} style={{ position: 'absolute', height: '100%', width: '100%', borderRadius: '50%', background: '#10b981' }}></motion.span>
                  <span style={{ position: 'relative', borderRadius: '50%', height: '10px', width: '10px', background: '#10b981' }}></span>
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#f8fafc', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Live Sync</span>
              </div>
            </div>

            {/* Premium Dashboard Widgets */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
              {[
                { label: 'ACTION REQUIRED', count: (Array.isArray(requests) ? requests : []).filter(r => r.status === 'PENDING').length, grad: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', shadow: 'rgba(37, 99, 235, 0.3)', icon: <Icons.Bell /> },
                { label: 'CRITICAL ESCALATIONS', count: (Array.isArray(escalations) ? escalations : []).filter(e => e.status === 'OPEN').length, grad: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', shadow: 'rgba(239, 68, 68, 0.3)', icon: <Icons.Overview /> },
                { label: 'RESOLVED REQUESTS', count: (Array.isArray(requests) ? requests : []).filter(r => r.status === 'APPROVED').length, grad: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', shadow: 'rgba(16, 185, 129, 0.3)', icon: <Icons.CheckSquare /> },
                { label: 'AT-RISK PORTFOLIO', count: (Array.isArray(portfolio) ? portfolio : []).filter(p => p.status === 'At Risk' || p.status === 'Behind Schedule' || p.status === 'Orange' || p.status === 'Red').length, grad: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', shadow: 'rgba(245, 158, 11, 0.3)', icon: <Icons.Cube /> }
              ].map((stat, i) => (
                <motion.div 
                  key={i}
                  whileHover={{ y: -8, scale: 1.02 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                  style={{ 
                    background: stat.grad, 
                    padding: '0.75rem 1rem', 
                    borderRadius: '12px', 
                    color: 'white',
                    boxShadow: `0 4px 6px -1px ${stat.shadow}`,
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    minHeight: '40px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', zIndex: 1 }}>
                    <div style={{ opacity: 0.8, display: 'flex', alignItems: 'center' }}>{stat.icon}</div>
                    <div style={{ fontSize: '0.65rem', fontWeight: 800, opacity: 0.9, letterSpacing: '0.05em' }}>{stat.label}</div>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 900, lineHeight: 1, zIndex: 1, textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>{stat.count}</div>
                </motion.div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
              {/* Active Escalations Section */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div style={{ width: '4px', height: '20px', background: '#ef4444', borderRadius: '4px' }}></div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Active Escalations</h3>
                  <div style={{ background: '#fef2f2', color: '#ef4444', padding: '0.2rem 0.5rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 700 }}>Immediate Attention Needed</div>
                </div>
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                          <tr>
                              <th style={{ padding: '0.4rem 0.75rem', fontSize: '0.6rem', fontWeight: 800, color: '#64748b', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Project</th>
                              <th style={{ padding: '0.4rem 0.75rem', fontSize: '0.6rem', fontWeight: 800, color: '#64748b', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Trigger Reason</th>
                              <th style={{ padding: '0.4rem 0.75rem', fontSize: '0.6rem', fontWeight: 800, color: '#64748b', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Margin Impact</th>
                              <th style={{ padding: '0.4rem 0.75rem', fontSize: '0.6rem', fontWeight: 800, color: '#64748b', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Date Raised</th>
                              <th style={{ padding: '0.4rem 0.75rem', fontSize: '0.6rem', fontWeight: 800, color: '#64748b', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Status</th>
                          </tr>
                      </thead>
                      <tbody>
                          {(!escalations || !Array.isArray(escalations) || escalations.length === 0) && (
                            <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ padding: '1rem', background: '#f1f5f9', borderRadius: '50%', color: '#cbd5e1' }}><Icons.Check /></div>
                                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>No active escalations requiring your attention.</div>
                              </div>
                            </td></tr>
                          )}
                          {(Array.isArray(escalations) ? escalations : []).map((e, i) => (
                              <motion.tr 
                                key={i} 
                                whileHover={{ background: '#f8fafc', scale: 1.002 }}
                                style={{ borderBottom: '1px solid #e2e8f0', transition: 'all 0.2s' }}
                              >
                                  <td style={{ padding: '0.4rem 0.75rem' }}>
                                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a' }}>{e.project_name}</div>
                                  </td>
                                  <td style={{ padding: '0.4rem 0.75rem' }}>
                                    <span style={{ background: '#fef2f2', color: '#dc2626', padding: '0.2rem 0.4rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, display: 'inline-block', border: '1px solid #fecaca' }}>
                                      {e.trigger_reason}
                                    </span>
                                  </td>
                                  <td style={{ padding: '0.4rem 0.75rem' }}>
                                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.7rem' }}>
                                      <div><span style={{ color: '#64748b' }}>Target:</span> <span style={{ fontWeight: 700 }}>{e.target_margin}%</span></div>
                                      <div><span style={{ color: '#64748b' }}>Risk:</span> <span style={{ fontWeight: 800, color: '#ef4444' }}>{e.current_margin}%</span></div>
                                    </div>
                                  </td>
                                  <td style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                                    {new Date(e.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                  </td>
                                  <td style={{ padding: '0.4rem 0.75rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                      <span style={{ position: 'relative', borderRadius: '50%', height: '6px', width: '6px', background: e.status === 'OPEN' ? '#ef4444' : '#10b981' }}></span>
                                      <span style={{ fontSize: '0.7rem', fontWeight: 800, color: e.status === 'OPEN' ? '#ef4444' : '#10b981' }}>{e.status}</span>
                                    </div>
                                  </td>
                              </motion.tr>
                          ))}
                      </tbody>
                  </table>
                </div>
              </motion.div>

              {/* Pending Requests Section */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div style={{ width: '4px', height: '20px', background: '#3b82f6', borderRadius: '4px' }}></div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Pending Approval Queue</h3>
                  <div style={{ background: '#eff6ff', color: '#2563eb', padding: '0.2rem 0.5rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 700 }}>Management Review</div>
                </div>
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                          <tr>
                              <th style={{ padding: '0.4rem 0.75rem', fontSize: '0.6rem', fontWeight: 800, color: '#64748b', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Project</th>
                              <th style={{ padding: '0.4rem 0.75rem', fontSize: '0.6rem', fontWeight: 800, color: '#64748b', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Request Type</th>
                              <th style={{ padding: '0.4rem 0.75rem', fontSize: '0.6rem', fontWeight: 800, color: '#64748b', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Details & Context</th>
                              <th style={{ padding: '0.4rem 0.75rem', fontSize: '0.6rem', fontWeight: 800, color: '#64748b', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Status</th>
                              <th style={{ padding: '0.4rem 0.75rem', fontSize: '0.6rem', fontWeight: 800, color: '#64748b', letterSpacing: '0.05em', textTransform: 'uppercase', textAlign: 'right' }}>Action</th>
                          </tr>
                      </thead>
                      <tbody>
                          {(!requests || !Array.isArray(requests) || requests.length === 0) && (
                            <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ padding: '1rem', background: '#f1f5f9', borderRadius: '50%', color: '#cbd5e1' }}><Icons.CheckSquare /></div>
                                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>Action queue is currently empty.</div>
                              </div>
                            </td></tr>
                          )}
                          {(Array.isArray(requests) ? requests : []).map((r, i) => (
                              <motion.tr 
                                key={i} 
                                whileHover={{ background: '#f8fafc', scale: 1.002 }}
                                style={{ borderBottom: '1px solid #e2e8f0', transition: 'all 0.2s' }}
                              >
                                  <td style={{ padding: '0.4rem 0.75rem' }}>
                                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a' }}>{r.project_name}</div>
                                  </td>
                                  <td style={{ padding: '0.4rem 0.75rem' }}>
                                    <span style={{ 
                                      background: r.type === 'ADDITIONAL_HOURS' ? '#eff6ff' : '#f5f3ff', 
                                      color: r.type === 'ADDITIONAL_HOURS' ? '#2563eb' : '#7c3aed', 
                                      padding: '0.2rem 0.4rem', 
                                      borderRadius: '4px', 
                                      fontSize: '0.7rem', 
                                      fontWeight: 700, 
                                      display: 'inline-block',
                                      border: `1px solid ${r.type === 'ADDITIONAL_HOURS' ? '#bfdbfe' : '#ddd6fe'}`
                                    }}>
                                      {r.type.replace('_', ' ')}
                                    </span>
                                  </td>
                                  <td style={{ padding: '0.4rem 0.75rem' }}>
                                      <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        {r.type === 'ADDITIONAL_HOURS' ? `+${r.requested_additional_hours} Hours` : `Extend to ${new Date(r.requested_end_date).toLocaleDateString()}`}
                                        {r.node_id && r.node_id !== 'PROJECT_LEVEL' && (
                                          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#2563eb', background: '#eff6ff', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>
                                            {r.node_id}
                                          </span>
                                        )}
                                      </div>
                                      <div style={{ fontSize: '0.7rem', color: '#64748b', fontStyle: 'italic', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        "{typeof r.reason === 'string' ? r.reason : JSON.stringify(r.reason)}"
                                      </div>
                                  </td>
                                  <td style={{ padding: '0.4rem 0.75rem' }}>
                                    <span style={{ 
                                      display: 'inline-flex', alignItems: 'center', gap: '0.2rem',
                                      padding: '0.2rem 0.4rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800,
                                      background: r.status === 'PENDING' ? '#fffbeb' : r.status === 'APPROVED' ? '#ecfdf5' : '#fef2f2',
                                      color: r.status === 'PENDING' ? '#d97706' : r.status === 'APPROVED' ? '#059669' : '#dc2626',
                                      border: `1px solid ${r.status === 'PENDING' ? '#fde68a' : r.status === 'APPROVED' ? '#a7f3d0' : '#fecaca'}`
                                    }}>
                                      {r.status}
                                    </span>
                                  </td>
                                  <td style={{ padding: '0.4rem 0.75rem', textAlign: 'right' }}>
                                      {r.status === 'PENDING' ? (
                                          <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                                              <motion.button 
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => handleRequestAction(r.id, 'APPROVE')} 
                                                style={{ background: '#10b981', color: '#fff', border: 'none', padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer', boxShadow: '0 2px 4px rgba(16,185,129,0.2)' }}
                                              >
                                                Approve
                                              </motion.button>
                                              <motion.button 
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => handleRequestAction(r.id, 'REJECT')} 
                                                style={{ background: '#fff', color: '#ef4444', border: '1px solid #ef4444', padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer', boxShadow: '0 1px 2px rgba(239,68,68,0.05)' }}
                                              >
                                                Reject
                                              </motion.button>
                                          </div>
                                      ) : (
                                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700 }}>Resolved</span>
                                      )}
                                  </td>
                              </motion.tr>
                          ))}
                      </tbody>
                  </table>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      
        {activeTab === 'INTELLIGENCE' && (
          <div style={{ padding: '0 1rem', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>Mission Intelligence Feed</h1>
                  <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.5rem' }}>Automated executive updates based on live project telemetry.</p>
                </div>
                <select 
                    value={feedFilter} 
                    onChange={e => setFeedFilter(e.target.value)}
                    style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', outline: 'none' }}
                >
                    <option value="">All Events</option>
                    <option value="MARGIN">Margin Events</option>
                    <option value="HOURS">Hours Events</option>
                    <option value="ESCALATION">Escalations</option>
                    <option value="APPROVAL">Approvals</option>
                    <option value="ASSIGNMENT">Assignments</option>
                </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {(!feed || !Array.isArray(feed) || feed.length === 0) ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>No intelligence events match criteria.</div>
                ) : (Array.isArray(feed) ? feed : []).map((e, i) => (
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
                        
                        <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.2rem' }}>Project: <span style={{ fontWeight: 700, color: '#0f172a' }}>{e.project_name || 'N/A'}</span></div>
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

      </div>

      {/* Floating AI ChatBox (Elite Redesign) */}
      <AnimatePresence>
        {isChatOpen ? (
          <motion.div 
            ref={chatRef}
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
                  <div style={{ fontSize: '0.75rem', fontWeight: 900, color: '#0f172a', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>DIGITRAC AI <span style={{color: '#3b82f6', display: 'flex'}}><Icons.Bot /></span></div>
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
                    {msg.role === 'ai' ? <TypewriterText text={msg.content} /> : msg.content}
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
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area / Suggested Questions */}
            <div style={{ padding: '0.8rem', borderTop: '1px solid rgba(0,0,0,0.06)', background: '#f8fafc', position: 'relative' }}>
              <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.6rem', letterSpacing: '0.1em', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Suggested Queries</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: '#94a3b8' }}>
                  Scroll for more <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '100px', overflowY: 'auto', paddingRight: '0.2rem', marginBottom: '0.8rem' }}>
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
              
              {/* Custom Input */}
              <form onSubmit={handleCustomSubmit} style={{ display: 'flex', gap: '0.4rem' }}>
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  placeholder="Ask a question..." 
                  disabled={isChatLoading}
                  style={{ flex: 1, padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.75rem', outline: 'none', background: isChatLoading ? '#f1f5f9' : '#fff' }}
                />
                <button 
                  type="submit" 
                  disabled={isChatLoading || !chatInput.trim()}
                  style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', padding: '0 0.8rem', cursor: isChatLoading || !chatInput.trim() ? 'not-allowed' : 'pointer', opacity: isChatLoading || !chatInput.trim() ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                </button>
              </form>
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

      {/* TOAST NOTIFICATION */}
      {toast.show && (
        <motion.div 
          initial={{ opacity: 0, y: 50, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: 50, x: '-50%' }}
          style={{ 
            position: 'fixed', bottom: '2rem', left: '50%', 
            background: toast.type === 'error' ? '#ef4444' : '#10b981', 
            color: '#fff', padding: '1rem 2rem', borderRadius: '8px', 
            fontWeight: 800, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', 
            zIndex: 9999, display: 'flex', alignItems: 'center', gap: '0.75rem',
            fontSize: '0.9rem'
          }}
        >
          {toast.type === 'success' ? <Icons.Check /> : <Icons.Overview />}
          {toast.message}
        </motion.div>
      )}
      {/* Resource Utilization Modal */}
      <AnimatePresence>
        {resourceUtilModalProject && (() => {
          const p = resourceUtilModalProject;
          const implRes = p.implementation_resources || p.kpis?.implementation_resources || [];
          return (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                style={{ background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '1000px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}
              >
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>{p.name}</h2>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem', fontWeight: 600 }}>RESOURCE UTILIZATION BREAKDOWN</div>
                  </div>
                  <button onClick={() => setResourceUtilModalProject(null)} style={{ background: '#e2e8f0', color: '#475569', border: 'none', padding: '0.4rem', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
                </div>
                
                {(() => {
                  let totalExpected = 0;
                  let totalActual = 0;
                  let totalIndividuals = 0;

                  implRes.forEach(r => {
                      const sd = r.start_date ? new Date(r.start_date) : null;
                      let expectedPct = 0;
                      if (sd && r.Months > 0) {
                          const elapsedDays = (new Date() - sd) / (1000 * 60 * 60 * 24);
                          expectedPct = Math.min(100, (elapsedDays / 30.0 / r.Months) * 100);
                      }
                      if (r.individuals) {
                          r.individuals.forEach(ind => {
                              totalExpected += expectedPct;
                              totalActual += ind.actual_pct || 0;
                              totalIndividuals++;
                          });
                      }
                  });

                  let avgExpected = totalIndividuals > 0 ? parseFloat((totalExpected / totalIndividuals).toFixed(1)) : 0;
                  let avgActual = totalIndividuals > 0 ? parseFloat((totalActual / totalIndividuals).toFixed(1)) : 0;
                  let variance = parseFloat((avgActual - avgExpected).toFixed(1));
                  let isProfit = variance >= 0;
                  let statusText = isProfit ? "a net positive (profit/ahead of schedule)" : "a net negative (loss/behind schedule)";
                  
                  return totalIndividuals > 0 ? (
                    <div style={{ padding: '1rem 1.5rem', background: isProfit ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)', borderBottom: `1px solid ${isProfit ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '0.85rem', color: '#334155', lineHeight: '1.5', flex: 1 }}>
                          The project has reached <strong>{avgActual}%</strong> completion based on an expected timeline of <strong>{avgExpected}%</strong>. 
                          Overall, the average variance is <strong style={{ color: isProfit ? '#10b981' : '#ef4444' }}>{variance > 0 ? '+' : ''}{variance}%</strong>, which indicates this project is currently <strong>{statusText}</strong>.
                        </div>
                        <div style={{ display: 'flex', gap: '1.5rem', marginLeft: '1rem', background: '#fff', padding: '0.75rem 1rem', borderRadius: '8px', border: `1px solid ${isProfit ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.55rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Avg Expected</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#475569' }}>{avgExpected}%</div>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.55rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Avg Actual</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>{avgActual}%</div>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.55rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Avg Variance</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: isProfit ? '#10b981' : '#ef4444' }}>{variance > 0 ? '+' : ''}{variance}%</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null;
                })()}

                <div style={{ padding: '1.5rem', overflowY: 'auto' }}>
                  {implRes.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b', fontSize: '0.85rem' }}>No implementation resources assigned.</div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                          <th style={{ padding: '0.5rem', textAlign: 'left', color: '#475569', fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase' }}>Resource Name</th>
                          <th style={{ padding: '0.5rem', textAlign: 'left', color: '#475569', fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase' }}>Person Name</th>
                          <th style={{ padding: '0.5rem', textAlign: 'center', color: '#475569', fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase' }}>Planned</th>
                          <th style={{ padding: '0.5rem', textAlign: 'center', color: '#475569', fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase' }}>Expected %</th>
                          <th style={{ padding: '0.5rem', textAlign: 'center', color: '#475569', fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase' }}>Actual %</th>
                          <th style={{ padding: '0.5rem', textAlign: 'center', color: '#475569', fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase' }}>Variance %</th>
                          <th style={{ padding: '0.5rem', textAlign: 'left', color: '#475569', fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase' }}>Start Date</th>
                          <th style={{ padding: '0.5rem', textAlign: 'left', color: '#475569', fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase' }}>Expected End</th>
                          <th style={{ padding: '0.5rem', textAlign: 'left', color: '#475569', fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase' }}>Actual End</th>
                          <th style={{ padding: '0.5rem', textAlign: 'center', color: '#475569', fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {implRes.flatMap((r, i) => {
                          const sd = r.start_date ? new Date(r.start_date) : null;
                          let expectedEndDateStr = '—';
                          let expectedPct = 0;
                          if (sd && r.Months > 0) {
                              const e = new Date(sd); e.setMonth(e.getMonth() + r.Months); expectedEndDateStr = e.toISOString().split('T')[0];
                              const elapsedDays = (new Date() - sd) / (1000 * 60 * 60 * 24);
                              expectedPct = Math.min(100, (elapsedDays / 30.0 / r.Months) * 100);
                          }
                          
                          if (!r.individuals || r.individuals.length === 0) {
                              return [(
                                <tr key={`cat-${i}`} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                  <td style={{ padding: '0.75rem 0.5rem', fontWeight: 700, color: '#0f172a' }}>{r['Resource Name']}</td>
                                  <td style={{ padding: '0.75rem 0.5rem', color: '#94a3b8', fontStyle: 'italic' }}>Pending Assign</td>
                                  <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center', color: '#475569' }}>{r.Months || 0} Mo</td>
                                  <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center', color: '#94a3b8' }}>—</td>
                                  <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center', color: '#94a3b8' }}>—</td>
                                  <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center', color: '#94a3b8' }}>—</td>
                                  <td style={{ padding: '0.75rem 0.5rem', color: '#94a3b8' }}>—</td>
                                  <td style={{ padding: '0.75rem 0.5rem', color: '#94a3b8' }}>—</td>
                                  <td style={{ padding: '0.75rem 0.5rem', color: '#94a3b8' }}>—</td>
                                  <td style={{ padding: '0.75rem 0.5rem', color: '#94a3b8' }}>
                                    <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 800, fontSize: '0.65rem', background: '#f1f5f9', color: '#94a3b8' }}>PENDING ASSIGNMENT</span>
                                  </td>
                                </tr>
                              )];
                          } else {
                              return r.individuals.map((ind, indIdx) => {
                                  let dynStatus = 'Ahead of Schedule';
                                  if (ind.actual_pct >= expectedPct) dynStatus = 'Ahead of Schedule';
                                  else if (ind.actual_pct >= (expectedPct - 10)) dynStatus = 'At Risk';
                                  else dynStatus = 'Behind Schedule';
                                  const statusColor = dynStatus === 'Behind Schedule' ? '#ef4444' : dynStatus === 'At Risk' ? '#f59e0b' : '#10b981';
                                  const dynVar = parseFloat((ind.actual_pct - expectedPct).toFixed(1));
                                  return (
                                    <tr key={`ind-${i}-${indIdx}`} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                      <td style={{ padding: '0.6rem 0.5rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap' }}>{indIdx === 0 ? r['Resource Name'] : ''}</td>
                                      <td style={{ padding: '0.6rem 0.5rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap' }}>{ind.name}</td>
                                      <td style={{ padding: '0.6rem 0.5rem', textAlign: 'center', color: '#475569', whiteSpace: 'nowrap' }}>{indIdx === 0 ? (r.Months || 0) + ' Mo' : ''}</td>
                                      <td style={{ padding: '0.6rem 0.5rem', textAlign: 'center', color: '#475569', fontWeight: 600, whiteSpace: 'nowrap' }}>{expectedPct.toFixed(1)}%</td>
                                      <td style={{ padding: '0.6rem 0.5rem', textAlign: 'center', color: '#0f172a', fontWeight: 800, whiteSpace: 'nowrap' }}>{ind.actual_pct}%</td>
                                      <td style={{ padding: '0.6rem 0.5rem', textAlign: 'center', color: dynVar < 0 ? '#ef4444' : '#10b981', fontWeight: 700, whiteSpace: 'nowrap' }}>{dynVar > 0 ? '+' : ''}{dynVar}%</td>
                                      <td style={{ padding: '0.6rem 0.5rem', color: '#059669', whiteSpace: 'nowrap' }}>{indIdx === 0 && sd ? sd.toISOString().split('T')[0] : (indIdx === 0 ? '—' : '')}</td>
                                      <td style={{ padding: '0.6rem 0.5rem', color: '#475569', whiteSpace: 'nowrap' }}>{indIdx === 0 ? expectedEndDateStr : ''}</td>
                                      <td style={{ padding: '0.6rem 0.5rem', color: '#475569', whiteSpace: 'nowrap' }}>{indIdx === 0 ? (r.actual_end_date || '—') : ''}</td>
                                      <td style={{ padding: '0.6rem 0.5rem', textAlign: 'center', whiteSpace: 'nowrap' }}>
                                        <span style={{ 
                                          background: `${statusColor}22`,
                                          color: statusColor,
                                          padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 800, fontSize: '0.65rem'
                                        }}>
                                          {dynStatus}
                                        </span>
                                      </td>
                                    </tr>
                                  );
                              });
                          }
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
                <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #e2e8f0', background: '#f8fafc', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button onClick={() => setResourceUtilModalProject(null)} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '0.5rem 1.5rem', borderRadius: '6px', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', boxShadow: '0 2px 4px rgba(59,130,246,0.2)' }}>Close Panel</button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
