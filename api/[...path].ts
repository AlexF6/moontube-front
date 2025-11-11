// api/[...path].ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

const UPSTREAM = process.env.BACKEND_URL;

// Hop-by-hop headers que NO deben reenviarse ni devolverse
const HOP = new Set([
  'connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization',
  'te', 'trailer', 'transfer-encoding', 'upgrade'
]);

export const config = {
  runtime: 'nodejs',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Healthcheck opcional
    if (Array.isArray(req.query.path) && req.query.path[0] === '__ping') {
      res.setHeader('content-type', 'application/json; charset=utf-8');
      res.status(200).end(JSON.stringify({ ok: true, upstream: UPSTREAM ?? null }));
      return;
    }

    if (!UPSTREAM) {
      res.setHeader('content-type', 'application/json; charset=utf-8');
      res.status(500).end(JSON.stringify({ error: 'BACKEND_URL not configured' }));
      return;
    }

    // Construir ruta y query: /api/foo/bar?x=1 => /foo/bar?x=1
    const segs = (req.query.path ?? []) as string[];
    const path = '/' + segs.map(encodeURIComponent).join('/');
    const query = req.url && req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
    const url = UPSTREAM.replace(/\/+$/, '') + path + query;

    // Reenviar headers seguros (sin hop-by-hop ni host)
    const forwardHeaders: Record<string, string> = {};
    for (const [k, v] of Object.entries(req.headers)) {
      const key = k.toLowerCase();
      if (HOP.has(key) || key === 'host') continue;
      if (Array.isArray(v)) forwardHeaders[key] = v.join(', ');
      else if (typeof v === 'string') forwardHeaders[key] = v;
    }

    // Pasar IP/host originales
    if (req.headers['x-forwarded-for']) {
      forwardHeaders['x-forwarded-for'] = String(req.headers['x-forwarded-for']);
    }
    forwardHeaders['x-forwarded-proto'] = (req.headers['x-forwarded-proto'] as string) || 'https';
    forwardHeaders['x-forwarded-host']  = (req.headers['x-forwarded-host'] as string)  || req.headers.host || '';

    const method = (req.method || 'GET').toUpperCase();
    const hasBody = !['GET', 'HEAD'].includes(method);

    // Proxy → upstream
    const upstream = await fetch(url, {
      method,
      headers: forwardHeaders,
      body: hasBody ? (req as any) : undefined, // stream del body
      // Importante para cookies de sesión
      redirect: 'manual',
    });

    // Copiar headers de respuesta (excepto hop-by-hop). Manejo de Set-Cookie aparte.
    upstream.headers.forEach((val, key) => {
      const k = key.toLowerCase();
      if (!HOP.has(k) && k !== 'set-cookie') res.setHeader(key, val);
    });

    // Copiar cookies de forma segura
    // @ts-ignore: getSetCookie está en undici en runtime de Vercel
    const setCookies: string[] | undefined = upstream.headers.getSetCookie?.();
    if (setCookies?.length) res.setHeader('set-cookie', setCookies);

    // Si upstream falla, devolver cuerpo para debug (recortado)
    if (!upstream.ok) {
      const text = await upstream.text();
      res.setHeader('content-type', 'application/json; charset=utf-8');
      res.status(upstream.status).end(JSON.stringify({
        proxy_error: true,
        status: upstream.status,
        url,
        body: text.slice(0, 5000),
      }));
      return;
    }

    // Enviar tal cual el cuerpo a cliente
    const buf = Buffer.from(await upstream.arrayBuffer());
    res.status(upstream.status).send(buf);
  } catch (e: any) {
    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.status(502).end(JSON.stringify({ error: 'Bad gateway', detail: String(e?.message ?? e) }));
  }
}
