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
  Lightning: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
};

export default function VPDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('PROJECT_INTELLIGENCE');

  const navItems = [
    { id: 'OVERVIEW', label: 'OVERVIEW', sub: '72 ACTIVE', icon: <Icons.Overview /> },
    { id: 'PROJECT_INTELLIGENCE', label: 'PROJECT INTELLIGENCE', sub: 'DEEP DRILL', icon: <Icons.Cube /> },
    { id: 'RESOURCE_INTELLIGENCE', label: 'RESOURCE INTELLIGENCE', sub: '92% LOAD', icon: <Icons.Users /> },
    { id: 'DEPLOYMENT', label: 'DEPLOYMENT', sub: 'NEW MISSION', icon: <Icons.Check /> }
  ];

  return (
    <div className="vp-dashboard">
      <div className="vp-sidebar">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem', marginTop: '1rem' }}>
          <div style={{ background: '#3b82f6', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: 900, marginBottom: '1rem', boxShadow: '0 0 20px rgba(59, 130, 246, 0.4)' }}>DT</div>
          <div style={{ fontSize: '0.65rem', fontWeight: 900, letterSpacing: '0.2em', color: '#3b82f6' }}>STRATEGIC COMMAND</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
          {navItems.map(item => (
            <div 
              key={item.id} 
              className={`vp-nav-item ${activeTab === item.id ? 'active' : ''}`} 
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                padding: '1rem',
                borderLeft: activeTab === item.id ? '3px solid #3b82f6' : '3px solid transparent',
                background: activeTab === item.id ? 'linear-gradient(90deg, rgba(59, 130, 246, 0.1), transparent)' : 'transparent',
                borderRadius: '0 8px 8px 0',
                margin: '0 1rem 0 0'
              }}
            >
              <div style={{ color: activeTab === item.id ? '#fff' : '#8896ab', marginTop: '2px', marginRight: '1rem' }}>
                {item.icon}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: activeTab === item.id ? '#fff' : '#8896ab', letterSpacing: '0.05em' }}>{item.label}</span>
                <span style={{ fontSize: '0.6rem', fontWeight: 700, color: activeTab === item.id ? '#3b82f6' : '#5a6b82', marginTop: '4px', letterSpacing: '0.1em' }}>{item.sub}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="vp-main" style={{ padding: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 900, margin: 0, letterSpacing: '-0.02em' }}>MISSION <span style={{ color: '#3b82f6' }}>COMMAND</span> LAYER</h1>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '0.75rem 1.5rem', minWidth: '280px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
              <div>
                <div style={{ fontSize: '0.55rem', fontWeight: 800, color: '#8896ab', letterSpacing: '0.1em', marginBottom: '4px' }}>MISSION NODE</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 900 }}>SELECT MISSION</div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>

            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', overflow: 'hidden', padding: '4px' }}>
              <div style={{ padding: '0.5rem 1rem', fontSize: '0.7rem', fontWeight: 800, color: '#8896ab', cursor: 'pointer' }}>GLOBAL</div>
              <div style={{ padding: '0.5rem 1rem', fontSize: '0.7rem', fontWeight: 800, color: '#8896ab', cursor: 'pointer' }}>D2</div>
              <div style={{ padding: '0.5rem 1rem', fontSize: '0.7rem', fontWeight: 800, color: '#fff', background: '#3b82f6', borderRadius: '8px', cursor: 'pointer' }}>D3</div>
            </div>
          </div>
        </div>

        {activeTab === 'PROJECT_INTELLIGENCE' && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              
              {/* Left Panel: Execution Status Engine */}
              <div className="vp-glass" style={{ padding: '2rem', borderRadius: '16px', position: 'relative' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#FFB347', borderRadius: '16px 0 0 16px' }} />
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                  <h3 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 800, letterSpacing: '0.1em', color: '#fff' }}>EXECUTION STATUS ENGINE</h3>
                  <div style={{ background: 'rgba(255, 179, 71, 0.15)', color: '#FFB347', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FFB347' }} />
                    Moderate
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.2rem' }}>
                      <span style={{ fontSize: '3rem', fontWeight: 900, color: '#fff' }}>100%</span>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00ffd1" strokeWidth="4"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>
                    </div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#00ffd1', marginTop: '1rem' }}>4%</div>
                    <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#8896ab', marginTop: '4px' }}>Current Efficiency</div>
                  </div>

                  <div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#00ffd1' }}>100</div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#00ffd1', marginTop: '1.2rem' }}>Score</div>
                    <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#3b82f6', marginTop: '4px', textDecoration: 'underline', cursor: 'pointer' }}>Performance Index</div>
                  </div>

                  <div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#00ffd1' }}>28.2%</div>
                    <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#8896ab', marginTop: '2.5rem' }}>Margin</div>
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <Icons.Lightning />
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#d1d5db' }}>Mission 121212 (GLOBAL) execution is 100.0% aligned with baseline.</span>
                </div>
              </div>

              {/* Right Panel: Metric Table */}
              <div className="vp-glass" style={{ padding: '2rem', borderRadius: '16px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ paddingBottom: '1.5rem', textAlign: 'left', fontSize: '0.65rem', fontWeight: 800, color: '#8896ab', letterSpacing: '0.1em' }}>METRIC</th>
                      <th style={{ paddingBottom: '1.5rem', textAlign: 'left', fontSize: '0.65rem', fontWeight: 800, color: '#8896ab', letterSpacing: '0.1em' }}>BASELINE (EXCEL)</th>
                      <th style={{ paddingBottom: '1.5rem', textAlign: 'left', fontSize: '0.65rem', fontWeight: 800, color: '#8896ab', letterSpacing: '0.1em' }}>ACTUAL</th>
                      <th style={{ paddingBottom: '1.5rem', textAlign: 'left', fontSize: '0.65rem', fontWeight: 800, color: '#8896ab', letterSpacing: '0.1em' }}>VARIANCE</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: '1rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem', fontWeight: 800 }}>Revenue</td>
                      <td style={{ padding: '1rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem', fontWeight: 600, color: '#8896ab' }}>₹10.9L</td>
                      <td style={{ padding: '1rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem', fontWeight: 800 }}>₹10.9L</td>
                      <td style={{ padding: '1rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.75rem', fontWeight: 800, color: '#00ffd1', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00ffd1' }}/>Verified</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '1rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem', fontWeight: 800 }}>Cost</td>
                      <td style={{ padding: '1rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem', fontWeight: 600, color: '#8896ab' }}>₹7.8L</td>
                      <td style={{ padding: '1rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem', fontWeight: 800 }}>₹7.8L</td>
                      <td style={{ padding: '1rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.75rem', fontWeight: 800, color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6' }}/>Balanced</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '1rem 0', fontSize: '0.85rem', fontWeight: 800 }}>Hours</td>
                      <td style={{ padding: '1rem 0', fontSize: '0.85rem', fontWeight: 600, color: '#8896ab' }}>19288</td>
                      <td style={{ padding: '1rem 0', fontSize: '0.85rem', fontWeight: 800 }}>0</td>
                      <td style={{ padding: '1rem 0', fontSize: '0.75rem', fontWeight: 800, color: '#00ffd1', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00ffd1' }}/>Efficient</td>
                    </tr>
                  </tbody>
                </table>
              </div>

            </div>

            {/* Bottom Panel: Resource Intelligence Matrix */}
            <div className="vp-glass" style={{ padding: '2rem', borderRadius: '16px' }}>
              <h3 style={{ margin: '0 0 2rem 0', fontSize: '0.85rem', fontWeight: 800, letterSpacing: '0.1em', color: '#fff' }}>RESOURCE INTELLIGENCE MATRIX (EXACT EXCEL REFLECTION)</h3>
              
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr>
                      <th style={{ paddingBottom: '1rem', fontSize: '0.65rem', fontWeight: 800, color: '#8896ab', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>S.N</th>
                      <th style={{ paddingBottom: '1rem', fontSize: '0.65rem', fontWeight: 800, color: '#8896ab', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>SAP ID</th>
                      <th style={{ paddingBottom: '1rem', fontSize: '0.65rem', fontWeight: 800, color: '#8896ab', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>DESCRIPTION</th>
                      <th style={{ paddingBottom: '1rem', fontSize: '0.65rem', fontWeight: 800, color: '#8896ab', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>QTY</th>
                      <th style={{ paddingBottom: '1rem', fontSize: '0.65rem', fontWeight: 800, color: '#8896ab', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>PURCHASE UN.</th>
                      <th style={{ paddingBottom: '1rem', fontSize: '0.65rem', fontWeight: 800, color: '#8896ab', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>PURCHASE TOT.</th>
                      <th style={{ paddingBottom: '1rem', fontSize: '0.65rem', fontWeight: 800, color: '#8896ab', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>SELLING UN.</th>
                      <th style={{ paddingBottom: '1rem', fontSize: '0.65rem', fontWeight: 800, color: '#8896ab', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>SELLING TOT.</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: '1.25rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.75rem', fontWeight: 800 }}>1</td>
                      <td style={{ padding: '1.25rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.75rem', fontWeight: 800 }}>S_PRD103451</td>
                      <td style={{ padding: '1.25rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.75rem', color: '#d1d5db' }}>HPE Networking Instant On Switch 24p Gigabit Cl.4 PoE 4p SFP+ 3...</td>
                      <td style={{ padding: '1.25rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.75rem', fontWeight: 800 }}>3</td>
                      <td style={{ padding: '1.25rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.75rem', color: '#d1d5db' }}>₹45,500</td>
                      <td style={{ padding: '1.25rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.75rem', fontWeight: 800, color: '#FFB347' }}>₹136,500</td>
                      <td style={{ padding: '1.25rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.75rem', color: '#d1d5db' }}>₹52,907</td>
                      <td style={{ padding: '1.25rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.75rem', fontWeight: 800, color: '#00ffd1' }}>₹158,721</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '1.25rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.75rem', fontWeight: 800 }}>51</td>
                      <td style={{ padding: '1.25rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.75rem', fontWeight: 800 }}>SER102632</td>
                      <td style={{ padding: '1.25rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.75rem', color: '#d1d5db' }}>Labour Charges for CCTV</td>
                      <td style={{ padding: '1.25rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.75rem', fontWeight: 800 }}>1</td>
                      <td style={{ padding: '1.25rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.75rem', color: '#d1d5db' }}>₹643,082</td>
                      <td style={{ padding: '1.25rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.75rem', fontWeight: 800, color: '#FFB347' }}>₹643,082</td>
                      <td style={{ padding: '1.25rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.75rem', color: '#d1d5db' }}>₹926,665</td>
                      <td style={{ padding: '1.25rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.75rem', fontWeight: 800, color: '#00ffd1' }}>₹926,665</td>
                    </tr>
                    <tr style={{ background: 'rgba(108, 99, 255, 0.05)' }}>
                      <td colSpan="3" style={{ padding: '1.25rem 0', fontSize: '0.75rem', fontWeight: 800, color: '#6C63FF' }}>TOTAL (EXCEL SUMMARY)</td>
                      <td style={{ padding: '1.25rem 0', fontSize: '0.75rem', fontWeight: 800 }}>--</td>
                      <td style={{ padding: '1.25rem 0', fontSize: '0.75rem', fontWeight: 800 }}>--</td>
                      <td style={{ padding: '1.25rem 0', fontSize: '0.85rem', fontWeight: 900, color: '#FFB347' }}>₹779,582</td>
                      <td style={{ padding: '1.25rem 0', fontSize: '0.75rem', fontWeight: 800 }}>--</td>
                      <td style={{ padding: '1.25rem 0', fontSize: '0.85rem', fontWeight: 900, color: '#00ffd1' }}>₹1,085,386</td>
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
