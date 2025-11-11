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

// NO uses app.use(express.json()) ni urlencoded(): queremos el raw body

// Utilidad: leer el body como Buffer (para Node 22 + fetch)
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

app.get('/api/__ping', (_req, res) => {
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.status(200).end(JSON.stringify({ ok: true, upstream: UPSTREAM }));
});

app.use('/api', async (req, res) => {
  try {
    // reconstruye cola tras /api (preserva query)
    const tail = req.originalUrl.replace(/^\/api/, '') || '/';
    const hasQuery = tail.includes('?');
    const [pathname, query = ''] = hasQuery ? [tail.slice(0, tail.indexOf('?')), tail.slice(tail.indexOf('?'))] : [tail, ''];
    const url = UPSTREAM.replace(/\/+$/, '') + pathname + query;

    // copiar headers, evitando hop-by-hop y host
    const headers = {};
    for (const [k, v] of Object.entries(req.headers)) {
      const key = k.toLowerCase();
      if (HOP.has(key)) continue;
      if (Array.isArray(v)) headers[key] = v.join(', ');
      else if (typeof v === 'string') headers[key] = v;
    }

    const method = (req.method || 'GET').toUpperCase();
    const hasBody = !['GET', 'HEAD'].includes(method);

    // ⚠️ bufferizamos el body para undici/WHATWG fetch (Node 22)
    const body = hasBody ? await readBody(req) : undefined;

    const upstream = await fetch(url, {
      method,
      headers,
      // pasa Buffer o undefined
      body,
    });

    // copia headers de respuesta (excepto hop-by-hop); maneja Set-Cookie
    upstream.headers.forEach((val, key) => {
      const k = key.toLowerCase();
      if (!HOP.has(k) && k !== 'set-cookie') res.setHeader(key, val);
    });
    const setCookies = upstream.headers.getSetCookie?.();
    if (setCookies && setCookies.length) res.setHeader('set-cookie', setCookies);

    // pasa status tal cual (incluye 4xx/5xx del backend)
    res.status(upstream.status);

    // reenvía el cuerpo tal cual
    const buf = Buffer.from(await upstream.arrayBuffer());
    res.send(buf);
  } catch (e) {
    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.status(502).end(JSON.stringify({ error: 'Bad gateway', detail: String(e?.message ?? e) }));
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Proxy local en http://localhost:${PORT}/api/__ping  →  ${UPSTREAM}`);
});
