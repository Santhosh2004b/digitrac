import re

with open(r'c:\Users\User\OneDrive - Arche Global Private Limited\Digitrac\Digitrac\frontend\src\app\vp\page.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Add INTELLIGENCE to navItems
content = content.replace(
    "    { id: 'APPROVALS', label: 'GOVERNANCE', sub: 'APPROVALS & ALERTS', icon: <Icons.Folder /> }",
    "    { id: 'APPROVALS', label: 'GOVERNANCE', sub: 'APPROVALS & ALERTS', icon: <Icons.Folder /> },\n    { id: 'INTELLIGENCE', label: 'MISSION INTELLIGENCE', sub: 'LIVE FEED', icon: <Icons.Bell /> }"
)

# Add State for intelligence feed
state_code = """
  const [feed, setFeed] = useState([]);
  const [feedFilter, setFeedFilter] = useState('');
  
  useEffect(() => {
    if (activeTab === 'INTELLIGENCE') {
        const url = feedFilter ? `${API}/intelligence/feed?category=${feedFilter}` : `${API}/intelligence/feed`;
        fetch(url, { headers: { Authorization: `Bearer ${tok()}` } })
            .then(res => res.json())
            .then(data => setFeed(data))
            .catch(console.error);
    }
  }, [activeTab, feedFilter]);
"""

content = content.replace("useEffect(() => {", state_code + "\n  useEffect(() => {")

# Add INTELLIGENCE Tab Content
intel_content = """
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
                {feed.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>No intelligence events match criteria.</div>
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
"""

content = content.replace("</div>\n    </div>\n  );\n}", intel_content + "      </div>\n    </div>\n  );\n}")

with open(r'c:\Users\User\OneDrive - Arche Global Private Limited\Digitrac\Digitrac\frontend\src\app\vp\page.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated VP UI for Intelligence")
