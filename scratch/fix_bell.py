import re

with open(r'c:\Users\User\OneDrive - Arche Global Private Limited\Digitrac\Digitrac\frontend\src\app\vp\page.js', 'r', encoding='utf-8') as f:
    content = f.read()

bell_icon = '  Logout: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,\n  Bell: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>'

content = content.replace('  Logout: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>', bell_icon)

with open(r'c:\Users\User\OneDrive - Arche Global Private Limited\Digitrac\Digitrac\frontend\src\app\vp\page.js', 'w', encoding='utf-8') as f:
    f.write(content)
