import re

with open(r'c:\Users\User\OneDrive - Arche Global Private Limited\Digitrac\Digitrac\frontend\src\app\manager\page.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Add INTELLIGENCE to navItems - Wait, Manager UI uses inner tabs
content = content.replace(
    "['COSTING', 'WORKFORCE', 'OVERVIEW', 'EXTENSIONS']",
    "['COSTING', 'WORKFORCE', 'OVERVIEW', 'EXTENSIONS', 'INTELLIGENCE']"
)
content = content.replace(
    "tab === 'WORKFORCE' ? 'Workforce Budget' : tab === 'OVERVIEW' ? 'Project Overview' : 'Extensions & Governance'",
    "tab === 'WORKFORCE' ? 'Workforce Budget' : tab === 'OVERVIEW' ? 'Project Overview' : tab === 'EXTENSIONS' ? 'Extensions' : 'Intelligence Feed'"
)

# Add state
state_code = """
  const [feed, setFeed] = useState([]);
  
  useEffect(() => {
    if (innerTab === 'INTELLIGENCE') {
        fetch(`${API}/intelligence/feed`, { headers: { Authorization: `Bearer ${tok()}` } })
            .then(res => res.json())
            .then(data => setFeed(data.filter(e => e.project_id === selectedProject?.id)))
            .catch(console.error);
    }
  }, [innerTab, selectedProject]);
"""

content = content.replace("const unreadCount = notifications.filter(n => !n.is_read).length;", state_code + "\n  const unreadCount = notifications.filter(n => !n.is_read).length;")

# Add INTELLIGENCE Tab Content
intel_content = """
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
"""

content = content.replace("{innerTab === 'OVERVIEW' && (", intel_content + "\n                        {innerTab === 'OVERVIEW' && (")

with open(r'c:\Users\User\OneDrive - Arche Global Private Limited\Digitrac\Digitrac\frontend\src\app\manager\page.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated Manager UI for Intelligence")
