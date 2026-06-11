import os

file_path = r"c:\Users\User\OneDrive - Arche Global Private Limited\Digitrac\Digitrac\frontend\src\app\manager\page.js"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

missing_content = """                                        <tr><td colSpan="10" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No project items available</td></tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                        {innerTab === 'WORKFORCE' && (
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1200px' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                                        {['Node', 'Task', 'Employee', 'ID / Grade', 'Practice', 'Cost/Hr', 'Bill/Hr', 'Total Cost', 'Billable Value', 'Margin'].map(h => (
                                            <th key={h} style={{ padding: '0.75rem 0.5rem', fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedProject.resources?.map((row, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.8rem', color: '#0f172a', fontWeight: 600 }}>{row.sap_id || '—'}</td>
                                            <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.8rem', color: '#475569', maxWidth: '180px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={row.task_name}>{row.task_name || '—'}</td>
                                            <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.8rem', color: '#0f172a', fontWeight: 600 }}>{row.name !== "Unassigned" ? row.name : 'Unassigned'}</td>
                                            <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.8rem', color: '#475569' }}>
                                                <div style={{ fontWeight: 600 }}>{row.employee_id !== "N/A" ? row.employee_id : 'TBD'}</div>
                                                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{row.grade || '—'}</div>
                                            </td>
                                            <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.8rem', color: '#475569' }}>{row.role_practice !== "N/A" ? row.role_practice : '—'}</td>
                                            <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.8rem', color: '#ef4444' }}>₹{row.cost_rate?.toLocaleString() || 0}</td>
                                            <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.8rem', color: '#059669' }}>₹{row.hourly_billing_rate?.toLocaleString() || 0}</td>
                                            <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.8rem', color: '#0f172a', fontWeight: 600 }}>₹{row.resource_cost?.toLocaleString() || 0}</td>
                                            <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.8rem', color: '#2563eb', fontWeight: 600 }}>₹{row.billing_value?.toLocaleString() || 0}</td>
                                            <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.8rem', color: row.resource_margin >= 0 ? '#10b981' : '#ef4444', fontWeight: 600 }}>₹{row.resource_margin?.toLocaleString() || 0}</td>
                                        </tr>
                                    ))}
                                    {(!selectedProject.resources || selectedProject.resources.length === 0) && (
                                        <tr><td colSpan="10" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No workforce items available</td></tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                        
                        {innerTab === 'EXTENSIONS' && (
                            <div style={{ padding: '1rem' }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.5rem' }}>Governance & Extensions</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                    
                                    <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                        <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>Request Additional Hours</h4>
                                        <div style={{ marginBottom: '1rem' }}>
                                            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#475569', marginBottom: '0.3rem' }}>SELECT SAP NODE</label>
                                            <select id="req_node" style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none' }}>
                                                <option value="">-- Select Node --</option>
                                                {selectedProject.resources?.map((r, idx) => <option key={r.sap_id ?? `node-${idx}`} value={r.id}>{r.sap_id} - {r.task_name}</option>)}
                                            </select>
                                        </div>
                                        <div style={{ marginBottom: '1rem' }}>
                                            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#475569', marginBottom: '0.3rem' }}>ADDITIONAL HOURS REQUESTED</label>
                                            <input type="number" id="req_hrs" style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none' }} />
                                        </div>
                                        <div style={{ marginBottom: '1.5rem' }}>
                                            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#475569', marginBottom: '0.3rem' }}>BUSINESS JUSTIFICATION</label>
                                            <textarea id="req_reason_hrs" style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none', height: '60px', resize: 'none' }}></textarea>
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
                                            <input type="date" id="req_date" style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none' }} />
                                        </div>
                                        <div style={{ marginBottom: '1.5rem' }}>
                                            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#475569', marginBottom: '0.3rem' }}>REASON FOR DELAY</label>
                                            <textarea id="req_reason_date" style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none', height: '135px', resize: 'none' }}></textarea>
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
                                                <span style={{ fontSize: '0.9rem', color: '#0f172a', fontWeight: 800 }}>₹{selectedProject.total_revenue?.toLocaleString() || 0}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                                                <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Baseline Cost</span>
                                                <span style={{ fontSize: '0.9rem', color: '#0f172a', fontWeight: 800 }}>₹{(selectedProject.actual_total_cost - selectedProject.actual_resource_cost)?.toLocaleString() || 0}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                                                <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Resource Cost</span>
                                                <span style={{ fontSize: '0.9rem', color: '#ef4444', fontWeight: 800 }}>₹{selectedProject.actual_resource_cost?.toLocaleString() || 0}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', background: '#eff6ff', padding: '1rem', borderRadius: '8px', marginTop: '0.5rem' }}>
                                                <span style={{ fontSize: '0.85rem', color: '#2563eb', fontWeight: 700 }}>Margin Amount</span>
                                                <span style={{ fontSize: '1rem', color: '#2563eb', fontWeight: 900 }}>₹{selectedProject.margin_amount?.toLocaleString() || 0}</span>
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
                                                <span style={{ fontSize: '0.85rem', color: '#0f172a', fontWeight: 700 }}>{selectedProject.duration_months} Months</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                                                <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Region</span>
                                                <span style={{ fontSize: '0.85rem', color: '#0f172a', fontWeight: 700 }}>{selectedProject.region || 'GLOBAL'}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', background: selectedProject.margin_deviation_pct < 0 ? '#fef2f2' : '#ecfdf5', padding: '1rem', borderRadius: '8px', marginTop: '0.5rem' }}>
                                                <span style={{ fontSize: '0.85rem', color: selectedProject.margin_deviation_pct < 0 ? '#ef4444' : '#059669', fontWeight: 700 }}>Margin Deviation</span>
                                                <span style={{ fontSize: '1rem', color: selectedProject.margin_deviation_pct < 0 ? '#ef4444' : '#059669', fontWeight: 900 }}>{selectedProject.margin_deviation_pct > 0 ? '+' : ''}{selectedProject.margin_deviation_pct}%</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
"""

# Find where to insert
parts = content.split("                                    {(!selectedProject.resources || selectedProject.resources.length === 0) && (")

if len(parts) == 2:
    new_content = parts[0] + missing_content + "\n      </main>\n" + parts[1].split("      </main>\n", 1)[1]
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(new_content)
    print("Fixed successfully!")
else:
    print("Could not find insertion point!")
