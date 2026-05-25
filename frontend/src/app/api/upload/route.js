import { NextResponse } from 'next/server';

export async function POST(request) {
  console.log('[PROXY] Received upload request');
  try {
    const authHeader = request.headers.get('authorization');
    const contentType = request.headers.get('content-type');
    
    if (!contentType || !contentType.includes('multipart/form-data')) {
      return NextResponse.json({ detail: 'Invalid Content-Type' }, { status: 400 });
    }

    const rawBody = await request.arrayBuffer();
    console.log('[PROXY] Forwarding to backend, body size:', rawBody.byteLength);

    const response = await fetch('http://127.0.0.1:8000/excel/upload', {
      method: 'POST',
      headers: {
        'Content-Type': contentType,
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: rawBody,
    });

    const text = await response.text();
    console.log('[PROXY] Backend responded with status:', response.status);
    
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { detail: text || `Backend returned non-JSON response (HTTP ${response.status})` };
    }

    return NextResponse.json(data, { status: response.ok ? 200 : response.status });
  } catch (error) {
    console.error('[PROXY ERROR]', error);
    return NextResponse.json(
      { detail: `Internal Proxy Error: ${error.message}` },
      { status: 500 }
    );
  }
}
