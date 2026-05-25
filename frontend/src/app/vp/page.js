"use client";
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area, 
  ComposedChart
} from 'recharts';
import './vp.css';

const API = 'http://127.0.0.1:8000';
const tok = () => localStorage.getItem('token');

// --- MOTION VARIANTS ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } }
};

const itemVariants = {
  hidden: { y: 15, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 120 } }
};

const Icons = {
  Check: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>,
  Refresh: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"></path><polyline points="21 3 21 8 16 8"></polyline></svg>,
  Alert: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>,
  Close: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
  Zap: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>,
  Logout: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>,
  Search: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>,
  Upload: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>,
  Clock: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>,
  Shield: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>,
  Bell: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>,
  CloudDownload: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>,
  GitPull: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="18" cy="18" r="3"></circle><circle cx="6" cy="6" r="3"></circle><path d="M13 6h3a2 2 0 0 1 2 2v7"></path><line x1="6" y1="9" x2="6" y2="21"></line></svg>,
  Cpu: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="15" x2="23" y2="15"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="15" x2="4" y2="15"></line></svg>
};

// --- COMMAND SELECTOR ---
const CommandSelector = ({ projects, selectedId, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const cleanProjects = useMemo(() => {
    return projects.filter(p => p.name !== 'oo').map(p => ({
      ...p,
      displayName: p.name && p.name !== 'oo' ? p.name : (p.po_reference || `Project ${p.id}`)
    }));
  }, [projects]);

  const selected = cleanProjects.find(p => p.id === selectedId) || cleanProjects[0];

  return (
    <div className="command-selector">
      <div className="command-trigger" onClick={() => setIsOpen(!isOpen)}>
        <div>
          <div style={{ fontSize: '0.6rem', color: '#8896ab', fontWeight: 800 }}>ACTIVE PROJECT SELECTOR</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 950 }}>{selected?.displayName || 'SELECT PROJECT'}</div>
        </div>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
      </div>

      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="command-panel" style={{ zIndex: 1000 }}>
            <div className="group-label">Executing Projects</div>
            {cleanProjects.map(p => (
              <div key={p.id} className={`project-item-card ${selectedId === p.id ? 'selected' : ''}`} onClick={() => { onSelect(p.id); setIsOpen(false); }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 900 }}>{p.displayName}</span>
                  <span className="vp-status-pill vp-glow-green" style={{ fontSize: '0.5rem' }}>{p.status || 'Active'}</span>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function VPDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('COCKPIT');
  const [projects, setProjects] = useState([]);
  const [cockpitSummary, setCockpitSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  // Platform Telemetry Observability
  const [telemetry, setTelemetry] = useState({
     status: 'healthy',
     database_circuit: 'CLOSED',
     api_latency: '4.8ms',
     telemetry_status: 'ACTIVE'
  });

  // Multi-Level Filtering Systems
  const [regionFilter, setRegionFilter] = useState('GLOBAL');
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [resourceIntelligence, setResourceIntelligence] = useState([]);

  // Phase 4 Predictive Operations States
  const [predictions, setPredictions] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [copilotNarrative, setCopilotNarrative] = useState(null);
  const [triggeringWorker, setTriggeringWorker] = useState(false);

  // Phase 6 Multi-Tenant SaaS States
  const [tenants, setTenants] = useState([]);
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [onboardCompName, setOnboardCompName] = useState('');
  const [onboardDomain, setOnboardDomain] = useState('');
  const [onboardEmail, setOnboardEmail] = useState('');
  const [onboardPassword, setOnboardPassword] = useState('');
  const [onboardPlan, setOnboardPlan] = useState('STARTER');
  
  // Custom branding states
  const [whiteLabelColor, setWhiteLabelColor] = useState('#00ffd1');
  const [whiteLabelLogo, setWhiteLabelLogo] = useState('');

  // Phase 7 Sandbox Demo states
  const [resettingDemo, setResettingDemo] = useState(false);
  
  // Extension keys (Objective 6)
  const [jiraWebhook, setJiraWebhook] = useState('https://jira.arche.global/hooks/pmo');
  const [slackWebhook, setSlackWebhook] = useState('https://hooks.slack.com/services/T000/B000');

  // Workflows states
  const [workflows, setWorkflows] = useState([]);
  const [showWorkflowCreateModal, setShowWorkflowCreateModal] = useState(false);
  const [newWorkflowType, setNewWorkflowType] = useState('PROJECT_APPROVAL');
  const [newWorkflowComments, setNewWorkflowComments] = useState('');
  const [workflowSlaHours, setWorkflowSlaHours] = useState('24');

  // Notifications Alert Center
  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  // Milestones
  const [milestones, setMilestones] = useState([]);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [newMilestoneName, setNewMilestoneName] = useState('');
  const [newMilestoneDueDate, setNewMilestoneDueDate] = useState('');

  // RIDE Governance
  const [rideItems, setRideItems] = useState([]);

  const triggerNav = (path) => {
     setActiveTab(path);
  };

  const fetchTelemetryHealth = async () => {
     try {
        const start = performance.now();
        const res = await fetch(`${API}/healthz`);
        const duration = (performance.now() - start).toFixed(1);
        if (res.ok) {
           const data = await res.json();
           setTelemetry({
              status: data.status,
              database_circuit: data.database_circuit,
              api_latency: `${duration}ms`,
              telemetry_status: 'ACTIVE'
           });
        }
     } catch (e) {
        setTelemetry(prev => ({ ...prev, status: 'unhealthy', database_circuit: 'OPEN/CRITICAL' }));
     }
  };

  const fetchTenantsList = async () => {
     try {
        const res = await fetch(`${API}/saas/tenants`, {
           headers: { Authorization: `Bearer ${tok()}` }
        });
        if (res.ok) setTenants(await res.json());
     } catch (e) { console.error(e); }
  };

  const fetchAll = async () => {
    const h = { Authorization: `Bearer ${tok()}` };
    try {
      const [pRes, cRes, wRes, nRes] = await Promise.all([
        fetch(`${API}/vp/projects?region=${regionFilter}`, { headers: h }),
        fetch(`${API}/vp/dashboard/summary?region=${regionFilter}`, { headers: h }),
        fetch(`${API}/vp/workflows`, { headers: h }),
        fetch(`${API}/vp/notifications`, { headers: h })
      ]);
      const pData = await pRes.json();
      const cData = await cRes.json();
      const wData = await wRes.json();
      const nData = await nRes.json();

      if (Array.isArray(pData)) {
        setProjects(pData);
        if (pData.length > 0) {
          const currentId = selectedProjectId || pData[0].id;
          setSelectedProjectId(currentId);
          fetchPredictiveOperationalData(currentId);
        }
      }
      if (cData && !cData.detail) setCockpitSummary(cData);
      if (Array.isArray(wData)) setWorkflows(wData);
      if (nData && !nData.detail) {
        setNotifications(nData.notifications || []);
        setUnreadNotifCount(nData.unread_count || 0);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchPredictiveOperationalData = async (id) => {
    if (!id) return;
    const h = { Authorization: `Bearer ${tok()}` };
    try {
      const [predRes, recRes, copRes, milRes, rideRes] = await Promise.all([
        fetch(`${API}/vp/predictive/project/${id}`, { headers: h }),
        fetch(`${API}/vp/predictive/recommendations/${id}`, { headers: h }),
        fetch(`${API}/vp/predictive/copilot-narrative/${id}`, { headers: h }),
        fetch(`${API}/vp/projects/${id}/milestones`, { headers: h }),
        fetch(`${API}/vp/projects/${id}/ride`, { headers: h })
      ]);
      if (predRes.ok) setPredictions(await predRes.json());
      if (recRes.ok) setRecommendations(await recRes.json());
      if (copRes.ok) setCopilotNarrative(await copRes.json());
      if (milRes.ok) setMilestones(await milRes.json());
      if (rideRes.ok) setRideItems(await rideRes.json());
    } catch (e) { console.error(e); }
  };

  const fetchResourceIntelligence = async () => {
    try {
      const res = await fetch(`${API}/vp/resource-intelligence`, {
        headers: { Authorization: `Bearer ${tok()}` }
      });
      if (res.ok) setResourceIntelligence(await res.json());
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchAll();
    fetchResourceIntelligence();
    fetchTelemetryHealth();
    fetchTenantsList();

    const interval = setInterval(() => {
      fetchAll();
      fetchTelemetryHealth();
      fetchTenantsList();
      if (selectedProjectId) {
         fetchPredictiveOperationalData(selectedProjectId);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [regionFilter]);

  useEffect(() => {
    if (selectedProjectId) {
      fetchPredictiveOperationalData(selectedProjectId);
    }
  }, [selectedProjectId]);

  // Dynamic Demo Reset Utility (SaaS Objective 1)
  const handleResetSandboxDemo = async () => {
     setResettingDemo(true);
     try {
        const res = await fetch(`${API}/saas/demo-reset`, {
           method: 'POST'
        });
        if (res.ok) {
           alert("Commercial Demo Sandbox environment successfully reset!");
           fetchAll();
           fetchTelemetryHealth();
           fetchTenantsList();
           if (selectedProjectId) fetchPredictiveOperationalData(selectedProjectId);
        }
     } catch (e) { console.error(e); }
     finally { setResettingDemo(false); }
  };

  // Onboard new tenant (SaaS Objective 2)
  const handleOnboardTenant = async (e) => {
     e.preventDefault();
     try {
        const res = await fetch(`${API}/saas/onboard`, {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({
              company_name: onboardCompName,
              domain: onboardDomain,
              admin_email: onboardEmail,
              admin_password: onboardPassword,
              plan_type: onboardPlan
           })
        });
        if (res.ok) {
           alert("SaaS corporate tenant provisioned successfully!");
           setShowOnboardModal(false);
           setOnboardCompName('');
           setOnboardDomain('');
           setOnboardEmail('');
           setOnboardPassword('');
           fetchTenantsList();
        } else {
           const err = await res.json();
           alert(err.detail || "Onboarding failed.");
        }
     } catch (e) { alert("Provisioning gateway timeout."); }
  };

  const handleUpdateBranding = async (tenantId) => {
     try {
        const res = await fetch(`${API}/saas/tenant/${tenantId}/branding`, {
           method: 'PUT',
           headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` },
           body: JSON.stringify({ logo_url: whiteLabelLogo, theme_color: whiteLabelColor })
        });
        if (res.ok) {
           alert("White-Label theme parameters updated!");
           fetchTenantsList();
        }
     } catch (e) { console.error(e); }
  };

  const handleSimulateUsage = async (tenantId) => {
     try {
        const res = await fetch(`${API}/saas/tenant/${tenantId}/simulate-usage?api_inc=250&notif_inc=30`, {
           method: 'POST'
        });
        if (res.ok) {
           fetchTenantsList();
        }
     } catch (e) { console.error(e); }
  };

  // Actions
  const handleMarkNotificationsRead = async () => {
    try {
      await fetch(`${API}/vp/notifications/read-all`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tok()}` }
      });
      setUnreadNotifCount(0);
      fetchAll();
    } catch (e) { console.error(e); }
  };

  const handleCreateWorkflow = async (e) => {
    e.preventDefault();
    if (!selectedProjectId) return;
    const proj = projects.find(p => p.id === selectedProjectId);
    try {
      const res = await fetch(`${API}/vp/workflows`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` },
        body: JSON.stringify({
          type: newWorkflowType,
          project_id: selectedProjectId,
          project_name: proj?.name || "DigiTrac Project",
          comments: newWorkflowComments,
          sla_hours: parseInt(workflowSlaHours),
          total_levels: 2
        })
      });
      if (res.ok) {
        alert("Workflow approval process initiated!");
        setShowWorkflowCreateModal(false);
        setNewWorkflowComments('');
        fetchAll();
      }
    } catch (e) { console.error(e); }
  };

  const handleWorkflowAction = async (instanceId, action, comments) => {
     try {
       const res = await fetch(`${API}/vp/workflows/${instanceId}/action`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` },
         body: JSON.stringify({ action, comments })
       });
       if (res.ok) {
         alert(`Workflow step ${action} success!`);
         fetchAll();
       }
     } catch (e) { console.error(e); }
  };

  const handleCreateMilestone = async (e) => {
    e.preventDefault();
    if (!selectedProjectId) return;
    try {
      const res = await fetch(`${API}/vp/projects/${selectedProjectId}/milestones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` },
        body: JSON.stringify({
          name: newMilestoneName,
          due_date: newMilestoneDueDate,
          status: 'PENDING'
        })
      });
      if (res.ok) {
        setShowMilestoneModal(false);
        setNewMilestoneName('');
        setNewMilestoneDueDate('');
        fetchPredictiveOperationalData(selectedProjectId);
      }
    } catch (e) { console.error(e); }
  };

  const handleUpdateMilestoneStatus = async (milestoneId, newStatus) => {
     try {
       await fetch(`${API}/vp/projects/${selectedProjectId}/milestones/${milestoneId}`, {
         method: 'PUT',
         headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` },
         body: JSON.stringify({ status: newStatus })
       });
       fetchPredictiveOperationalData(selectedProjectId);
     } catch (e) { console.error(e); }
  };

  const handleTriggerNightlyWorker = async () => {
     setTriggeringWorker(true);
     try {
        const res = await fetch(`${API}/vp/predictive/trigger-nightly-recalc`, {
           method: 'POST',
           headers: { Authorization: `Bearer ${tok()}` }
        });
        if (res.ok) {
           alert("Async Background sweep task queued! Recalculating forecasts...");
           fetchAll();
           if (selectedProjectId) fetchPredictiveOperationalData(selectedProjectId);
        }
     } catch (e) { console.error(e); }
     finally { setTriggeringWorker(false); }
  };

  if (loading) return <div style={{ minHeight: '100vh', background: '#05070a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}><h4>Loading SaaS command deck...</h4></div>;

  return (
    <div className="vp-dashboard">
      {/* Sidebar Navigation */}
      <aside className="vp-sidebar tactical-border">
        <div style={{ marginBottom: '2rem', padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0 0.5rem', marginBottom: '2rem' }}>
            <div style={{ width: 40, height: 40, border: '2px solid rgba(0,255,200,0.3)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
               <svg width="20" height="20" viewBox="0 0 100 100" fill={whiteLabelColor}>
                  <path d="M50 20 C45 20 40 25 35 35 L20 70 C18 75 22 80 28 78 C35 75 45 70 50 70 C55 70 65 75 72 78 C78 80 82 75 80 70 L65 35 C60 25 55 20 50 20 Z" />
               </svg>
            </div>
            <div>
              <div style={{ fontSize: '1.2rem', fontWeight: 950, margin: 0, letterSpacing: '-0.02em', background: 'linear-gradient(to bottom, #fff 50%, rgba(0,255,200,0.4))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1 }}>DIGITRAC</div>
              <div style={{ fontSize: '0.5rem', fontWeight: 900, color: whiteLabelColor, letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: '0.2rem' }}>COMMERCIAL SAAS</div>
            </div>
          </div>
        </div>

        <div className="vp-nav-group-label">Predictive Cockpit</div>
        <nav>
          {[
            { id: 'COCKPIT', label: 'Executive Cockpit', icon: <Icons.Zap /> },
            { id: 'WORKFLOWS', label: 'Workflow Board', icon: <Icons.GitPull /> },
            { id: 'PROJECT_LIFECYCLE', label: 'Lifecycle Governance', icon: <Icons.Clock /> },
            { id: 'RESOURCE_CAPACITY', label: 'Capacity Planner', icon: <Icons.Cpu /> },
            { id: 'AI_COPILOT', label: 'AI Governance Copilot', icon: <Icons.Cpu /> },
            { id: 'SAAS_ADMIN', label: 'SaaS Tenant Console', icon: <Icons.Shield /> },
            { id: 'SAAS_COMMERCE', label: 'SaaS Billing & SLAs', icon: <Icons.Zap /> },
            { id: 'COMPLIANCE', label: 'Compliance Audit', icon: <Icons.Shield /> }
          ].map((item) => (
            <div key={item.id} className={`vp-nav-item ${activeTab === item.id ? 'active' : ''}`} onClick={() => triggerNav(item.id)}>
              <span style={{ opacity: 0.8 }}>{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </nav>

        <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: 'auto' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', border: `1px solid ${whiteLabelColor}`, padding: '2px' }}>
                 <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: `linear-gradient(45deg, ${whiteLabelColor}, #3b82f6)` }} />
              </div>
              <div style={{ flex: 1 }}>
                 <div style={{ fontSize: '0.7rem', fontWeight: 900, color: '#fff' }}>EXECUTIVE VP</div>
                 <div style={{ fontSize: '0.55rem', color: '#8896ab' }}>vp@arche.global</div>
              </div>
           </div>
           <button 
             onClick={() => { localStorage.clear(); router.push('/'); }}
             className="vp-select"
             style={{ width: '100%', padding: '0.5rem', background: 'rgba(255, 68, 68, 0.05)', color: '#ff4444', border: '1px solid rgba(255, 68, 68, 0.1)', fontSize: '0.65rem', fontWeight: 800 }}
           >
             <Icons.Logout /> DEACTIVATE SESSION
           </button>
        </div>
      </aside>

      {/* Main Panel */}
      <main className="vp-main">
        {/* Observability Telemetry Live Ticker Banner */}
        <div style={{ display: 'flex', gap: '1.5rem', background: 'rgba(0, 255, 209, 0.04)', border: '1px solid rgba(0, 255, 209, 0.15)', borderRadius: '8px', padding: '0.5rem 1rem', fontSize: '0.6rem', color: '#00ffd1', fontWeight: 900, marginBottom: '1.25rem', justifyContent: 'space-between', alignItems: 'center' }}>
           <div style={{ display: 'flex', gap: '1.25rem' }}>
              <span>SYSTEM STATE: <strong style={{ color: '#fff' }}>{telemetry.status.toUpperCase()}</strong></span>
              <span>DATABASE CIRCUIT: <strong style={{ color: '#fff' }}>{telemetry.database_circuit}</strong></span>
              <span>API LATENCY: <strong style={{ color: '#fff' }}>{telemetry.api_latency}</strong></span>
              <span>SLA GUARANTEE: <strong style={{ color: '#00ffd1' }}>99.99%</strong></span>
           </div>
           
           {/* Dynamic Sandbox Reset Button (SaaS Objective 1) */}
           <button 
             disabled={resettingDemo}
             onClick={handleResetSandboxDemo}
             style={{ background: '#ef4444', border: 'none', color: '#fff', fontSize: '0.55rem', fontWeight: 950, padding: '0.2rem 0.5rem', borderRadius: '4px', cursor: 'pointer', boxShadow: '0 0 8px rgba(239, 68, 68, 0.3)' }}
           >
              {resettingDemo ? 'RESETTING SANDBOX...' : '⚡ RESET SANDBOX DEMO ENVIRONMENT'}
           </button>
        </div>

        {/* Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', background: 'rgba(255,255,255,0.01)', padding: '1rem 2rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.04)' }}>
           <div>
              <div style={{ fontSize: '0.6rem', color: '#00ffd1', fontWeight: 900, letterSpacing: '0.1em' }}>ARCHE GLOBAL DELIVERY INTELLIGENCE</div>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 950, margin: 0, color: '#fff' }}>TACTICAL Operations cockpit</h1>
           </div>
           
           <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', position: 'relative' }}>
              <CommandSelector projects={projects} selectedId={selectedProjectId} onSelect={setSelectedProjectId} />

              {/* Glowing notification bell */}
              <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setShowNotifDropdown(!showNotifDropdown)}>
                 <div style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icons.Bell />
                    {unreadNotifCount > 0 && (
                       <span style={{ position: 'absolute', top: -2, right: -2, background: '#ef4444', color: '#fff', fontSize: '0.55rem', fontWeight: 950, width: 14, height: 14, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 8px #ef4444' }}>
                          {unreadNotifCount}
                       </span>
                    )}
                 </div>

                 <AnimatePresence>
                    {showNotifDropdown && (
                       <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="notif-dropdown vp-glass" style={{ position: 'absolute', right: 0, top: 45, width: '320px', zIndex: 1100, padding: '1rem', border: '1px solid rgba(255,255,255,0.1)' }} onClick={e => e.stopPropagation()}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.5rem' }}>
                             <span style={{ fontSize: '0.75rem', fontWeight: 900 }}>ALERT CENTER</span>
                             <button onClick={handleMarkNotificationsRead} style={{ background: 'none', border: 'none', color: '#00ffd1', fontSize: '0.6rem', fontWeight: 900, cursor: 'pointer' }}>Mark read</button>
                          </div>
                          <div style={{ maxHeight: '250px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                             {notifications.length === 0 ? (
                                <div style={{ fontSize: '0.65rem', color: '#8896ab', textAlign: 'center', padding: '1rem' }}>No open delivery warnings.</div>
                             ) : notifications.map((n, i) => (
                                <div key={i} style={{ background: n.is_read ? 'rgba(0,0,0,0)' : 'rgba(255,255,255,0.02)', padding: '0.5rem', borderRadius: '6px', borderLeft: `3px solid ${n.priority === 'CRITICAL' ? '#ef4444' : n.priority === 'WARNING' ? '#f59e0b' : '#3b82f6'}` }}>
                                   <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', fontWeight: 800 }}>
                                      <span style={{ color: n.priority === 'CRITICAL' ? '#ef4444' : '#fff' }}>{n.title}</span>
                                      <span style={{ opacity: 0.6 }}>{n.priority}</span>
                                   </div>
                                   <p style={{ fontSize: '0.58rem', color: '#8896ab', margin: '3px 0 0' }}>{n.message}</p>
                                </div>
                             ))}
                          </div>
                       </motion.div>
                    )}
                 </AnimatePresence>
              </div>
           </div>
        </header>

        <AnimatePresence mode="wait">
          {/* TAB 1: PREDICTIVE COCKPIT */}
          {activeTab === 'COCKPIT' && predictions && cockpitSummary && (
            <motion.div key="cockpit" variants={containerVariants} initial="hidden" animate="visible" exit={{ opacity: 0 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
                {[
                  { label: 'PREDICTIVE DELIVERY CONFIDENCE', value: `${predictions.delivery_confidence_pct}%`, sub: `Risk Level: ${predictions.risk_score}`, color: predictions.delivery_confidence_pct > 80 ? '#00ffd1' : predictions.delivery_confidence_pct > 60 ? '#FFB347' : '#ef4444' },
                  { label: 'SLA BREACH PROBABILITY', value: `${predictions.sla_breach_probability}%`, sub: 'Pending workflows breach probability', color: predictions.sla_breach_probability > 50 ? '#ef4444' : '#fff' },
                  { label: 'ESTIMATE AT COMPLETION (EAC)', value: predictions.eac === "CONFIDENTIAL_MASKED" ? "CONFIDENTIAL" : `₹${(predictions.eac/1e5).toFixed(1)}L`, sub: `Baseline: ₹${(predictions.baseline_budget/1e5).toFixed(1)}L`, color: '#3b82f6' },
                  { label: 'VARIANCE DRIFT', value: predictions.variance_drift === "CONFIDENTIAL_MASKED" ? "CONFIDENTIAL" : `₹${(predictions.variance_drift/1e5).toFixed(1)}L`, sub: 'Baseline cost overrun drift', color: predictions.variance_drift > 0 ? '#ef4444' : '#00ffd1' },
                  { label: 'WEEKLY BURN RATE', value: predictions.burn_rate_weekly === "CONFIDENTIAL_MASKED" ? "CONFIDENTIAL" : `₹${(predictions.burn_rate_weekly/1e5).toFixed(1)}L`, sub: `Exhaustion Target: ${predictions.predicted_exhaustion_date}`, color: '#a78bfa' }
                ].map((kpi, idx) => (
                  <motion.div key={idx} variants={itemVariants} className="vp-card vp-glass" style={{ borderTop: `3px solid ${kpi.color}` }}>
                     <div style={{ fontSize: '0.55rem', color: '#8896ab', fontWeight: 800 }}>{kpi.label}</div>
                     <div style={{ fontSize: '1.4rem', fontWeight: 950, color: kpi.color, margin: '0.25rem 0' }}>{kpi.value}</div>
                     <div style={{ fontSize: '0.55rem', opacity: 0.7 }}>{kpi.sub}</div>
                  </motion.div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                 <div className="vp-card vp-glass" style={{ height: '300px' }}>
                    <h3 style={{ fontSize: '0.8rem', fontWeight: 900, marginBottom: '1rem' }}>COST VARIANCE DRIFT FORECAST</h3>
                    <ResponsiveContainer width="100%" height="90%">
                       <ComposedChart data={[
                         { name: 'Approved Baseline Budget', value: predictions.baseline_budget === "CONFIDENTIAL_MASKED" ? 100 : predictions.baseline_budget },
                         { name: 'Estimated Cost Completion (EAC)', value: predictions.eac === "CONFIDENTIAL_MASKED" ? 120 : predictions.eac }
                       ]}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="name" stroke="#8896ab" fontSize={9} />
                          <YAxis stroke="#8896ab" fontSize={9} />
                          <Tooltip contentStyle={{ background: '#0b0f14', border: '1px solid rgba(255,255,255,0.1)' }} />
                          <Bar dataKey="value" barSize={40} fill="#6C63FF">
                             { [0, 1].map((entry, index) => (
                               <Cell key={`cell-${index}`} fill={index === 0 ? '#00ffd1' : '#ef4444'} />
                             )) }
                          </Bar>
                       </ComposedChart>
                    </ResponsiveContainer>
                 </div>

                 <div className="vp-card vp-glass">
                    <h3 style={{ fontSize: '0.8rem', fontWeight: 900, marginBottom: '0.75rem', color: '#00ffd1' }}>AI SMART STAFFING MATCHMAKER</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                       {recommendations?.optimal_allocations.length === 0 ? (
                         <div style={{ fontSize: '0.65rem', color: '#8896ab' }}>All project line slots have optimal resource assignments.</div>
                       ) : recommendations?.optimal_allocations.map((rec, idx) => (
                          <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', padding: '0.5rem', borderRadius: '6px', borderLeft: '3px solid #00ffd1' }}>
                             <div style={{ fontSize: '0.65rem', fontWeight: 900 }}>{rec.practice} - {rec.recommended_engineer}</div>
                             <div style={{ fontSize: '0.55rem', color: '#8896ab' }}>{rec.reason}</div>
                          </div>
                       ))}
                    </div>
                 </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.25rem' }}>
                 <div className="vp-card vp-glass">
                    <h3 style={{ fontSize: '0.85rem', fontWeight: 900, marginBottom: '1rem', color: '#ef4444' }}>⚠️ REVENUE LEAKAGE ALERT MATRIX</h3>
                    <table className="vp-table" style={{ fontSize: '0.7rem' }}>
                       <thead>
                          <tr>
                             <th>Engineer</th>
                             <th>Assigned Task</th>
                             <th>Variance Risk Explanation</th>
                          </tr>
                       </thead>
                       <tbody>
                          {recommendations?.leakage_warnings.length === 0 ? (
                            <tr><td colSpan={3} style={{ color: '#8896ab', textAlign: 'center' }}>Zero financial leakages detected in active matrix.</td></tr>
                          ) : recommendations?.leakage_warnings.map((w, idx) => (
                             <tr key={idx}>
                                <td style={{ fontWeight: 800 }}>{w.engineer}</td>
                                <td>{w.task}</td>
                                <td style={{ color: '#ef4444' }}>{w.reason}</td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>

                 <div className="vp-card vp-glass">
                    <h3 style={{ fontSize: '0.8rem', fontWeight: 900, marginBottom: '1rem' }}>PRACTICE PROFITABILITY LEADERBOARD</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                       {cockpitSummary.practice_summary.map((p, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', padding: '0.5rem', borderRadius: '6px' }}>
                             <span style={{ fontSize: '0.68rem', fontWeight: 800 }}>{p.name} SBU</span>
                             <span style={{ fontSize: '0.68rem', fontWeight: 900, color: '#00ffd1' }}>₹{(p.revenue/1e5).toFixed(1)}L Revenue</span>
                          </div>
                       ))}
                    </div>
                 </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: WORKFLOW BOARD */}
          {activeTab === 'WORKFLOWS' && (
            <motion.div key="workflows" variants={containerVariants} initial="hidden" animate="visible" exit={{ opacity: 0 }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 950, margin: 0 }}>WORKFLOW ORCHESTRATION</h2>
                  <button onClick={() => setShowWorkflowCreateModal(true)} style={{ background: '#00ffd1', border: 'none', color: '#000', padding: '0.6rem 1.2rem', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 900, cursor: 'pointer' }}>
                     + INITIATE APPROVAL WORKFLOW
                  </button>
               </div>

               <div className="vp-card vp-glass">
                  <table className="vp-table" style={{ fontSize: '0.72rem' }}>
                     <thead>
                        <tr>
                           <th>Workflow Type</th>
                           <th>Project</th>
                           <th>Initiator</th>
                           <th>Status</th>
                           <th style={{ textAlign: 'center' }}>SLA Target</th>
                           <th style={{ textAlign: 'center' }}>Current Level</th>
                           <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                     </thead>
                     <tbody>
                        {workflows.length === 0 ? (
                          <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#8896ab' }}>No approval workflows active.</td></tr>
                        ) : workflows.map((wf, idx) => (
                          <tr key={idx}>
                             <td style={{ fontWeight: 800 }}>
                                {wf.type.replace('_', ' ')}
                                {wf.is_escalated && <span className="vp-status-pill vp-pulse-red" style={{ fontSize: '0.5rem', marginLeft: '8px' }}>SLA BREACHED</span>}
                             </td>
                             <td>{wf.project_name}</td>
                             <td>{wf.initiator_email}</td>
                             <td>
                                <span className={`vp-status-pill ${wf.status === 'APPROVED' ? 'vp-glow-green' : wf.status === 'REJECTED' ? 'vp-pulse-red' : 'vp-glow-yellow'}`}>
                                   {wf.status}
                                </span>
                             </td>
                             <td style={{ textAlign: 'center' }}>{wf.sla_hours} hours</td>
                             <td style={{ textAlign: 'center', fontWeight: 800 }}>Level {wf.current_level} / {wf.total_levels}</td>
                             <td style={{ textAlign: 'right' }}>
                                {wf.status === 'PENDING' ? (
                                   <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                      <button onClick={() => handleWorkflowAction(wf.id, 'APPROVE', 'VP Sign-off committed.')} style={{ background: '#00ffd1', border: 'none', color: '#000', fontSize: '0.62rem', padding: '0.3rem 0.6rem', borderRadius: '4px', fontWeight: 900, cursor: 'pointer' }}>APPROVE</button>
                                      <button onClick={() => handleWorkflowAction(wf.id, 'REJECT', 'Rejected during VP governance audit.')} style={{ background: 'rgba(255, 68, 68, 0.1)', border: '1px solid #ff4444', color: '#ff4444', fontSize: '0.62rem', padding: '0.3rem 0.6rem', borderRadius: '4px', fontWeight: 900, cursor: 'pointer' }}>REJECT</button>
                                   </div>
                                ) : (
                                   <span style={{ fontSize: '0.65rem', color: '#8896ab' }}>Archived</span>
                                )}
                             </td>
                          </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </motion.div>
          )}

          {/* TAB 3: PROJECT LIFECYCLE */}
          {activeTab === 'PROJECT_LIFECYCLE' && (
            <motion.div key="lifecycle" variants={containerVariants} initial="hidden" animate="visible" exit={{ opacity: 0 }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 950, margin: 0 }}>PROJECT LIFECYCLE MONITORING</h2>
                  <button onClick={() => setShowMilestoneModal(true)} style={{ background: '#00ffd1', border: 'none', color: '#000', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 900, cursor: 'pointer' }}>
                     + ADD PROJECT MILESTONE
                  </button>
               </div>

               <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
                  <div className="vp-card vp-glass">
                     <h3 style={{ fontSize: '0.8rem', fontWeight: 900, marginBottom: '1rem' }}>LIFECYCLE STAGE GATES</h3>
                     {[
                       { stage: 'Initiation', desc: 'Pricing Matrix verification' },
                       { stage: 'Planning', desc: 'Approved financial baselines locked' },
                       { stage: 'Execution', desc: 'Operational resource logs & time bookings' },
                       { stage: 'Monitoring', desc: 'RIDE threat management & heatmaps' },
                       { stage: 'Closure', desc: 'Actual summary validations' }
                     ].map((s, idx) => {
                        const isActive = idx === 2;
                        return (
                           <div key={idx} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', opacity: isActive ? 1 : 0.4 }}>
                              <div style={{ width: '8px', background: isActive ? '#00ffd1' : 'rgba(255,255,255,0.1)', borderRadius: '4px' }} />
                              <div>
                                 <div style={{ fontSize: '0.75rem', fontWeight: 800 }}>{s.stage}</div>
                                 <div style={{ fontSize: '0.6rem', color: '#8896ab' }}>{s.desc}</div>
                              </div>
                           </div>
                        );
                     })}
                  </div>

                  <div className="vp-card vp-glass">
                     <h3 style={{ fontSize: '0.85rem', fontWeight: 900, marginBottom: '1rem' }}>PROJECT MILESTONES</h3>
                     <table className="vp-table" style={{ fontSize: '0.7' }}>
                        <thead>
                           <tr>
                              <th>Milestone Name</th>
                              <th>Due Date</th>
                              <th>Status</th>
                              <th style={{ textAlign: 'right' }}>Actions</th>
                           </tr>
                        </thead>
                        <tbody>
                           {milestones.length === 0 ? (
                             <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: '#8896ab' }}>No milestones logged.</td></tr>
                           ) : milestones.map((m, i) => (
                             <tr key={i}>
                                <td style={{ fontWeight: 800 }}>{m.name}</td>
                                <td>{m.due_date ? new Date(m.due_date).toLocaleDateString() : 'N/A'}</td>
                                <td>
                                   <span className={`vp-status-pill ${m.status === 'COMPLETED' ? 'vp-glow-green' : m.status === 'DELAYED' ? 'vp-pulse-red' : 'vp-glow-yellow'}`}>
                                      {m.status}
                                   </span>
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                   <select 
                                     className="vp-select" 
                                     style={{ fontSize: '0.6rem', padding: '0.2rem' }}
                                     value={m.status}
                                     onChange={e => handleUpdateMilestoneStatus(m.id, e.target.value)}
                                   >
                                      <option value="PENDING">PENDING</option>
                                      <option value="IN_PROGRESS">IN PROGRESS</option>
                                      <option value="COMPLETED">COMPLETED</option>
                                      <option value="DELAYED">DELAYED</option>
                                   </select>
                                </td>
                             </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </div>
            </motion.div>
          )}

          {/* TAB 4: RESOURCE CAPACITY */}
          {activeTab === 'RESOURCE_CAPACITY' && resourceIntelligence && (
            <motion.div key="capacity" variants={containerVariants} initial="hidden" animate="visible" exit={{ opacity: 0 }}>
               <h2 style={{ fontSize: '1.2rem', fontWeight: 950, marginBottom: '1.5rem' }}>RESOURCE CAPACITY INTELLIGENCE</h2>
               
               <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  <div className="vp-card vp-glass">
                     <h3 style={{ fontSize: '0.85rem', fontWeight: 900, marginBottom: '1rem' }}>MONTHLY CAPACITY HEATMAP GRID (REGIONAL PRESSURES)</h3>
                     <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px', textAlign: 'center' }}>
                        {[
                          { region: 'INDIA (IN)', load: '82%', c: 'rgba(0, 255, 209, 0.4)' },
                          { region: 'SINGAPORE (SG)', load: '94%', c: 'rgba(0, 255, 209, 0.7)' },
                          { region: 'UNITED STATES (US)', load: '115%', c: 'rgba(239, 68, 68, 0.8)' },
                          { region: 'UNITED KINGDOM (UK)', load: '68%', c: 'rgba(245, 158, 11, 0.4)' },
                          { region: 'MIDDLE EAST (ME)', load: '45%', c: 'rgba(59, 130, 246, 0.3)' },
                          { region: 'EUROPE (EU)', load: '74%', c: 'rgba(0, 255, 209, 0.3)' }
                        ].map((node, i) => (
                           <div key={i} style={{ background: node.c, padding: '1rem', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                              <span style={{ fontSize: '0.55rem', fontWeight: 800 }}>{node.region}</span>
                              <span style={{ fontSize: '1.2rem', fontWeight: 950 }}>{node.load}</span>
                           </div>
                        ))}
                     </div>
                  </div>

                  <div className="vp-card vp-glass">
                     <h3 style={{ fontSize: '0.85rem', fontWeight: 900, marginBottom: '1rem' }}>BENCH FORECASTING TRENDS</h3>
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem' }}>
                           <span>Cloud SBU Available Bench</span>
                           <span style={{ color: '#00ffd1', fontWeight: 900 }}>4 Engineers</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem' }}>
                           <span>Security SBU Available Bench</span>
                           <span style={{ color: '#00ffd1', fontWeight: 900 }}>2 Engineers</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem' }}>
                           <span>Digital SBU Available Bench</span>
                           <span style={{ color: '#FFB347', fontWeight: 900 }}>0 Engineers (Overloaded)</span>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="vp-card vp-glass">
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 950, marginBottom: '1rem' }}>FLEET ALLOCATIONS AND CAPACITY DEMAND</h3>
                  <table className="vp-table" style={{ fontSize: '0.72rem' }}>
                     <thead>
                        <tr>
                           <th>Emp ID</th>
                           <th>Resource Name</th>
                           <th>Role Practice</th>
                           <th>Utilization %</th>
                           <th>Allocation Status</th>
                        </tr>
                     </thead>
                     <tbody>
                        {resourceIntelligence.map((res, idx) => (
                           <tr key={idx}>
                              <td style={{ fontWeight: 800 }}>{res.employee_id || `EMP-${100+idx}`}</td>
                              <td>{res.name}</td>
                              <td style={{ color: '#3b82f6' }}>{res.role || 'Senior Consultant'}</td>
                              <td style={{ fontWeight: 950 }}>{res.utilization}%</td>
                              <td>
                                 <span className={`vp-status-pill ${res.utilization > 100 ? 'vp-pulse-red' : res.utilization >= 70 ? 'vp-glow-green' : 'vp-glow-yellow'}`}>
                                    {res.utilization > 100 ? 'Overloaded' : res.utilization >= 70 ? 'Allocated' : 'Bench'}
                                 </span>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </motion.div>
          )}

          {/* TAB 5: AI COPILOT */}
          {activeTab === 'AI_COPILOT' && copilotNarrative && (
            <motion.div key="copilot" variants={containerVariants} initial="hidden" animate="visible" exit={{ opacity: 0 }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 950, margin: 0 }}>AI GOVERNANCE COPILOT</h2>
                  <button onClick={() => { navigator.clipboard.writeText(copilotNarrative.copilot_text_summary); alert('Executive report copied to clipboard!'); }}
                     style={{ background: '#00ffd1', border: 'none', color: '#000', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 900, cursor: 'pointer' }}>
                     COPY EXECUTIVE REPORT
                  </button>
               </div>

               <div className="vp-card vp-glass" style={{ background: 'rgba(5,7,15,0.95)', border: '1px solid rgba(0,255,200,0.15)', boxShadow: '0 0 40px rgba(0,255,200,0.06)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.75rem' }}>
                     <Icons.Cpu />
                     <span style={{ fontSize: '0.8rem', fontWeight: 900, color: '#00ffd1' }}>DIGITRAC INTEL AGENT COPILOT V1</span>
                  </div>
                  
                  <pre style={{ fontFamily: 'Courier New, Courier, monospace', fontSize: '0.75rem', color: '#00ffc8', lineHeight: 1.5, whiteSpace: 'pre-wrap', margin: 0 }}>
                     {copilotNarrative.copilot_text_summary}
                  </pre>
               </div>
            </motion.div>
          )}

          {/* TAB 6: SAAS TENANT CONTROL CONSOLE */}
          {activeTab === 'SAAS_ADMIN' && (
            <motion.div key="saas-admin" variants={containerVariants} initial="hidden" animate="visible" exit={{ opacity: 0 }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 950, margin: 0 }}>SAAS TENANT ADMINISTRATION cockpit</h2>
                  <button onClick={() => setShowOnboardModal(true)} style={{ background: '#00ffd1', border: 'none', color: '#000', padding: '0.6rem 1.2rem', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 900, cursor: 'pointer' }}>
                     + PROVISION NEW CORPORATE TENANT
                  </button>
               </div>

               <div className="vp-card vp-glass" style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '0.85rem', fontWeight: 900, marginBottom: '1rem', color: '#00ffd1' }}>🎨 WHITE-LABEL PLATFORM BRANDING SETUP</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', alignItems: 'end' }}>
                     <div>
                        <label style={{ fontSize: '0.65rem', color: '#8896ab', display: 'block', marginBottom: '0.3rem' }}>THEME COLOR GAUGE HEX</label>
                        <input className="vp-select" style={{ width: '100%' }} value={whiteLabelColor} onChange={e => setWhiteLabelColor(e.target.value)} />
                     </div>
                     <div>
                        <label style={{ fontSize: '0.65rem', color: '#8896ab', display: 'block', marginBottom: '0.3rem' }}>CUSTOM BRAND LOGO URL</label>
                        <input className="vp-select" style={{ width: '100%' }} placeholder="https://..." value={whiteLabelLogo} onChange={e => setWhiteLabelLogo(e.target.value)} />
                     </div>
                     <button className="vp-select" style={{ background: '#00ffd1', border: 'none', color: '#000', fontWeight: 900 }} onClick={() => handleUpdateBranding(1)}>
                        APPLY WHITE-LABEL BRAND
                     </button>
                  </div>
               </div>

               <div className="vp-card vp-glass">
                  <h3 style={{ fontSize: '0.85rem', fontWeight: 900, marginBottom: '1rem' }}>GLOBAL REGISTERED TENANTS & METERED BILLING</h3>
                  <table className="vp-table" style={{ fontSize: '0.7rem' }}>
                     <thead>
                        <tr>
                           <th>Tenant Name</th>
                           <th>Custom Domain</th>
                           <th>Active Plan</th>
                           <th style={{ textAlign: 'center' }}>Metered API Calls</th>
                           <th style={{ textAlign: 'center' }}>Alerts Volume</th>
                           <th style={{ textAlign: 'center' }}>AI Inferences</th>
                           <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                     </thead>
                     <tbody>
                        {tenants.length === 0 ? (
                           <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#8896ab' }}>No external tenants provisioned.</td></tr>
                        ) : tenants.map((t, idx) => (
                           <tr key={idx}>
                              <td style={{ fontWeight: 800 }}>{t.name}</td>
                              <td style={{ color: '#3b82f6' }}>{t.domain}</td>
                              <td>
                                 <span className="vp-status-pill vp-glow-green" style={{ fontSize: '0.55rem' }}>{t.plan}</span>
                              </td>
                              <td style={{ textAlign: 'center', fontWeight: 900 }}>{t.api_calls}</td>
                              <td style={{ textAlign: 'center' }}>{t.notifications_volume}</td>
                              <td style={{ textAlign: 'center', color: '#00ffd1', fontWeight: 900 }}>{t.ai_inference_count}</td>
                              <td style={{ textAlign: 'right' }}>
                                 <button className="vp-select" style={{ fontSize: '0.6rem', padding: '0.2rem 0.5rem', background: 'rgba(0, 255, 209, 0.08)', color: '#00ffd1', border: 'none' }} onClick={() => handleSimulateUsage(t.id)}>
                                    ⚡ SIMULATE BILLABLE USE
                                 </button>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </motion.div>
          )}

          {/* TAB 7: SAAS BILLING, PRICING COMPARISONS & PLATFORM SLA TELEMETRY */}
          {activeTab === 'SAAS_COMMERCE' && (
             <motion.div key="saas-commerce" variants={containerVariants} initial="hidden" animate="visible" exit={{ opacity: 0 }}>
                
                {/* Platform SLA telemetry gauges (Objective 7) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                   {[
                     { label: 'PLATFORM UPTIME SLA', value: '99.98%', sub: 'Target SLA: 99.95%', color: '#00ffd1' },
                     { label: 'API AVAILABILITY', value: '100%', sub: 'Circuit Breaker: CLOSED', color: '#00ffd1' },
                     { label: 'REDIS QUEUE SPEED', value: '1.2ms', sub: 'Active workers: 4', color: '#3b82f6' },
                     { label: 'NOTIFICATION UPTIME', value: '99.8%', sub: 'Outlook delivery status: normal', color: '#a78bfa' }
                   ].map((sla, idx) => (
                      <div key={idx} className="vp-card vp-glass" style={{ borderTop: `3px solid ${sla.color}` }}>
                         <div style={{ fontSize: '0.55rem', color: '#8896ab', fontWeight: 800 }}>{sla.label}</div>
                         <div style={{ fontSize: '1.4rem', fontWeight: 950, color: sla.color, margin: '0.25rem 0' }}>{sla.value}</div>
                         <div style={{ fontSize: '0.55rem', opacity: 0.7 }}>{sla.sub}</div>
                      </div>
                   ))}
                </div>

                {/* SaaS Subscription Comparison Matrix (Objective 2 & 8) */}
                <div className="vp-card vp-glass" style={{ marginBottom: '1.5rem' }}>
                   <h3 style={{ fontSize: '0.9rem', fontWeight: 950, marginBottom: '1rem', color: '#00ffd1' }}>💰 SUBSCRIPTION LICENSING TIER MATRIX</h3>
                   <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
                      {[
                        { plan: 'STARTER', price: '₹4,999 / mo', users: 'Max 5 users', proj: 'Max 3 projects', desc: 'Best for local practices to initiate manpower bookings.' },
                        { plan: 'PROFESSIONAL', price: '₹19,999 / mo', users: 'Max 25 users', proj: 'Max 15 projects', desc: 'Premium stage gating, RIDE risk management logs, and capacity heatmaps.' },
                        { plan: 'ENTERPRISE', price: 'Contact Sales', users: 'Unlimited users', proj: 'Unlimited projects', desc: 'Full AI smart matchmaking, automated PMO copilot weekly reports, and metered billing API controls.' }
                      ].map((item, i) => (
                         <div key={i} style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.6rem', fontWeight: 900, color: '#8896ab' }}>{item.plan}</span>
                            <span style={{ fontSize: '1.3rem', fontWeight: 950 }}>{item.price}</span>
                            <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.05)' }} />
                            <div style={{ fontSize: '0.68rem', color: '#fff', fontWeight: 800 }}>{item.users}</div>
                            <div style={{ fontSize: '0.68rem', color: '#fff', fontWeight: 800 }}>{item.proj}</div>
                            <p style={{ fontSize: '0.62rem', color: '#8896ab', lineHeight: 1.4, margin: '5px 0 0' }}>{item.desc}</p>
                         </div>
                      ))}
                   </div>
                </div>

                {/* Third-party Webhook Integration config (Objective 6) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                   <div className="vp-card vp-glass">
                      <h3 style={{ fontSize: '0.85rem', fontWeight: 900, marginBottom: '1rem' }}>🔗 THIRD-PARTY INTEGRATION WEBHOOKS</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                         <div>
                            <label style={{ fontSize: '0.6rem', color: '#8896ab', display: 'block', marginBottom: '0.3rem' }}>JIRA CONNECTOR WEBHOOK</label>
                            <input className="vp-select" style={{ width: '100%' }} value={jiraWebhook} onChange={e => setJiraWebhook(e.target.value)} />
                         </div>
                         <div>
                            <label style={{ fontSize: '0.6rem', color: '#8896ab', display: 'block', marginBottom: '0.3rem' }}>SLACK CONNECTING WEBHOOK</label>
                            <input className="vp-select" style={{ width: '100%' }} value={slackWebhook} onChange={e => setSlackWebhook(e.target.value)} />
                         </div>
                         <button className="vp-select" style={{ background: '#00ffd1', border: 'none', color: '#000', fontWeight: 950 }} onClick={() => alert("Integration configurations successfully saved!")}>
                            SAVE CONNECTIONS
                         </button>
                      </div>
                   </div>

                   {/* Founder platform metrics MRR */}
                   <div className="vp-card vp-glass">
                      <h3 style={{ fontSize: '0.85rem', fontWeight: 900, marginBottom: '1rem', color: '#00ffd1' }}>📈 PLATFORM MRR & REVENUE FORECAST (Objective 10)</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                         <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                            <span>Monthly Recurring Revenue (MRR)</span>
                            <span style={{ color: '#00ffd1', fontWeight: 950 }}>₹3,45,000</span>
                         </div>
                         <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                            <span>Active Corporate Tenants Count</span>
                            <span style={{ fontWeight: 950 }}>6 Tenant Organizations</span>
                         </div>
                         <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                            <span>Average API calls per tenant</span>
                            <span style={{ fontWeight: 950 }}>11,300 API Calls / Mo</span>
                         </div>
                         <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                            <span>AI analytics usage volume</span>
                            <span style={{ color: '#3b82f6', fontWeight: 950 }}>135 Inferences</span>
                         </div>
                      </div>
                   </div>
                </div>

             </motion.div>
          )}

          {/* TAB 8: COMPLIANCE */}
          {activeTab === 'COMPLIANCE' && (
            <motion.div key="compliance" variants={containerVariants} initial="hidden" animate="visible" exit={{ opacity: 0 }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 950, margin: 0 }}>IMMUTABLE COMPLIANCE VAULT</h2>
                  
                  <button 
                    disabled={triggeringWorker} 
                    onClick={handleTriggerNightlyWorker}
                    style={{ background: triggeringWorker ? '#1a1a1a' : '#00ffd1', border: 'none', color: '#000', padding: '0.6rem 1.2rem', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 900, cursor: 'pointer' }}
                  >
                     {triggeringWorker ? 'RUNNING ASYNC FORECAST SWEEP...' : '⚙ RUN NIGHTLY RECALCULATIONS WORKER'}
                  </button>
               </div>
               
               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                  {[
                    { title: 'Audit Compliance Ledger', desc: 'Download complete field-by-field updates, timeline modifications, and baseline changes.', path: '/vp/compliance/export-audit' },
                    { title: 'RIDE Governance Reports', desc: 'Download portfolio-wide risk, issue, dependency, and escalation log sheets.', path: '/vp/compliance/export-governance' },
                    { title: 'Financial Snapshot Ledgers', desc: 'Download baseline project targets, actual spending values, and cost variances.', path: '/vp/compliance/export-financials' }
                  ].map((doc, idx) => (
                     <div key={idx} className="vp-card vp-glass" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <h3 style={{ fontSize: '0.9rem', fontWeight: 900, margin: 0, color: '#00ffd1' }}>{doc.title}</h3>
                        <p style={{ fontSize: '0.68rem', color: '#8896ab', lineHeight: 1.4, flex: 1 }}>{doc.desc}</p>
                        <a 
                           href={`${API}${doc.path}?token=${tok()}`} 
                           download
                           style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '0.75rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 800, textAlign: 'center', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                        >
                           <Icons.CloudDownload /> EXPORT SPREADSHEET (CSV)
                        </a>
                     </div>
                  ))}
               </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* SAAS ONBOARD MODAL */}
        {showOnboardModal && (
           <div className="vp-modal-overlay" onClick={() => setShowOnboardModal(false)}>
              <motion.div className="vp-modal-content vp-card vp-glass" style={{ width: 450 }} onClick={e => e.stopPropagation()}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 950, margin: 0 }}>PROVISION TENANT ORGANIZATION</h3>
                    <button onClick={() => setShowOnboardModal(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><Icons.Close /></button>
                 </div>
                 
                 <form onSubmit={handleOnboardTenant}>
                    <div style={{ marginBottom: '1rem' }}>
                       <label style={{ fontSize: '0.65rem', color: '#8896ab', display: 'block', marginBottom: '0.3rem' }}>COMPANY / ORGANIZATION NAME</label>
                       <input className="vp-select" style={{ width: '100%' }} value={onboardCompName} onChange={e => setOnboardCompName(e.target.value)} required />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                       <label style={{ fontSize: '0.65rem', color: '#8896ab', display: 'block', marginBottom: '0.3rem' }}>CUSTOM TENANT SUBDOMAIN</label>
                       <input className="vp-select" style={{ width: '100%' }} placeholder="client.digitrac.com" value={onboardDomain} onChange={e => setOnboardDomain(e.target.value)} required />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                       <label style={{ fontSize: '0.65rem', color: '#8896ab', display: 'block', marginBottom: '0.3rem' }}>ADMINISTRATOR EMAIL</label>
                       <input className="vp-select" style={{ width: '100%' }} type="email" value={onboardEmail} onChange={e => setOnboardEmail(e.target.value)} required />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                       <label style={{ fontSize: '0.65rem', color: '#8896ab', display: 'block', marginBottom: '0.3rem' }}>ADMIN SECURE PASSWORD</label>
                       <input className="vp-select" style={{ width: '100%' }} type="password" value={onboardPassword} onChange={e => setOnboardPassword(e.target.value)} required />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                       <label style={{ fontSize: '0.65rem', color: '#8896ab', display: 'block', marginBottom: '0.3rem' }}>LICENSING PLAN CATEGORY</label>
                       <select className="vp-select" style={{ width: '100%' }} value={onboardPlan} onChange={e => setOnboardPlan(e.target.value)}>
                          <option value="STARTER">STARTER</option>
                          <option value="PROFESSIONAL">PROFESSIONAL</option>
                          <option value="ENTERPRISE">ENTERPRISE</option>
                       </select>
                    </div>

                    <button className="vp-select" style={{ background: '#00ffd1', border: 'none', color: '#000', width: '100%', fontWeight: 900, padding: '1rem' }} type="submit">
                       ONBOARD & LAUNCH PROVISIONING
                    </button>
                 </form>
              </motion.div>
           </div>
        )}

        {/* WORKFLOW CREATE MODAL */}
        {showWorkflowCreateModal && (
           <div className="vp-modal-overlay" onClick={() => setShowWorkflowCreateModal(false)}>
              <motion.div className="vp-modal-content vp-card vp-glass" style={{ width: 450 }} onClick={e => e.stopPropagation()}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 950, margin: 0 }}>INITIATE APPROVAL PROCESS</h3>
                    <button onClick={() => setShowWorkflowCreateModal(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><Icons.Close /></button>
                 </div>
                 
                 <form onSubmit={handleCreateWorkflow}>
                    <div style={{ marginBottom: '1rem' }}>
                       <label style={{ fontSize: '0.65rem', color: '#8896ab', display: 'block', marginBottom: '0.3rem' }}>CHOOSE WORKFLOW CATEGORY</label>
                       <select className="vp-select" style={{ width: '100%' }} value={newWorkflowType} onChange={e => setNewWorkflowType(e.target.value)}>
                          <option value="PROJECT_APPROVAL">PROJECT APPROVAL</option>
                          <option value="BUDGET_APPROVAL">BUDGET APPROVAL</option>
                          <option value="RESOURCE_ALLOCATION">RESOURCE ALLOCATION</option>
                          <option value="ESCALATION_APPROVAL">ESCALATION APPROVAL</option>
                          <option value="CHANGE_REQUEST">CHANGE REQUEST</option>
                       </select>
                    </div>
                    
                    <div style={{ marginBottom: '1rem' }}>
                       <label style={{ fontSize: '0.65rem', color: '#8896ab', display: 'block', marginBottom: '0.3rem' }}>SLA BREACH TIMER TARGET (HOURS)</label>
                       <input className="vp-select" style={{ width: '100%' }} type="number" value={workflowSlaHours} onChange={e => setWorkflowSlaHours(e.target.value)} required />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                       <label style={{ fontSize: '0.65rem', color: '#8896ab', display: 'block', marginBottom: '0.3rem' }}>REASON / CHANGE COMMENTS</label>
                       <textarea className="vp-select" style={{ width: '100%', height: '80px', resize: 'none' }} placeholder="Provide justification context..." value={newWorkflowComments} onChange={e => setNewWorkflowComments(e.target.value)} required />
                    </div>

                    <button className="vp-select" style={{ background: '#00ffd1', border: 'none', color: '#000', width: '100%', fontWeight: 900, padding: '1rem' }} type="submit">
                       COMMIT & ROUTE WORKFLOW
                    </button>
                 </form>
              </motion.div>
           </div>
        )}

        {/* MILESTONE CREATE MODAL */}
        {showMilestoneModal && (
           <div className="vp-modal-overlay" onClick={() => setShowMilestoneModal(false)}>
              <motion.div className="vp-modal-content vp-card vp-glass" style={{ width: 400 }} onClick={e => e.stopPropagation()}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 950, margin: 0 }}>NEW MILESTONE</h3>
                    <button onClick={() => setShowMilestoneModal(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><Icons.Close /></button>
                 </div>
                 
                 <form onSubmit={handleCreateMilestone}>
                    <div style={{ marginBottom: '1rem' }}>
                       <label style={{ fontSize: '0.65rem', color: '#8896ab', display: 'block', marginBottom: '0.3rem' }}>MILESTONE TITLE</label>
                       <input className="vp-select" style={{ width: '100%' }} value={newMilestoneName} onChange={e => setNewMilestoneName(e.target.value)} required />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                       <label style={{ fontSize: '0.65rem', color: '#8896ab', display: 'block', marginBottom: '0.3rem' }}>DUE DATE</label>
                       <input className="vp-select" style={{ width: '100%' }} type="date" value={newMilestoneDueDate} onChange={e => setNewMilestoneDueDate(e.target.value)} required />
                    </div>

                    <button className="vp-select" style={{ background: '#00ffd1', border: 'none', color: '#000', width: '100%', fontWeight: 900, padding: '1rem' }} type="submit">
                       CREATE MILESTONE
                    </button>
                 </form>
              </motion.div>
           </div>
        )}
      </main>

      <style jsx global>{`
        .vp-status-pill { padding: 0.2rem 0.5rem; border-radius: 4px; font-weight: 900; font-size: 0.55rem; background: rgba(255,255,255,0.05); }
        .vp-modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(10px); z-index: 1000; display: flex; align-items: center; justify-content: center; }
        .vp-modal-content { box-shadow: 0 40px 100px rgba(0,0,0,0.8); max-width: 95vw; }
        @media (max-width: 768px) {
          .vp-dashboard { flex-direction: column !important; }
          .vp-sidebar { width: 100% !important; border-right: none !important; border-bottom: 1px solid rgba(255,255,255,0.05); }
        }
      `}</style>
    </div>
  );
}
