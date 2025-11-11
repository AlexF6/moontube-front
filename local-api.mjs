// local-api.cjs
const express = require('express');

const UPSTREAM = process.env.BACKEND_URL;
if (!UPSTREAM) {
  console.error('❌ BACKEND_URL no está configurada');
  process.exit(1);
}

const HOP = new Set([
  'connection','keep-alive','proxy-authenticate','proxy-authorization',
  'te','trailer','transfer-encoding','upgrade','host'
]);

const app = express();

app.all('/api/*', async (req, res) => {
  try {
    // path después de /api/
    const tail = req.params[0] || '';
    const segs = tail ? tail.split('/') : [];
    const path = '/' + segs.map(encodeURIComponent).join('/');

    const query = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
    const url = UPSTREAM.replace(/\/+$/, '') + path + query;

    const headers = {};
    for (const [k, v] of Object.entries(req.headers)) {
      const key = k.toLowerCase();
      if (HOP.has(key)) continue;
      if (Array.isArray(v)) headers[key] = v.join(', ');
      else if (typeof v === 'string') headers[key] = v;
    }

    const method = (req.method || 'GET').toUpperCase();
    const hasBody = !['GET','HEAD'].includes(method);

    const upstream = await fetch(url, {
      method,
      headers,
      body: hasBody ? req : undefined,
    });

    // copia headers (excepto hop-by-hop). set-cookie aparte
    upstream.headers.forEach((val, key) => {
      const k = key.toLowerCase();
      if (!HOP.has(k) && k !== 'set-cookie') res.setHeader(key, val);
    });
    const setCookies = upstream.headers.getSetCookie?.();
    if (setCookies && setCookies.length) res.setHeader('set-cookie', setCookies);

    const buf = Buffer.from(await upstream.arrayBuffer());
    res.status(upstream.status).send(buf);
  } catch (e) {
    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.status(502).end(JSON.stringify({ error: 'Bad gateway', detail: String(e?.message ?? e) }));
  }
});

app.get('/api/__ping', (_req, res) => {
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.status(200).end(JSON.stringify({ ok: true }));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Local API proxy: http://localhost:${PORT}/api/__ping  → ${UPSTREAM}`);
});
