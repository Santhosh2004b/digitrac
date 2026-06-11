import re

with open(r'c:\Users\User\OneDrive - Arche Global Private Limited\Digitrac\Digitrac\frontend\src\app\vp\page.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add APPROVALS to navItems
content = content.replace(
    "    { id: 'ASSIGNMENT', label: 'PROJECT ASSIGNMENT', sub: 'NEW PROJECT', icon: <Icons.Check /> }",
    "    { id: 'ASSIGNMENT', label: 'PROJECT ASSIGNMENT', sub: 'NEW PROJECT', icon: <Icons.Check /> },\n    { id: 'APPROVALS', label: 'GOVERNANCE', sub: 'APPROVALS & ALERTS', icon: <Icons.Folder /> }"
)

# Also need to import Icons.Folder if not present. Icons object doesn't have Folder.
icon_folder = "Folder: () => <svg width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" strokeWidth=\"2.5\"><path d=\"M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z\"></path></svg>,\n"
content = content.replace("const Icons = {", "const Icons = {\n  " + icon_folder)

# 2. Add State for governance
state_code = """
  const [requests, setRequests] = useState([]);
  const [escalations, setEscalations] = useState([]);
  
  useEffect(() => {
    if (activeTab === 'APPROVALS') {
        fetch(`${API}/workflow/requests`, { headers: { Authorization: `Bearer ${tok()}` } })
            .then(res => res.json())
            .then(data => setRequests(data))
            .catch(console.error);
        fetch(`${API}/workflow/escalations`, { headers: { Authorization: `Bearer ${tok()}` } })
            .then(res => res.json())
            .then(data => setEscalations(data))
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
          setRequests(await res.json());
      } catch (e) {
          alert('Action failed');
      }
  };
"""

content = content.replace("const [portfolio, setPortfolio] = useState([]);", "const [portfolio, setPortfolio] = useState([]);\n" + state_code)


# 3. Add APPROVALS Tab Content
approvals_content = """
        {activeTab === 'APPROVALS' && (
          <div style={{ padding: '0 1rem' }}>
            <div style={{ marginBottom: '2rem' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>Governance Hub</h1>
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.5rem' }}>Review requests and automated margin escalations.</p>
            </div>

            {/* Dashboard Widgets */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', borderLeft: '4px solid #2563eb' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', marginBottom: '0.5rem' }}>OPEN REQUESTS</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>{requests.filter(r => r.status === 'PENDING').length}</div>
                </div>
                <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', borderLeft: '4px solid #ef4444' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', marginBottom: '0.5rem' }}>ACTIVE ESCALATIONS</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>{escalations.filter(e => e.status === 'OPEN').length}</div>
                </div>
                <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', borderLeft: '4px solid #10b981' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', marginBottom: '0.5rem' }}>APPROVED</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>{requests.filter(r => r.status === 'APPROVED').length}</div>
                </div>
                <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', borderLeft: '4px solid #f59e0b' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', marginBottom: '0.5rem' }}>PROJECTS AT RISK</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>{portfolio.filter(p => p.status === 'Orange').length}</div>
                </div>
            </div>

            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>Active Escalations</h3>
            <div style={{ background: '#fff', border: '1px solid #fecaca', borderRadius: '12px', overflow: 'hidden', marginBottom: '2rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead style={{ background: '#fef2f2' }}>
                      <tr>
                          <th style={{ padding: '1rem', fontSize: '0.7rem', fontWeight: 700, color: '#991b1b' }}>PROJECT</th>
                          <th style={{ padding: '1rem', fontSize: '0.7rem', fontWeight: 700, color: '#991b1b' }}>TRIGGER REASON</th>
                          <th style={{ padding: '1rem', fontSize: '0.7rem', fontWeight: 700, color: '#991b1b' }}>MARGIN (T / C / F)</th>
                          <th style={{ padding: '1rem', fontSize: '0.7rem', fontWeight: 700, color: '#991b1b' }}>DATE</th>
                          <th style={{ padding: '1rem', fontSize: '0.7rem', fontWeight: 700, color: '#991b1b' }}>STATUS</th>
                      </tr>
                  </thead>
                  <tbody>
                      {escalations.length === 0 && <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No active escalations.</td></tr>}
                      {escalations.map((e, i) => (
                          <tr key={i} style={{ borderTop: '1px solid #fecaca' }}>
                              <td style={{ padding: '1rem', fontSize: '0.8rem', fontWeight: 600, color: '#7f1d1d' }}>{e.project_name}</td>
                              <td style={{ padding: '1rem', fontSize: '0.8rem', color: '#991b1b' }}>{e.trigger_reason}</td>
                              <td style={{ padding: '1rem', fontSize: '0.8rem', color: '#7f1d1d' }}>{e.target_margin}% / {e.current_margin}% / {e.forecast_margin}%</td>
                              <td style={{ padding: '1rem', fontSize: '0.8rem', color: '#991b1b' }}>{new Date(e.created_at).toLocaleDateString()}</td>
                              <td style={{ padding: '1rem', fontSize: '0.8rem', fontWeight: 700, color: e.status === 'OPEN' ? '#ef4444' : '#059669' }}>{e.status}</td>
                          </tr>
                      ))}
                  </tbody>
              </table>
            </div>

            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>Pending Requests Queue</h3>
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead style={{ background: '#f8fafc' }}>
                      <tr>
                          <th style={{ padding: '1rem', fontSize: '0.7rem', fontWeight: 700, color: '#475569' }}>PROJECT</th>
                          <th style={{ padding: '1rem', fontSize: '0.7rem', fontWeight: 700, color: '#475569' }}>TYPE</th>
                          <th style={{ padding: '1rem', fontSize: '0.7rem', fontWeight: 700, color: '#475569' }}>DETAILS</th>
                          <th style={{ padding: '1rem', fontSize: '0.7rem', fontWeight: 700, color: '#475569' }}>JUSTIFICATION</th>
                          <th style={{ padding: '1rem', fontSize: '0.7rem', fontWeight: 700, color: '#475569' }}>STATUS</th>
                          <th style={{ padding: '1rem', fontSize: '0.7rem', fontWeight: 700, color: '#475569', textAlign: 'right' }}>ACTION</th>
                      </tr>
                  </thead>
                  <tbody>
                      {requests.length === 0 && <tr><td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No requests found.</td></tr>}
                      {requests.map((r, i) => (
                          <tr key={i} style={{ borderTop: '1px solid #e2e8f0' }}>
                              <td style={{ padding: '1rem', fontSize: '0.8rem', fontWeight: 600, color: '#0f172a' }}>{r.project_name}</td>
                              <td style={{ padding: '1rem', fontSize: '0.8rem', color: '#2563eb', fontWeight: 600 }}>{r.type.replace('_', ' ')}</td>
                              <td style={{ padding: '1rem', fontSize: '0.8rem', color: '#475569' }}>
                                  {r.type === 'ADDITIONAL_HOURS' ? `+${r.requested_additional_hours} Hrs` : `Extend to ${new Date(r.requested_end_date).toLocaleDateString()}`}
                              </td>
                              <td style={{ padding: '1rem', fontSize: '0.8rem', color: '#475569', maxWidth: '200px' }}>{r.reason}</td>
                              <td style={{ padding: '1rem', fontSize: '0.8rem', fontWeight: 700, color: r.status === 'PENDING' ? '#f59e0b' : r.status === 'APPROVED' ? '#10b981' : '#ef4444' }}>{r.status}</td>
                              <td style={{ padding: '1rem', textAlign: 'right' }}>
                                  {r.status === 'PENDING' && (
                                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                          <button onClick={() => handleRequestAction(r.id, 'APPROVE')} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer' }}>Approve</button>
                                          <button onClick={() => handleRequestAction(r.id, 'REJECT')} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer' }}>Reject</button>
                                      </div>
                                  )}
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
            </div>
          </div>
        )}
"""

content = content.replace("</div>\n    </div>\n  );\n}", approvals_content + "      </div>\n    </div>\n  );\n}")

with open(r'c:\Users\User\OneDrive - Arche Global Private Limited\Digitrac\Digitrac\frontend\src\app\vp\page.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated Coordinator UI")
