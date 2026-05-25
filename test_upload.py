import urllib.request, io, json, pandas as pd

# Step 1: login to get token
login_data = json.dumps({'email': 'vp@digitrac.com', 'password': 'vp123'}).encode()
req = urllib.request.Request('http://127.0.0.1:8000/auth/login', data=login_data)
req.add_header('Content-Type', 'application/json')
try:
    with urllib.request.urlopen(req) as r:
        token_data = json.loads(r.read())
        token = token_data.get('access_token', '')
        print('Token obtained:', bool(token))
except Exception as e:
    print('Login failed:', e)
    token = ''

if not token:
    exit(1)

# Step 2: create dummy excel
headers = [
    'Sl.No', 'SAP Material ID', 'Description', 'Qty', 
    'Purchase Unit Price', 'Purchase Total', 'Selling Unit Price', 'Selling Total', 
    'GM', 'GM %', 'GST%', 'GST Value', 'Net Value', 'Item Type', 
    'Sales Region', 'Practice', 'SBU', 'OEM', 'Component'
]
df = pd.DataFrame(columns=headers)
df.loc[0] = [1, 'M1', 'Test Item', 10, 100, 1000, 150, 1500, 500, '33%', '18%', 270, 1770, 'Type1', 'North', 'Prac1', 'SBU1', 'OEM1', 'Comp1']

excel_buffer = io.BytesIO()
df.to_excel(excel_buffer, index=False)
excel_data = excel_buffer.getvalue()

# Step 3: build multipart request
boundary = '----TestBoundary1234'
body = []
body.extend([
    f'--{boundary}'.encode(),
    b'Content-Disposition: form-data; name="file"; filename="test.xlsx"',
    b'Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    b'',
    excel_data
])
body.extend([
    f'--{boundary}'.encode(),
    b'Content-Disposition: form-data; name="manager_email"',
    b'',
    b'manager@digitrac.com'
])
body.append(f'--{boundary}--'.encode())
body.append(b'')
body_bytes = b'\r\n'.join(body)

req2 = urllib.request.Request('http://127.0.0.1:8000/excel/upload', data=body_bytes)
req2.add_header('Content-Type', f'multipart/form-data; boundary={boundary}')
req2.add_header('Authorization', f'Bearer {token}')

try:
    with urllib.request.urlopen(req2) as r:
        print('UPLOAD STATUS:', r.getcode())
        print('RESPONSE:', r.read().decode('utf-8')[:500])
except urllib.error.HTTPError as e:
    print('HTTP ERROR:', e.code)
    body_text = e.read().decode('utf-8')
    print('BODY:', body_text[:1000])
except Exception as e:
    print('ERROR:', type(e).__name__, str(e))
