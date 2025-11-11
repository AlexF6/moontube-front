export const config = { runtime: 'edge' };

const HOP_BY_HOP = new Set([
  'connection','keep-alive','proxy-authenticate','proxy-authorization',
  'te','trailers','transfer-encoding','upgrade','host','content-length'
]);

export default async function handler(req: Request): Promise<Response> {
  const UPSTREAM = process.env.BACKEND_URL;
  if (!UPSTREAM) {
    return new Response(JSON.stringify({ error: 'Backend URL not configured' }), {
      status: 500, headers: { 'content-type': 'application/json' }
    });
  }

  try {
    const url = new URL(req.url);
    // /api/foo/bar -> /foo/bar
    const path = '/' + url.pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean).join('/');

    const target = new URL(UPSTREAM);
    target.pathname = (target.pathname.replace(/\/+$/, '') + path).replace(/\/{2,}/g, '/');
    target.search = url.search;

    // Copia headers sin hop-by-hop
    const fwd = new Headers();
    req.headers.forEach((v, k) => { if (!HOP_BY_HOP.has(k.toLowerCase())) fwd.set(k, v); });

    const method = req.method.toUpperCase();
    const hasBody = method !== 'GET' && method !== 'HEAD';

    const upstream = await fetch(target.toString(), {
      method, headers: fwd, body: hasBody ? req.body : undefined, redirect: 'manual'
    });

    const respHeaders = new Headers();
    respHeaders.set('x-proxy-target', target.toString()); // DEBUG
    upstream.headers.forEach((v, k) => { if (!HOP_BY_HOP.has(k.toLowerCase())) respHeaders.set(k, v); });

    return new Response(upstream.body, { status: upstream.status, headers: respHeaders });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: 'Bad gateway', detail: String(err?.message ?? err) }), {
      status: 502, headers: { 'content-type': 'application/json' }
    });
  }
}
