import re

with open(r'c:\Users\User\OneDrive - Arche Global Private Limited\Digitrac\Digitrac\frontend\src\app\vp\page.js', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('.then(data => setFeed(data))', '.then(data => { if (Array.isArray(data)) setFeed(data); })')
content = content.replace('.then(data => setRequests(data))', '.then(data => { if (Array.isArray(data)) setRequests(data); })')
content = content.replace('.then(data => setEscalations(data))', '.then(data => { if (Array.isArray(data)) setEscalations(data); })')
content = content.replace('.then(data => setPortfolio(data))', '.then(data => { if (Array.isArray(data)) setPortfolio(data); })')
content = content.replace('setRequests(await res.json());', 'const d = await res.json(); if(Array.isArray(d)) setRequests(d);')

# Also fix the `portfolio` default to be an array, which it is. But just in case, I'll also add Array.isArray checks in render.
content = content.replace('portfolio.length === 0', '(!portfolio || !Array.isArray(portfolio) || portfolio.length === 0)')
content = content.replace('portfolio.map', '(Array.isArray(portfolio) ? portfolio : []).map')

content = content.replace('escalations.length === 0', '(!escalations || !Array.isArray(escalations) || escalations.length === 0)')
content = content.replace('escalations.map', '(Array.isArray(escalations) ? escalations : []).map')

content = content.replace('requests.length === 0', '(!requests || !Array.isArray(requests) || requests.length === 0)')
content = content.replace('requests.map', '(Array.isArray(requests) ? requests : []).map')

content = content.replace('feed.length === 0', '(!feed || !Array.isArray(feed) || feed.length === 0)')
content = content.replace('feed.map', '(Array.isArray(feed) ? feed : []).map')

with open(r'c:\Users\User\OneDrive - Arche Global Private Limited\Digitrac\Digitrac\frontend\src\app\vp\page.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("Robustness fixes applied to vp/page.js")
