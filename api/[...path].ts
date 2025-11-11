// api/[...path].ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

const UPSTREAM = process.env['BACKEND_URL']; // <- bracket

const HOP = new Set([
  'connection','keep-alive','proxy-authenticate','proxy-authorization',
  'te','trailer','transfer-encoding','upgrade'
]);

export const config = { runtime: 'nodejs' }; // <- ESM OK

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const q = req.query as Record<string, string | string[] | undefined>;
    const segs = (q['path'] ?? []) as string[];

    if (Array.isArray(segs) && segs[0] === '__ping') {
      res.setHeader('content-type','application/json; charset=utf-8');
      res.status(200).end(JSON.stringify({ ok:true, upstream: UPSTREAM ?? null }));
      return;
    }

    if (!UPSTREAM) {
      res.setHeader('content-type','application/json; charset=utf-8');
      res.status(500).end(JSON.stringify({ error:'BACKEND_URL not configured' }));
      return;
    }

    const path = '/' + segs.map(encodeURIComponent).join('/');
    const query = req.url && req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
    const url = UPSTREAM.replace(/\/+$/, '') + path + query;

    const forwardHeaders: Record<string,string> = {};
    for (const [k,v] of Object.entries(req.headers)) {
      const key = k.toLowerCase();
      if (HOP.has(key) || key === 'host') continue;
      if (Array.isArray(v)) forwardHeaders[key] = v.join(', ');
      else if (typeof v === 'string') forwardHeaders[key] = v;
    }
    if (req.headers['x-forwarded-for']) forwardHeaders['x-forwarded-for'] = String(req.headers['x-forwarded-for']);
    forwardHeaders['x-forwarded-proto'] = (req.headers['x-forwarded-proto'] as string) || 'https';
    forwardHeaders['x-forwarded-host']  = (req.headers['x-forwarded-host'] as string) || req.headers.host || '';

    const method = (req.method || 'GET').toUpperCase();
    const hasBody = !['GET','HEAD'].includes(method);

    const upstream = await fetch(url, {
      method, headers: forwardHeaders, body: hasBody ? (req as any) : undefined, redirect: 'manual'
    });

    upstream.headers.forEach((val,key) => {
      const k = key.toLowerCase();
      if (!HOP.has(k) && k !== 'set-cookie') res.setHeader(key, val);
    });
    // @ts-ignore
    const setCookies: string[] | undefined = upstream.headers.getSetCookie?.();
    if (setCookies?.length) res.setHeader('set-cookie', setCookies);

    if (!upstream.ok) {
      const text = await upstream.text();
      res.setHeader('content-type','application/json; charset=utf-8');
      res.status(upstream.status).end(JSON.stringify({ proxy_error:true, status: upstream.status, url, body: text.slice(0,5000) }));
      return;
    }

    const buf = Buffer.from(await upstream.arrayBuffer());
    res.status(upstream.status).send(buf);
  } catch (e:any) {
    res.setHeader('content-type','application/json; charset=utf-8');
    res.status(502).end(JSON.stringify({ error:'Bad gateway', detail: String(e?.message ?? e) }));
  }
}
