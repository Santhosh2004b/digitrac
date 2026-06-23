import re

def update_manager_js():
    file_path = r"c:\Users\User\OneDrive - Arche Global Private Limited\Digitrac\digitrac\frontend\src\app\manager\page.js"
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Update state
    content = content.replace(
        "const [trackingForm, setTrackingForm] = useState({ start_date: '', actual_end_date: '' });",
        "const [trackingForm, setTrackingForm] = useState({ start_date: '', actual_end_date: '', individuals: [] });\n  const [showWeeklyModal, setShowWeeklyModal] = useState(false);\n  const [weeklyItem, setWeeklyItem] = useState(null);\n  const [weeklyForm, setWeeklyForm] = useState({ week_number: 1, progress_pct: 0 });"
    )

    # 2. Update Table Headers
    old_thead = """                                    <thead>
                                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                            <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 700 }}>RESOURCE NAME</th>
                                            <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 700 }}>QTY</th>
                                            <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 700 }}>PLANNED DURATION</th>
                                            <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 700 }}>ACTUAL DURATION</th>
                                            <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 700 }}>START DATE</th>
                                            <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 700 }}>EXPECTED END DATE</th>
                                            <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 700 }}>ACTUAL END DATE</th>
                                            <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 700 }}>UTIL %</th>
                                            <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 700 }}>STATUS</th>
                                            <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 700 }}>ACTION</th>
                                        </tr>
                                    </thead>"""

    new_thead = """                                    <thead>
                                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                            <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 700 }}>RESOURCE NAME</th>
                                            <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 700 }}>PERSON NAME</th>
                                            <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 700 }}>QTY</th>
                                            <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 700 }}>PLANNED DURATION</th>
                                            <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 700 }}>ACTUAL DURATION</th>
                                            <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 700 }}>EXPECTED %</th>
                                            <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 700 }}>ACTUAL %</th>
                                            <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 700 }}>VARIANCE %</th>
                                            <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 700 }}>STATUS</th>
                                            <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 700 }}>WEEKLY REPORT</th>
                                        </tr>
                                    </thead>"""
    content = content.replace(old_thead, new_thead)

    # 3. Update Table Body
    old_tbody_start = "{(!selectedProject.implementation_resources || selectedProject.implementation_resources.length === 0) ? ("
    old_tbody_end = "                                        )}<!--END_TBODY-->" # I need to be careful

    tbody_regex = r"\{\(\!selectedProject\.implementation_resources \|\| selectedProject\.implementation_resources\.length === 0\).*?\}\)\n\s*\)\}"
    
    new_tbody = """{(!selectedProject.implementation_resources || selectedProject.implementation_resources.length === 0) ? (
                                            <tr>
                                                <td colSpan="10" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                                                    No implementation resources extracted for this project.
                                                </td>
                                            </tr>
                                        ) : (
                                            selectedProject.implementation_resources.flatMap((res, resIdx) => {
                                                const startDate = res.start_date ? new Date(res.start_date) : null;
                                                let expectedEndDateStr = "—";
                                                if (startDate && res.Months > 0) {
                                                    const end = new Date(startDate);
                                                    end.setMonth(end.getMonth() + res.Months);
                                                    expectedEndDateStr = end.toISOString().split('T')[0];
                                                }
                                                
                                                if (!res.individuals || res.individuals.length === 0) {
                                                    // Render Category Row for Start Tracking
                                                    return [(
                                                        <tr key={`cat-${resIdx}`} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                            <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#0f172a' }}>{res['Resource Name']}</td>
                                                            <td style={{ padding: '0.75rem 1rem', color: '#94a3b8', fontStyle: 'italic' }}>Pending Assign</td>
                                                            <td style={{ padding: '0.75rem 1rem', color: '#475569' }}>{res.Qty || 0}</td>
                                                            <td style={{ padding: '0.75rem 1rem', color: '#475569' }}>{res.Months || 0} Mo</td>
                                                            <td style={{ padding: '0.75rem 1rem', color: '#94a3b8' }}>—</td>
                                                            <td style={{ padding: '0.75rem 1rem', color: '#94a3b8' }}>—</td>
                                                            <td style={{ padding: '0.75rem 1rem', color: '#94a3b8' }}>—</td>
                                                            <td style={{ padding: '0.75rem 1rem', color: '#94a3b8' }}>—</td>
                                                            <td style={{ padding: '0.75rem 1rem' }}>
                                                                <span style={{ display: 'inline-block', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 800, background: `#94a3b822`, color: '#94a3b8', textTransform: 'uppercase' }}>PENDING</span>
                                                            </td>
                                                            <td style={{ padding: '0.75rem 1rem' }}>
                                                                <button 
                                                                    onClick={() => {
                                                                        const qty = parseInt(res.Qty) || 1;
                                                                        setTrackingItem({ res, idx: resIdx });
                                                                        setTrackingForm({ start_date: new Date().toISOString().split('T')[0], actual_end_date: '', individuals: Array(qty).fill('') });
                                                                        setShowTrackingModal(true);
                                                                    }}
                                                                    style={{ background: '#10b981', color: '#fff', border: 'none', padding: '0.4rem 0.75rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, fontSize: '0.7rem', whiteSpace: 'nowrap' }}
                                                                >
                                                                    Start Tracking
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    )];
                                                } else {
                                                    // Render Individuals
                                                    return res.individuals.map((ind, indIdx) => {
                                                        const statusColor = ind.status === 'RED' ? '#ef4444' : ind.status === 'ORANGE' ? '#f59e0b' : '#10b981';
                                                        // Calc expected
                                                        let expectedPct = 0;
                                                        if (startDate) {
                                                            const elapsedDays = (new Date() - startDate) / (1000 * 60 * 60 * 24);
                                                            const elapsedMonths = elapsedDays / 30.0;
                                                            expectedPct = Math.min(100, (elapsedMonths / (res.Months || 1)) * 100);
                                                        }
                                                        
                                                        return (
                                                            <tr key={`ind-${resIdx}-${indIdx}`} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                                <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#0f172a' }}>{indIdx === 0 ? res['Resource Name'] : ''}</td>
                                                                <td style={{ padding: '0.75rem 1rem', color: '#0f172a', fontWeight: 700 }}>{ind.name}</td>
                                                                <td style={{ padding: '0.75rem 1rem', color: '#475569' }}>{indIdx === 0 ? res.Qty : ''}</td>
                                                                <td style={{ padding: '0.75rem 1rem', color: '#475569' }}>{indIdx === 0 ? (res.Months || 0) + ' Mo' : ''}</td>
                                                                <td style={{ padding: '0.75rem 1rem', color: '#475569' }}>{indIdx === 0 && res.actual_duration ? res.actual_duration + ' Mo' : '—'}</td>
                                                                <td style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 600 }}>{expectedPct.toFixed(1)}%</td>
                                                                <td style={{ padding: '0.75rem 1rem', color: '#0f172a', fontWeight: 800 }}>{ind.actual_pct}%</td>
                                                                <td style={{ padding: '0.75rem 1rem', color: ind.variance < 0 ? '#ef4444' : '#10b981', fontWeight: 700 }}>{ind.variance > 0 ? '+' : ''}{ind.variance}%</td>
                                                                <td style={{ padding: '0.75rem 1rem' }}>
                                                                    <span style={{ display: 'inline-block', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 800, background: `${statusColor}22`, color: statusColor, textTransform: 'uppercase' }}>
                                                                        {ind.status}
                                                                    </span>
                                                                </td>
                                                                <td style={{ padding: '0.75rem 1rem' }}>
                                                                    <button 
                                                                        onClick={() => {
                                                                            const lastWeek = ind.progress_log?.length > 0 ? ind.progress_log[ind.progress_log.length - 1].week : 0;
                                                                            setWeeklyItem({ resIdx, indIdx, res, ind, expectedPct });
                                                                            setWeeklyForm({ week_number: lastWeek + 1, progress_pct: ind.actual_pct });
                                                                            setShowWeeklyModal(true);
                                                                        }}
                                                                        style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '0.4rem 0.75rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, fontSize: '0.7rem', whiteSpace: 'nowrap' }}
                                                                    >
                                                                        Weekly Report
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        );
                                                    });
                                                }
                                            })
                                        )}"""
    
    content = re.sub(tbody_regex, new_tbody, content, flags=re.DOTALL)

    # 4. Update Start Tracking Modal Content
    old_tracking_modal_content = r"""            <div style=\{\{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' \}\}>
              <button onClick=\{\(\) => setShowTrackingModal\(false\)\} style=\{\{ padding: '0.6rem 1.2rem', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem' \}\}>Cancel</button>"""
    
    new_tracking_modal_individuals = """            {trackingForm.individuals && trackingForm.individuals.map((name, i) => (
              <div key={i} style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#3b82f6', marginBottom: '0.4rem' }}>{trackingItem.res['Resource Name']} {i + 1} NAME</label>
                <input type="text" value={name} onChange={e => { const newInds = [...trackingForm.individuals]; newInds[i] = e.target.value; setTrackingForm({...trackingForm, individuals: newInds}); }} placeholder={`Enter name for individual ${i+1}`} style={{ width: '100%', padding: '0.6rem 0.8rem', border: '1px solid #93c5fd', borderRadius: '6px', fontSize: '0.8rem', color: '#0f172a', fontWeight: 600, background: '#fff' }} />
              </div>
            ))}
            
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowTrackingModal(false)} style={{ padding: '0.6rem 1.2rem', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem' }}>Cancel</button>"""
    
    content = re.sub(old_tracking_modal_content, new_tracking_modal_individuals, content)

    # 5. Add Weekly Report Modal
    weekly_modal_html = """
      {/* Weekly Report Modal */}
      <AnimatePresence>
        {showWeeklyModal && weeklyItem && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} style={{ background: '#fff', borderRadius: '12px', width: '500px', maxWidth: '90vw', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
              <div style={{ padding: '1.25rem 1.5rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>{weeklyItem.res['Resource Name']} - {weeklyItem.ind.name}</h3>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem', fontWeight: 600 }}>WEEKLY REPORT & PROGRESS</div>
                </div>
                <button onClick={() => setShowWeeklyModal(false)} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
              
              <div style={{ padding: '1.5rem', overflowY: 'auto', maxHeight: '70vh' }}>
                {/* Donut & Stats */}
                <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', marginBottom: '2rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                  <div style={{ position: 'relative', width: '80px', height: '80px' }}>
                    <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%' }}>
                      <path stroke="#e2e8f0" strokeWidth="4" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      <path stroke={weeklyItem.ind.status === 'RED' ? '#ef4444' : weeklyItem.ind.status === 'ORANGE' ? '#f59e0b' : '#10b981'} strokeWidth="4" strokeDasharray={`${Math.min(100, weeklyItem.ind.actual_pct)}, 100`} fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    </svg>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 800, color: '#0f172a' }}>
                      {weeklyItem.ind.actual_pct}%
                    </div>
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>Expected %</span>
                      <span style={{ fontSize: '0.85rem', color: '#0f172a', fontWeight: 800 }}>{weeklyItem.expectedPct.toFixed(1)}%</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>Actual %</span>
                      <span style={{ fontSize: '0.85rem', color: '#0f172a', fontWeight: 800 }}>{weeklyItem.ind.actual_pct}%</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #cbd5e1', paddingTop: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>Variance</span>
                      <span style={{ fontSize: '0.85rem', color: weeklyItem.ind.variance < 0 ? '#ef4444' : '#10b981', fontWeight: 800 }}>{weeklyItem.ind.variance > 0 ? '+' : ''}{weeklyItem.ind.variance}%</span>
                    </div>
                  </div>
                </div>

                {/* Progress Update Form */}
                <div style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                  <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: '#0f172a', fontWeight: 800 }}>Update Progress</h4>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#64748b', marginBottom: '0.4rem' }}>WEEK #</label>
                      <input type="number" value={weeklyForm.week_number} onChange={e => setWeeklyForm({...weeklyForm, week_number: parseInt(e.target.value)})} style={{ width: '100%', padding: '0.6rem 0.8rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.8rem', color: '#0f172a', fontWeight: 600 }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#64748b', marginBottom: '0.4rem' }}>ACTUAL %</label>
                      <input type="number" step="0.1" value={weeklyForm.progress_pct} onChange={e => setWeeklyForm({...weeklyForm, progress_pct: parseFloat(e.target.value)})} style={{ width: '100%', padding: '0.6rem 0.8rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.8rem', color: '#0f172a', fontWeight: 600 }} />
                    </div>
                  </div>
                  <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={async () => {
                      try {
                        const resp = await fetch(`${API}/manager/projects/${selectedProject.id}/resources/${weeklyItem.resIdx}/individuals/${weeklyItem.indIdx}/progress`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` },
                          body: JSON.stringify(weeklyForm)
                        });
                        if (resp.ok) {
                          setShowWeeklyModal(false);
                          loadProject(selectedProject.id);
                        }
                      } catch (err) {}
                    }} style={{ padding: '0.6rem 1.2rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem', boxShadow: '0 4px 6px -1px rgba(16,185,129,0.2)' }}>Save Progress</button>
                  </div>
                </div>

                {/* History */}
                <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: '#0f172a', fontWeight: 800 }}>Weekly Log</h4>
                {(!weeklyItem.ind.progress_log || weeklyItem.ind.progress_log.length === 0) ? (
                  <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem', padding: '1rem' }}>No progress logged yet.</div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b' }}>
                        <th style={{ padding: '0.5rem', textAlign: 'left' }}>WEEK</th>
                        <th style={{ padding: '0.5rem', textAlign: 'right' }}>ACTUAL %</th>
                        <th style={{ padding: '0.5rem', textAlign: 'right' }}>TIMESTAMP</th>
                      </tr>
                    </thead>
                    <tbody>
                      {weeklyItem.ind.progress_log.map((log, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '0.5rem', fontWeight: 700, color: '#0f172a' }}>Week {log.week}</td>
                          <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 700, color: '#3b82f6' }}>{log.progress_pct}%</td>
                          <td style={{ padding: '0.5rem', textAlign: 'right', color: '#94a3b8' }}>{new Date(log.timestamp).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
"""
    content = content.replace("{/* AI Chat Box Corner Float */}", weekly_modal_html + "\n      {/* AI Chat Box Corner Float */}")

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

update_manager_js()
