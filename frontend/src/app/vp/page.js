"use client";
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import './vp.css';

const Icons = {
  Overview: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>,
  Cube: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>,
  Users: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>,
  Check: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>,
  Lightning: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>,
  CheckSquare: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><polyline points="9 11 12 14 22 4"></polyline></svg>,
  Clock: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
};

export default function VPDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('DEPLOYMENT');
  const [selectedMission, setSelectedMission] = useState('sample(Sheet1)'); // Toggle between null and 'sample(Sheet1)'
  const [deploymentStep, setDeploymentStep] = useState(3);

  const navItems = [
    { id: 'OVERVIEW', label: 'OVERVIEW', sub: '72 ACTIVE', icon: <Icons.Overview /> },
    { id: 'PROJECT_INTELLIGENCE', label: 'PROJECT INTELLIGENCE', sub: 'DEEP DRILL', icon: <Icons.Cube /> },
    { id: 'RESOURCE_INTELLIGENCE', label: 'RESOURCE INTELLIGENCE', sub: '92% LOAD', icon: <Icons.Users /> },
    { id: 'DEPLOYMENT', label: 'DEPLOYMENT', sub: 'NEW MISSION', icon: <Icons.Check /> }
  ];

  return (
    <div className="vp-dashboard" style={{ background: '#0a0b10', minHeight: '100vh', display: 'flex', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
      
      {/* SIDEBAR */}
      <div className="vp-sidebar" style={{ width: '220px', background: '#050608', borderRight: '1px solid rgba(255,255,255,0.05)', padding: '1.5rem 0.5rem', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.25rem', marginTop: '1rem' }}>
          <div style={{ 
            fontSize: '1.5rem', 
            fontWeight: 900, 
            fontFamily: 'Arial Black, system-ui, -apple-system, sans-serif',
            background: 'linear-gradient(180deg, #ffffff 0%, #9ba3af 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.04em',
            marginBottom: '0.25rem',
            lineHeight: 1
          }}>
            DigiTrac
          </div>
          <div style={{ fontSize: '0.65rem', fontWeight: 900, letterSpacing: '0.2em', color: '#3b82f6' }}>STRATEGIC COMMAND</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
          {navItems.map(item => (
            <div 
              key={item.id} 
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                padding: '0.6rem',
                borderLeft: activeTab === item.id ? '3px solid #3b82f6' : '3px solid rgba(0,0,0,0)',
                background: activeTab === item.id ? 'linear-gradient(90deg, rgba(59, 130, 246, 0.1), rgba(0,0,0,0))' : 'rgba(0,0,0,0)',
                borderRadius: '0 8px 8px 0',
                margin: '0 1rem 0 0',
                cursor: 'pointer'
              }}
            >
              <div style={{ color: activeTab === item.id ? '#fff' : '#8896ab', marginTop: '2px', marginRight: '1rem' }}>
                {item.icon}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: activeTab === item.id ? '#fff' : '#8896ab', letterSpacing: '0.05em' }}>{item.label}</span>
                <span style={{ fontSize: '0.6rem', fontWeight: 700, color: activeTab === item.id ? (activeTab==='DEPLOYMENT' && item.id==='DEPLOYMENT' ? '#ef4444' : '#3b82f6') : '#5a6b82', marginTop: '4px', letterSpacing: '0.1em' }}>{item.sub}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MAIN AREA */}
      <div className="vp-main" style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>
        
        {/* HEADER */}
        {activeTab !== 'DEPLOYMENT' && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
              <h1 style={{ fontSize: '1.2rem', fontWeight: 900, margin: 0, letterSpacing: '-0.02em' }}>MISSION <span style={{ color: '#3b82f6' }}>COMMAND</span> LAYER</h1>
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div 
                onClick={() => setSelectedMission(selectedMission === 'sample(Sheet1)' ? null : 'sample(Sheet1)')}
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '0.75rem 1.5rem', minWidth: '280px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
              >
                <div>
                  <div style={{ fontSize: '0.55rem', fontWeight: 800, color: '#8896ab', letterSpacing: '0.1em', marginBottom: '4px' }}>MISSION NODE</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 900 }}>{selectedMission || 'SELECT MISSION'}</div>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </div>

              {selectedMission === null && (
                <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', overflow: 'hidden', padding: '4px' }}>
                  <div style={{ padding: '0.5rem 1rem', fontSize: '0.7rem', fontWeight: 800, color: '#8896ab', cursor: 'pointer' }}>GLOBAL</div>
                  <div style={{ padding: '0.5rem 1rem', fontSize: '0.7rem', fontWeight: 800, color: '#8896ab', cursor: 'pointer' }}>D2</div>
                  <div style={{ padding: '0.5rem 1rem', fontSize: '0.7rem', fontWeight: 800, color: '#fff', background: '#3b82f6', borderRadius: '8px', cursor: 'pointer' }}>D3</div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'DEPLOYMENT' && (
          <div style={{ marginBottom: '1rem' }}>
            <h1 style={{ fontSize: '1.2rem', fontWeight: 900, margin: 0, letterSpacing: '-0.02em' }}>MISSION <span style={{ color: '#3b82f6' }}>DEPLOYMENT</span> COMMAND</h1>
          </div>
        )}

        {/* TAB CONTENT: DEPLOYMENT */}
        {activeTab === 'DEPLOYMENT' && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', gap: '1rem' }}>
            
            {/* Deployment Steps Sidebar */}
            <div style={{ width: '220px', flexShrink: 0 }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#8896ab', letterSpacing: '0.1em', marginBottom: '1rem' }}>DEPLOYMENT STEPS</div>
              
              <div onClick={() => setDeploymentStep(1)} style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', opacity: deploymentStep === 1 ? 1 : 0.5, cursor: 'pointer' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: deploymentStep === 1 ? '#3b82f6' : 'rgba(255,255,255,0.1)', color: deploymentStep === 1 ? '#fff' : 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 900, boxShadow: deploymentStep === 1 ? '0 0 15px rgba(59, 130, 246, 0.4)' : 'none' }}>1</div>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>Identify<br/>Manager<br/>Command</div>
                  <div style={{ fontSize: '0.65rem', color: '#8896ab', marginTop: '0.5rem' }}>Sync with<br/>Manager ID</div>
                </div>
              </div>

              <div onClick={() => setDeploymentStep(2)} style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', opacity: deploymentStep === 2 ? 1 : 0.5, cursor: 'pointer' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: deploymentStep === 2 ? '#FFB347' : 'rgba(255,255,255,0.1)', color: deploymentStep === 2 ? '#000' : 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 900, boxShadow: deploymentStep === 2 ? '0 0 15px rgba(255, 179, 71, 0.4)' : 'none' }}>2</div>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>Project<br/>Intelligence<br/>Upload</div>
                  <div style={{ fontSize: '0.65rem', color: '#8896ab', marginTop: '0.5rem' }}>Excel or Image<br/>Artifact</div>
                </div>
              </div>

              <div onClick={() => setDeploymentStep(3)} style={{ display: 'flex', gap: '1rem', opacity: deploymentStep === 3 ? 1 : 0.5, cursor: 'pointer' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: deploymentStep === 3 ? '#00ffd1' : 'rgba(255,255,255,0.1)', color: deploymentStep === 3 ? '#000' : 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 900, boxShadow: deploymentStep === 3 ? '0 0 15px rgba(0, 255, 209, 0.4)' : 'none' }}>3</div>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>Validate &<br/>Synchronize</div>
                  <div style={{ fontSize: '0.65rem', color: '#8896ab', marginTop: '0.5rem' }}>Review<br/>Resource Matrix</div>
                </div>
              </div>
            </div>

            {/* Deployment Main Area */}
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '1.25rem' }}>
              
              {deploymentStep === 1 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>Step 1: <span style={{ color: '#3b82f6' }}>Manager Command</span> Sync</h2>
                  <p style={{ fontSize: '0.75rem', color: '#8896ab', margin: '0 0 2rem 0' }}>Link this deployment to an active Manager ID to establish a secure intelligence bridge.</p>
                  
                  <div style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '2rem', maxWidth: '450px' }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#8896ab', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>MANAGER ID</div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input type="text" placeholder="e.g. MGR-8924" style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.75rem 1rem', borderRadius: '8px', color: '#fff', fontSize: '0.85rem', outline: 'none' }} />
                      <button style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '0 1.5rem', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' }}>Verify</button>
                    </div>
                    
                    <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', background: 'rgba(0, 255, 209, 0.05)', border: '1px dashed rgba(0, 255, 209, 0.2)', borderRadius: '8px' }}>
                      <Icons.CheckSquare />
                      <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#00ffd1' }}>Santhosh B - Validated</div>
                        <div style={{ fontSize: '0.65rem', color: '#8896ab' }}>Solutions Architect (Global)</div>
                      </div>
                    </div>
                  </div>
                  
                  <button onClick={() => setDeploymentStep(2)} style={{ marginTop: '2rem', background: '#3b82f6', color: '#fff', border: 'none', padding: '0.85rem 2rem', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    Continue to Upload
                  </button>
                </motion.div>
              )}

              {deploymentStep === 2 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>Step 2: <span style={{ color: '#FFB347' }}>Project Intelligence</span> Upload</h2>
                  <p style={{ fontSize: '0.75rem', color: '#8896ab', margin: '0 0 2rem 0' }}>Upload Excel matrices or image artifacts for AI extraction and baseline establishment.</p>
                  
                  <div style={{ background: '#0d1117', border: '2px dashed rgba(255,179,71,0.3)', borderRadius: '12px', padding: '3rem', textAlign: 'center', cursor: 'pointer', maxWidth: '600px' }}>
                    <div style={{ color: '#FFB347', marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
                      <Icons.Cube />
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '0.5rem' }}>Drag & drop intelligence artifacts</div>
                    <div style={{ fontSize: '0.7rem', color: '#8896ab' }}>Supports .xlsx, .csv, .jpg, .png up to 50MB</div>
                  </div>
                  
                  <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', maxWidth: '600px' }}>
                    <Icons.CheckSquare />
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 800 }}>sample_sheet1.xlsx</div>
                      <div style={{ fontSize: '0.65rem', color: '#8896ab' }}>142 KB • Extracted 74 Rows</div>
                    </div>
                  </div>
                  
                  <button onClick={() => setDeploymentStep(3)} style={{ marginTop: '2rem', background: '#FFB347', color: '#000', border: 'none', padding: '0.85rem 2rem', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    Process Artifacts
                  </button>
                </motion.div>
              )}

              {deploymentStep === 3 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>Step 3: <span style={{ color: '#00ffd1' }}>Data Audit</span> & Business Validation</h2>
                  <p style={{ fontSize: '0.75rem', color: '#8896ab', margin: '0 0 2rem 0' }}>Review and verify intelligence nodes before command synchronization.</p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{ background: '#0d1117', borderRadius: '12px', padding: '0.85rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#8896ab', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>TOTAL REVENUE</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#00ffd1' }}>₹45.9L</div>
                    </div>
                    <div style={{ background: '#0d1117', borderRadius: '12px', padding: '0.85rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#8896ab', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>TOTAL COST</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#FFB347' }}>₹37.1L</div>
                    </div>
                    <div style={{ background: '#0d1117', borderRadius: '12px', padding: '0.85rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#8896ab', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>TOTAL PROFIT</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#3b82f6' }}>₹8.9L</div>
                    </div>
                  </div>

                  <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px' }}>
                  <thead>
                    <tr>
                      <th style={{ paddingBottom: '0.5rem', fontSize: '0.65rem', fontWeight: 800, color: '#8896ab', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>STATUS</th>
                      <th style={{ paddingBottom: '0.5rem', fontSize: '0.65rem', fontWeight: 800, color: '#8896ab', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>SL.NO</th>
                      <th style={{ paddingBottom: '0.5rem', fontSize: '0.65rem', fontWeight: 800, color: '#8896ab', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>SAP ID</th>
                      <th style={{ paddingBottom: '0.5rem', fontSize: '0.65rem', fontWeight: 800, color: '#8896ab', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>DESCRIPTION</th>
                      <th style={{ paddingBottom: '0.5rem', fontSize: '0.65rem', fontWeight: 800, color: '#8896ab', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>QTY</th>
                      <th style={{ paddingBottom: '0.5rem', fontSize: '0.65rem', fontWeight: 800, color: '#8896ab', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>PURCHASE UN.</th>
                      <th style={{ paddingBottom: '0.5rem', fontSize: '0.65rem', fontWeight: 800, color: '#8896ab', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>PURCHASE TOT.</th>
                      <th style={{ paddingBottom: '0.5rem', fontSize: '0.65rem', fontWeight: 800, color: '#8896ab', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>SELLING UN.</th>
                      <th style={{ paddingBottom: '0.5rem', fontSize: '0.65rem', fontWeight: 800, color: '#8896ab', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>SELLING TOT.</th>
                      <th style={{ paddingBottom: '0.5rem', fontSize: '0.65rem', fontWeight: 800, color: '#8896ab', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>GST VAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { sl: 1, id: 'S_PRD103451', desc: 'HPE Networking Instant On Switch 24p G...', qty: '3', pu: '₹45,500', pt: '₹136,500', su: '₹52,907', st: '₹158,721', gst: '₹28,570' },
                      { sl: 2, id: 'S_PRD103452', desc: 'HPE Networking Instant On Switch 24p G...', qty: '4', pu: '₹23,500', pt: '₹94,000', su: '₹27,326', st: '₹109,304', gst: '₹19,675' },
                      { sl: 3, id: 'S_PRD101303', desc: 'HPE Aruba Networking AP-505 (RW) TAA...', qty: '4', pu: '₹33,000', pt: '₹132,000', su: '₹38,372', st: '₹153,488', gst: '₹27,628' },
                      { sl: 4, id: 'S_FG-60F', desc: '10 x GE RJ45 ports (including 7 x Internal...', qty: '2', pu: '₹115,709', pt: '₹231,418', su: '₹134,545', st: '₹269,090', gst: '₹48,436' },
                      { sl: 5, id: 'S_PRD103453', desc: 'HPE ProLiant DL360 Gen11 1P 4LFF 500W...', qty: '1', pu: '₹548,000', pt: '₹548,000', su: '₹637,209', st: '₹637,209', gst: '₹114,698' }
                    ].map(row => (
                      <tr key={row.sl}>
                        <td style={{ padding: '0.6rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)', color: '#00ffd1' }}><Icons.CheckSquare /></td>
                        <td style={{ padding: '0.6rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.75rem', fontWeight: 800 }}>{row.sl}</td>
                        <td style={{ padding: '0.6rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.75rem', fontWeight: 800 }}>{row.id}</td>
                        <td style={{ padding: '0.6rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.75rem', color: '#d1d5db' }}>{row.desc}</td>
                        <td style={{ padding: '0.6rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.75rem', fontWeight: 800 }}>{row.qty}</td>
                        <td style={{ padding: '0.6rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.75rem', color: '#d1d5db' }}>{row.pu}</td>
                        <td style={{ padding: '0.6rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.75rem', fontWeight: 800, color: '#FFB347' }}>{row.pt}</td>
                        <td style={{ padding: '0.6rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.75rem', color: '#d1d5db' }}>{row.su}</td>
                        <td style={{ padding: '0.6rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.75rem', fontWeight: 800, color: '#00ffd1' }}>{row.st}</td>
                        <td style={{ padding: '0.6rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.75rem', color: '#d1d5db' }}>{row.gst}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
                  </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {/* TAB CONTENT: PROJECT INTELLIGENCE (UNSELECTED) */}
        {activeTab === 'PROJECT_INTELLIGENCE' && selectedMission === null && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              
              {/* Left Panel: Execution Status Engine */}
              <div className="vp-glass" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '0.85rem', borderRadius: '16px', position: 'relative' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#FFB347', borderRadius: '16px 0 0 16px' }} />
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 800, letterSpacing: '0.1em', color: '#fff' }}>EXECUTION STATUS ENGINE</h3>
                  <div style={{ background: 'rgba(255, 179, 71, 0.15)', color: '#FFB347', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FFB347' }} />
                    Moderate
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.2rem' }}>
                      <span style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff' }}>100%</span>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00ffd1" strokeWidth="4"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>
                    </div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#00ffd1', marginTop: '1rem' }}>4%</div>
                    <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#8896ab', marginTop: '4px' }}>Current Efficiency</div>
                  </div>

                  <div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#00ffd1' }}>100</div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#00ffd1', marginTop: '1.2rem' }}>Score</div>
                    <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#3b82f6', marginTop: '4px', textDecoration: 'underline', cursor: 'pointer' }}>Performance Index</div>
                  </div>

                  <div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#00ffd1' }}>28.2%</div>
                    <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#8896ab', marginTop: '2.5rem' }}>Margin</div>
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '0.6rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <Icons.Lightning />
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#d1d5db' }}>Mission 121212 (GLOBAL) execution is 100.0% aligned with baseline.</span>
                </div>
              </div>

              {/* Right Panel: Metric Table */}
              <div className="vp-glass" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '0.85rem', borderRadius: '16px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ paddingBottom: '0.75rem', textAlign: 'left', fontSize: '0.65rem', fontWeight: 800, color: '#8896ab', letterSpacing: '0.1em' }}>METRIC</th>
                      <th style={{ paddingBottom: '0.75rem', textAlign: 'left', fontSize: '0.65rem', fontWeight: 800, color: '#8896ab', letterSpacing: '0.1em' }}>BASELINE (EXCEL)</th>
                      <th style={{ paddingBottom: '0.75rem', textAlign: 'left', fontSize: '0.65rem', fontWeight: 800, color: '#8896ab', letterSpacing: '0.1em' }}>ACTUAL</th>
                      <th style={{ paddingBottom: '0.75rem', textAlign: 'left', fontSize: '0.65rem', fontWeight: 800, color: '#8896ab', letterSpacing: '0.1em' }}>VARIANCE</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem', fontWeight: 800 }}>Revenue</td>
                      <td style={{ padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem', fontWeight: 600, color: '#8896ab' }}>₹10.9L</td>
                      <td style={{ padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem', fontWeight: 800 }}>₹10.9L</td>
                      <td style={{ padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.75rem', fontWeight: 800, color: '#00ffd1', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00ffd1' }}/>Verified</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem', fontWeight: 800 }}>Cost</td>
                      <td style={{ padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem', fontWeight: 600, color: '#8896ab' }}>₹7.8L</td>
                      <td style={{ padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem', fontWeight: 800 }}>₹7.8L</td>
                      <td style={{ padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.75rem', fontWeight: 800, color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6' }}/>Balanced</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '0.5rem 0', fontSize: '0.85rem', fontWeight: 800 }}>Hours</td>
                      <td style={{ padding: '0.5rem 0', fontSize: '0.85rem', fontWeight: 600, color: '#8896ab' }}>19288</td>
                      <td style={{ padding: '0.5rem 0', fontSize: '0.85rem', fontWeight: 800 }}>0</td>
                      <td style={{ padding: '0.5rem 0', fontSize: '0.75rem', fontWeight: 800, color: '#00ffd1', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00ffd1' }}/>Efficient</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom Panel: Resource Intelligence Matrix */}
            <div className="vp-glass" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '0.85rem', borderRadius: '16px' }}>
              <h3 style={{ margin: '0 0 2rem 0', fontSize: '0.85rem', fontWeight: 800, letterSpacing: '0.1em', color: '#fff' }}>RESOURCE INTELLIGENCE MATRIX (EXACT EXCEL REFLECTION)</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr>
                      <th style={{ paddingBottom: '0.5rem', fontSize: '0.65rem', fontWeight: 800, color: '#8896ab', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>S.N</th>
                      <th style={{ paddingBottom: '0.5rem', fontSize: '0.65rem', fontWeight: 800, color: '#8896ab', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>SAP ID</th>
                      <th style={{ paddingBottom: '0.5rem', fontSize: '0.65rem', fontWeight: 800, color: '#8896ab', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>DESCRIPTION</th>
                      <th style={{ paddingBottom: '0.5rem', fontSize: '0.65rem', fontWeight: 800, color: '#8896ab', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>QTY</th>
                      <th style={{ paddingBottom: '0.5rem', fontSize: '0.65rem', fontWeight: 800, color: '#8896ab', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>PURCHASE UN.</th>
                      <th style={{ paddingBottom: '0.5rem', fontSize: '0.65rem', fontWeight: 800, color: '#8896ab', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>PURCHASE TOT.</th>
                      <th style={{ paddingBottom: '0.5rem', fontSize: '0.65rem', fontWeight: 800, color: '#8896ab', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>SELLING UN.</th>
                      <th style={{ paddingBottom: '0.5rem', fontSize: '0.65rem', fontWeight: 800, color: '#8896ab', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>SELLING TOT.</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: '0.6rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.75rem', fontWeight: 800 }}>1</td>
                      <td style={{ padding: '0.6rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.75rem', fontWeight: 800 }}>S_PRD103451</td>
                      <td style={{ padding: '0.6rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.75rem', color: '#d1d5db' }}>HPE Networking Instant On Switch 24p Gigabit Cl.4 PoE 4p SFP+ 3...</td>
                      <td style={{ padding: '0.6rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.75rem', fontWeight: 800 }}>3</td>
                      <td style={{ padding: '0.6rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.75rem', color: '#d1d5db' }}>₹45,500</td>
                      <td style={{ padding: '0.6rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.75rem', fontWeight: 800, color: '#FFB347' }}>₹136,500</td>
                      <td style={{ padding: '0.6rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.75rem', color: '#d1d5db' }}>₹52,907</td>
                      <td style={{ padding: '0.6rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.75rem', fontWeight: 800, color: '#00ffd1' }}>₹158,721</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '0.6rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.75rem', fontWeight: 800 }}>51</td>
                      <td style={{ padding: '0.6rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.75rem', fontWeight: 800 }}>SER102632</td>
                      <td style={{ padding: '0.6rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.75rem', color: '#d1d5db' }}>Labour Charges for CCTV</td>
                      <td style={{ padding: '0.6rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.75rem', fontWeight: 800 }}>1</td>
                      <td style={{ padding: '0.6rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.75rem', color: '#d1d5db' }}>₹643,082</td>
                      <td style={{ padding: '0.6rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.75rem', fontWeight: 800, color: '#FFB347' }}>₹643,082</td>
                      <td style={{ padding: '0.6rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.75rem', color: '#d1d5db' }}>₹926,665</td>
                      <td style={{ padding: '0.6rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.75rem', fontWeight: 800, color: '#00ffd1' }}>₹926,665</td>
                    </tr>
                    <tr style={{ background: 'rgba(108, 99, 255, 0.05)' }}>
                      <td colSpan="3" style={{ padding: '0.6rem 0', fontSize: '0.75rem', fontWeight: 800, color: '#6C63FF' }}>TOTAL (EXCEL SUMMARY)</td>
                      <td style={{ padding: '0.6rem 0', fontSize: '0.75rem', fontWeight: 800 }}>--</td>
                      <td style={{ padding: '0.6rem 0', fontSize: '0.75rem', fontWeight: 800 }}>--</td>
                      <td style={{ padding: '0.6rem 0', fontSize: '0.85rem', fontWeight: 900, color: '#FFB347' }}>₹779,582</td>
                      <td style={{ padding: '0.6rem 0', fontSize: '0.75rem', fontWeight: 800 }}>--</td>
                      <td style={{ padding: '0.6rem 0', fontSize: '0.85rem', fontWeight: 900, color: '#00ffd1' }}>₹1,085,386</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB CONTENT: PROJECT INTELLIGENCE (SAMPLE SHEET SELECTED) */}
        {activeTab === 'PROJECT_INTELLIGENCE' && selectedMission === 'sample(Sheet1)' && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              
              {/* Execution Status Engine (Selected) */}
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '0.85rem', borderRadius: '16px', position: 'relative' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#FFB347', borderRadius: '16px 0 0 16px' }} />
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 800, letterSpacing: '0.1em', color: '#fff' }}>EXECUTION STATUS ENGINE</h3>
                  <div style={{ background: 'rgba(255, 179, 71, 0.15)', color: '#FFB347', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FFB347' }} />
                    Moderate Risk
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.2rem' }}>
                      <span style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff' }}>67%</span>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00ffd1" strokeWidth="4"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>
                    </div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#00ffd1', marginTop: '1rem' }}>+4%</div>
                    <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#8896ab', marginTop: '4px' }}>Completion</div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.2rem' }}>
                      <span style={{ fontSize: '1.8rem', fontWeight: 900, color: '#ef4444' }}>+12d</span>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="4"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>
                    </div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#ef4444', marginTop: '1rem' }}>+2d</div>
                    <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#3b82f6', marginTop: '4px', textDecoration: 'underline', cursor: 'pointer' }}>View Root Cause</div>
                  </div>

                  <div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#00ffd1' }}>87%</div>
                    <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#8896ab', marginTop: '2.5rem' }}>Efficiency</div>
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '0.6rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <Icons.Lightning />
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#fff' }}>FORECAST: +18% recovery possible if API Node-4 risk is mitigated by Q4 end.</span>
                </div>
              </div>

              {/* Resource & Cost Intelligence Engine */}
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '0.85rem', borderRadius: '16px' }}>
                <h3 style={{ margin: '0 0 2.5rem 0', fontSize: '0.85rem', fontWeight: 800, letterSpacing: '0.1em', color: '#fff' }}>RESOURCE & COST INTELLIGENCE ENGINE</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ paddingBottom: '0.75rem', textAlign: 'left', fontSize: '0.65rem', fontWeight: 800, color: '#8896ab', letterSpacing: '0.1em' }}>METRIC</th>
                      <th style={{ paddingBottom: '0.75rem', textAlign: 'left', fontSize: '0.65rem', fontWeight: 800, color: '#8896ab', letterSpacing: '0.1em' }}>PLANNED</th>
                      <th style={{ paddingBottom: '0.75rem', textAlign: 'left', fontSize: '0.65rem', fontWeight: 800, color: '#8896ab', letterSpacing: '0.1em' }}>ACTUAL</th>
                      <th style={{ paddingBottom: '0.75rem', textAlign: 'left', fontSize: '0.65rem', fontWeight: 800, color: '#8896ab', letterSpacing: '0.1em' }}>VARIANCE</th>
                      <th style={{ paddingBottom: '0.75rem', textAlign: 'left', fontSize: '0.65rem', fontWeight: 800, color: '#8896ab', letterSpacing: '0.1em' }}>TREND</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem', fontWeight: 800 }}>Budget</td>
                      <td style={{ padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem', fontWeight: 600, color: '#8896ab' }}>€351.0K</td>
                      <td style={{ padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem', fontWeight: 900 }}>€219.0K</td>
                      <td style={{ padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.75rem', fontWeight: 800, color: '#00ffd1', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00ffd1' }}/>Under</td>
                      <td style={{ padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}><div style={{ width: '30px', height: '2px', background: '#00ffd1' }} /></td>
                    </tr>
                    <tr>
                      <td style={{ padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem', fontWeight: 800 }}>Hours</td>
                      <td style={{ padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem', fontWeight: 600, color: '#8896ab' }}>783</td>
                      <td style={{ padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem', fontWeight: 900 }}>674</td>
                      <td style={{ padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.75rem', fontWeight: 800, color: '#00ffd1', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00ffd1' }}/>Efficient</td>
                      <td style={{ padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}><div style={{ width: '30px', height: '2px', background: '#3b82f6' }} /></td>
                    </tr>
                    <tr>
                      <td style={{ padding: '0.5rem 0', fontSize: '0.85rem', fontWeight: 800 }}>Cost</td>
                      <td style={{ padding: '0.5rem 0', fontSize: '0.85rem', fontWeight: 600, color: '#8896ab' }}>€38.6K</td>
                      <td style={{ padding: '0.5rem 0', fontSize: '0.85rem', fontWeight: 900 }}>€31.2K</td>
                      <td style={{ padding: '0.5rem 0', fontSize: '0.75rem', fontWeight: 800, color: '#00ffd1', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00ffd1' }}/>Controlled</td>
                      <td style={{ padding: '0.5rem 0' }}><div style={{ width: '30px', height: '2px', background: '#00ffd1' }} /></td>
                    </tr>
                  </tbody>
                </table>
              </div>

            </div>

            {/* Bottom Section */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '1rem' }}>
              
              {/* Mission Delivery Path */}
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '0.85rem', borderRadius: '16px' }}>
                <h3 style={{ margin: '0 0 3rem 0', fontSize: '0.85rem', fontWeight: 800, letterSpacing: '0.1em', color: '#fff' }}>MISSION DELIVERY PATH (HORIZONTAL VIEW)</h3>
                
                <div style={{ display: 'flex', alignItems: 'flex-start', position: 'relative', paddingBottom: '0.5rem' }}>
                  {/* Background Line */}
                  <div style={{ position: 'absolute', top: '16px', left: '40px', right: '40px', height: '2px', background: 'linear-gradient(90deg, #00ffd1 25%, #3b82f6 75%)', zIndex: 1 }} />
                  
                  {/* Node 1 */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 2 }}>
                    <div style={{ position: 'absolute', top: '-25px', fontSize: '0.6rem', fontWeight: 900, color: '#8896ab', letterSpacing: '0.1em' }}>15 SEP</div>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#050608', border: '2px solid #00ffd1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00ffd1', marginBottom: '1rem', boxShadow: '0 0 15px rgba(0, 255, 209, 0.3)' }}><Icons.Check /></div>
                    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '0.6rem', borderRadius: '12px', width: '85%' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: '0.25rem' }}>Kick-off</div>
                      <div style={{ fontSize: '0.65rem', color: '#8896ab', marginBottom: '1rem' }}>Started on time</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 800 }}>
                        <span style={{ color: '#00ffd1' }}>0d</span>
                        <span style={{ color: '#00ffd1' }}>0%</span>
                      </div>
                    </div>
                  </div>

                  {/* Node 2 */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 2 }}>
                    <div style={{ position: 'absolute', top: '-25px', fontSize: '0.6rem', fontWeight: 900, color: '#8896ab', letterSpacing: '0.1em' }}>10 OCT</div>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#050608', border: '2px solid #3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6', marginBottom: '1rem', boxShadow: '0 0 15px rgba(59, 130, 246, 0.3)' }}><Icons.Lightning /></div>
                    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '0.6rem', borderRadius: '12px', width: '85%' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: '0.25rem' }}>API Integration</div>
                      <div style={{ fontSize: '0.65rem', color: '#8896ab', marginBottom: '1rem' }}>Load balancer scaling issue</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 800 }}>
                        <span style={{ color: '#3b82f6' }}>+2d</span>
                        <span style={{ color: '#ef4444' }}>-1.2%</span>
                      </div>
                    </div>
                  </div>

                  {/* Node 3 */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 2 }}>
                    <div style={{ position: 'absolute', top: '-25px', fontSize: '0.6rem', fontWeight: 900, color: '#8896ab', letterSpacing: '0.1em' }}>24 OCT</div>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#050608', border: '2px solid #3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6', marginBottom: '1rem', boxShadow: '0 0 15px rgba(59, 130, 246, 0.3)' }}><Icons.Lightning /></div>
                    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '0.6rem', borderRadius: '12px', width: '85%' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: '0.25rem' }}>Core System</div>
                      <div style={{ fontSize: '0.65rem', color: '#8896ab', marginBottom: '1rem' }}>Auth provider latency</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 800 }}>
                        <span style={{ color: '#3b82f6' }}>+4d</span>
                        <span style={{ color: '#ef4444' }}>-1.8%</span>
                      </div>
                    </div>
                  </div>

                  {/* Node 4 */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 2 }}>
                    <div style={{ position: 'absolute', top: '-25px', fontSize: '0.6rem', fontWeight: 900, color: '#8896ab', letterSpacing: '0.1em' }}>04 NOV</div>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#050608', border: '2px solid #FFB347', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFB347', marginBottom: '1rem', boxShadow: '0 0 15px rgba(255, 179, 71, 0.3)' }}><Icons.Clock /></div>
                    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '0.6rem', borderRadius: '12px', width: '85%' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: '0.25rem' }}>Beta Test</div>
                      <div style={{ fontSize: '0.65rem', color: '#8896ab', marginBottom: '1rem' }}>QA Resource bottleneck</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 800 }}>
                        <span style={{ color: '#FFB347' }}>Risk</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Team Stress & Load Matrix */}
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '0.85rem', borderRadius: '16px' }}>
                <h3 style={{ margin: '0 0 2.5rem 0', fontSize: '0.85rem', fontWeight: 800, letterSpacing: '0.1em', color: '#fff' }}>TEAM STRESS & LOAD MATRIX</h3>
                
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 800 }}>
                    <span>Engineering</span>
                    <span style={{ color: '#ef4444' }}>Critical (92%)</span>
                  </div>
                  <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}>
                    <div style={{ width: '92%', height: '100%', background: '#ef4444', borderRadius: '4px' }} />
                  </div>
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 800 }}>
                    <span>Design</span>
                    <span style={{ color: '#FFB347' }}>Normal (60%)</span>
                  </div>
                  <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}>
                    <div style={{ width: '60%', height: '100%', background: '#FFB347', borderRadius: '4px' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 800 }}>
                    <span>QA</span>
                    <span style={{ color: '#00ffd1' }}>Under (45%)</span>
                  </div>
                  <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}>
                    <div style={{ width: '45%', height: '100%', background: '#00ffd1', borderRadius: '4px' }} />
                  </div>
                </div>

              </div>

            </div>
          </motion.div>
        )}

        {/* TAB CONTENT: OVERVIEW */}
        {activeTab === 'OVERVIEW' && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <h1 style={{ fontSize: '1.2rem', fontWeight: 900, margin: 0, letterSpacing: '-0.02em' }}>GLOBAL STRATEGIC <span style={{ color: '#3b82f6' }}>OVERVIEW</span></h1>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ background: '#0d1117', borderRadius: '12px', padding: '0.85rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#8896ab', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>TOTAL ACTIVE MISSIONS</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#3b82f6' }}>72</div>
                <div style={{ fontSize: '0.65rem', color: '#8896ab', marginTop: '0.25rem' }}>Across 3 Global Regions</div>
              </div>
              <div style={{ background: '#0d1117', borderRadius: '12px', padding: '0.85rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#8896ab', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>REVENUE DEPLOYED</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#00ffd1' }}>₹142.5L</div>
                <div style={{ fontSize: '0.65rem', color: '#8896ab', marginTop: '0.25rem' }}>Verified active execution</div>
              </div>
              <div style={{ background: '#0d1117', borderRadius: '12px', padding: '0.85rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#8896ab', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>STRATEGIC MARGIN</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#FFB347' }}>34.8%</div>
                <div style={{ fontSize: '0.65rem', color: '#8896ab', marginTop: '0.25rem' }}>Blended global average</div>
              </div>
              <div style={{ background: '#0d1117', borderRadius: '12px', padding: '0.85rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#8896ab', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>MISSION SUCCESS</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#06b6d4' }}>98.2%</div>
                <div style={{ fontSize: '0.65rem', color: '#8896ab', marginTop: '0.25rem' }}>SLA adherence rate</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div className="vp-glass" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '1.25rem', borderRadius: '16px' }}>
                <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '0.85rem', fontWeight: 800, letterSpacing: '0.1em', color: '#fff' }}>REGIONAL DEPLOYMENT CAPACITY</h3>
                
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 800 }}>
                    <span>North America (D2)</span>
                    <span style={{ color: '#00ffd1' }}>Optimal (85%)</span>
                  </div>
                  <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}>
                    <div style={{ width: '85%', height: '100%', background: '#00ffd1', borderRadius: '4px' }} />
                  </div>
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 800 }}>
                    <span>Europe (D3)</span>
                    <span style={{ color: '#3b82f6' }}>Available (62%)</span>
                  </div>
                  <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}>
                    <div style={{ width: '62%', height: '100%', background: '#3b82f6', borderRadius: '4px' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 800 }}>
                    <span>APAC (GLOBAL)</span>
                    <span style={{ color: '#ef4444' }}>Critical (98%)</span>
                  </div>
                  <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}>
                    <div style={{ width: '98%', height: '100%', background: '#ef4444', borderRadius: '4px' }} />
                  </div>
                </div>
              </div>

              <div className="vp-glass" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '1.25rem', borderRadius: '16px' }}>
                <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '0.85rem', fontWeight: 800, letterSpacing: '0.1em', color: '#fff' }}>RECENT STRATEGIC MISSIONS</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', borderLeft: '3px solid #00ffd1' }}>
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 800 }}>Mission 121212</div>
                      <div style={{ fontSize: '0.65rem', color: '#8896ab' }}>Global Region • Revenue: ₹10.9L</div>
                    </div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#00ffd1', background: 'rgba(0,255,209,0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>Verified</div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', borderLeft: '3px solid #FFB347' }}>
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 800 }}>Project Phoenix</div>
                      <div style={{ fontSize: '0.65rem', color: '#8896ab' }}>North America (D2) • Revenue: ₹45.9L</div>
                    </div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#FFB347', background: 'rgba(255,179,71,0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>Data Audit</div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', borderLeft: '3px solid #3b82f6' }}>
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 800 }}>Horizon Migration</div>
                      <div style={{ fontSize: '0.65rem', color: '#8896ab' }}>Europe (D3) • Revenue: €351.0K</div>
                    </div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#3b82f6', background: 'rgba(59,130,246,0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>Kick-off</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB CONTENT: RESOURCE INTELLIGENCE */}
        {activeTab === 'RESOURCE_INTELLIGENCE' && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <h1 style={{ fontSize: '1.2rem', fontWeight: 900, margin: 0, letterSpacing: '-0.02em' }}>RESOURCE <span style={{ color: '#3b82f6' }}>INTELLIGENCE</span> COMMAND</h1>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ background: '#0d1117', borderRadius: '12px', padding: '0.85rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#8896ab', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>GLOBAL UTILIZATION</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#ef4444' }}>92%</div>
                <div style={{ fontSize: '0.65rem', color: '#8896ab', marginTop: '0.25rem' }}>High risk of burnout</div>
              </div>
              <div style={{ background: '#0d1117', borderRadius: '12px', padding: '0.85rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#8896ab', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>CRITICAL LOAD</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#FFB347' }}>12 Engineers</div>
                <div style={{ fontSize: '0.65rem', color: '#8896ab', marginTop: '0.25rem' }}>Allocated &gt;110% capacity</div>
              </div>
              <div style={{ background: '#0d1117', borderRadius: '12px', padding: '0.85rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#8896ab', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>BENCH AVAILABILITY</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#00ffd1' }}>3 Available</div>
                <div style={{ fontSize: '0.65rem', color: '#8896ab', marginTop: '0.25rem' }}>Ready for deployment</div>
              </div>
            </div>

            <div className="vp-glass" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '1.25rem', borderRadius: '16px' }}>
              <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '0.85rem', fontWeight: 800, letterSpacing: '0.1em', color: '#fff' }}>GLOBAL RESOURCE ALLOCATION HEATMAP</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr>
                      <th style={{ paddingBottom: '0.75rem', fontSize: '0.65rem', fontWeight: 800, color: '#8896ab', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>RESOURCE NAME</th>
                      <th style={{ paddingBottom: '0.75rem', fontSize: '0.65rem', fontWeight: 800, color: '#8896ab', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>PRIMARY ROLE</th>
                      <th style={{ paddingBottom: '0.75rem', fontSize: '0.65rem', fontWeight: 800, color: '#8896ab', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>ACTIVE MISSIONS</th>
                      <th style={{ paddingBottom: '0.75rem', fontSize: '0.65rem', fontWeight: 800, color: '#8896ab', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>ASSIGNED TASKS</th>
                      <th style={{ paddingBottom: '0.75rem', fontSize: '0.65rem', fontWeight: 800, color: '#8896ab', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>UTILIZATION</th>
                      <th style={{ paddingBottom: '0.75rem', fontSize: '0.65rem', fontWeight: 800, color: '#8896ab', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.75rem', fontWeight: 800 }}>Santhosh B</td>
                      <td style={{ padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.75rem', color: '#d1d5db' }}>Solutions Architect</td>
                      <td style={{ padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.75rem', color: '#d1d5db' }}>sample(Sheet1), Project Phoenix</td>
                      <td style={{ padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.75rem', color: '#d1d5db' }}>Architecture Design, API Integration</td>
                      <td style={{ padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.75rem', fontWeight: 800, color: '#ef4444' }}>120%</td>
                      <td style={{ padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.75rem', fontWeight: 800, color: '#ef4444' }}>Overloaded</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.75rem', fontWeight: 800 }}>Megha V</td>
                      <td style={{ padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.75rem', color: '#d1d5db' }}>Integration Specialist</td>
                      <td style={{ padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.75rem', color: '#d1d5db' }}>sample(Sheet1)</td>
                      <td style={{ padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.75rem', color: '#d1d5db' }}>Data Audit, Load Balancer Config</td>
                      <td style={{ padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.75rem', fontWeight: 800, color: '#FFB347' }}>95%</td>
                      <td style={{ padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.75rem', fontWeight: 800, color: '#FFB347' }}>Busy</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.75rem', fontWeight: 800 }}>Sarah K</td>
                      <td style={{ padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.75rem', color: '#d1d5db' }}>PMO</td>
                      <td style={{ padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.75rem', color: '#d1d5db' }}>sample(Sheet1), Horizon</td>
                      <td style={{ padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.75rem', color: '#d1d5db' }}>Governance, SLA Tracking</td>
                      <td style={{ padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.75rem', fontWeight: 800, color: '#FFB347' }}>88%</td>
                      <td style={{ padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.75rem', fontWeight: 800, color: '#FFB347' }}>Busy</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.75rem', fontWeight: 800 }}>Alex M</td>
                      <td style={{ padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.75rem', color: '#d1d5db' }}>Consultant</td>
                      <td style={{ padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.75rem', color: '#d1d5db' }}>Global Migration</td>
                      <td style={{ padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.75rem', color: '#d1d5db' }}>Validation Scripts</td>
                      <td style={{ padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.75rem', fontWeight: 800, color: '#00ffd1' }}>45%</td>
                      <td style={{ padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.75rem', fontWeight: 800, color: '#00ffd1' }}>Available</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
}

