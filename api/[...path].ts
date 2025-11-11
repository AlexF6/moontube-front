import type { VercelRequest, VercelResponse } from '@vercel/node';

const UPSTREAM = process.env.BACKEND_URL;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (!UPSTREAM) {
      res.status(500).json({ error: 'Backend URL not configured' });
      return;
    }

    const qp = req.query?.path;
    const segments = Array.isArray(qp) ? qp : qp ? [qp] : [];
    const path = '/' + segments.join('/');

    // Get the full URL to extract query parameters
    const fullUrl = req.url || '';
    const query = fullUrl.includes('?') ? fullUrl.substring(fullUrl.indexOf('?')) : '';
    const targetUrl = `${UPSTREAM}${path}${query}`;

    const hopByHop = new Set([
      'connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization',
      'te', 'trailers', 'transfer-encoding', 'upgrade', 'host', 'content-length'
    ]);

    const headers: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.headers)) {
      if (!value) continue;
      if (hopByHop.has(key.toLowerCase())) continue;
      headers[key] = Array.isArray(value) ? value.join(',') : value as string;
    }

    const method = (req.method || 'GET').toUpperCase();
    const hasBody = method !== 'GET' && method !== 'HEAD';

    const upstreamResp = await fetch(targetUrl, {
      method,
      headers,
      body: hasBody && req.body ? JSON.stringify(req.body) : undefined,
      redirect: 'manual'
    });

    // Copy headers from upstream response
    upstreamResp.headers.forEach((value: string, key: string) => {
      if (!hopByHop.has(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    });

    res.status(upstreamResp.status);

    // Handle different response types
    const contentType = upstreamResp.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      const data = await upstreamResp.json();
      res.json(data);
    } else if (contentType?.includes('text/')) {
      const text = await upstreamResp.text();
      res.send(text);
    } else {
      const arrayBuffer = await upstreamResp.arrayBuffer();
      res.send(Buffer.from(arrayBuffer));
    }
  } catch (err) {
    console.error('Proxy error:', err);
    res.status(502).json({ 
      error: 'Bad gateway', 
      detail: err instanceof Error ? err.message : String(err) 
    });
  }
}