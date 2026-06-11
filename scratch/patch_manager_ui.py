import re

with open(r'c:\Users\User\OneDrive - Arche Global Private Limited\Digitrac\Digitrac\frontend\src\app\manager\page.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add "EXTENSIONS" to tabs
content = content.replace("['COSTING', 'WORKFORCE', 'OVERVIEW']", "['COSTING', 'WORKFORCE', 'OVERVIEW', 'EXTENSIONS']")
content = content.replace("tab === 'WORKFORCE' ? 'Workforce Budget' : 'Project Overview'", "tab === 'WORKFORCE' ? 'Workforce Budget' : tab === 'OVERVIEW' ? 'Project Overview' : 'Extensions & Governance'")

# 2. Add Soft-Lock Banners inside <div style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
# right after {activeTab === 'PROJECTS' && selectedProject && ( <div>
banner_code = """
                    {selectedProject.status === 'Red' && (
                        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderLeft: '4px solid #ef4444', padding: '1rem', borderRadius: '6px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ color: '#ef4444', fontWeight: 800 }}>CRITICAL</div>
                            <div style={{ fontSize: '0.85rem', color: '#7f1d1d' }}>Project Operating Below Approved Margin Target. A Margin Escalation record has been sent to the Coordinator. You may continue operations, but please review costing immediately.</div>
                        </div>
                    )}
                    {selectedProject.status === 'Orange' && (
                        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderLeft: '4px solid #f59e0b', padding: '1rem', borderRadius: '6px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ color: '#f59e0b', fontWeight: 800 }}>WARNING</div>
                            <div style={{ fontSize: '0.85rem', color: '#92400e' }}>Margin Risk Detected. Over 50% hours consumed and margin is slipping.</div>
                        </div>
                    )}
"""
content = content.replace("{/* KPI RIBBON */}", banner_code + "\n                    {/* KPI RIBBON */}")

# 3. Add EXTENSIONS tab content
extensions_content = """
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
                                                {selectedProject.resources?.map(r => <option key={r.sap_id} value={r.id}>{r.sap_id} - {r.task_name}</option>)}
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
"""
content = content.replace("{innerTab === 'OVERVIEW' && (", extensions_content + "\n                        {innerTab === 'OVERVIEW' && (")

with open(r'c:\Users\User\OneDrive - Arche Global Private Limited\Digitrac\Digitrac\frontend\src\app\manager\page.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated Manager UI")
