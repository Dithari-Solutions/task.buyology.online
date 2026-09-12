import { NextResponse, type NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

const BACKEND = (process.env.BACKEND_URL || 'http://localhost:8080').replace(/\/+$/, '');

/**
 * Server-side proxy: the browser only ever talks to this app's own origin and the
 * Spring Boot API can stay on a private port. Every /api/* call is forwarded as-is.
 */
async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const target = `${BACKEND}/api/${path.join('/')}${request.nextUrl.search}`;

  const headers = new Headers();
  const authorization = request.headers.get('authorization');
  const contentType = request.headers.get('content-type');
  if (authorization) headers.set('authorization', authorization);
  if (contentType) headers.set('content-type', contentType);
  headers.set('accept', 'application/json');

  const method = request.method.toUpperCase();
  const body = method === 'GET' || method === 'HEAD' ? undefined : await request.text();

  try {
    const response = await fetch(target, { method, headers, body, cache: 'no-store' });
    const payload = await response.text();
    if (!payload) {
      return new NextResponse(null, { status: response.status });
    }
    return new NextResponse(payload, {
      status: response.status,
      headers: { 'content-type': response.headers.get('content-type') || 'application/json' },
    });
  } catch {
    return NextResponse.json(
      { status: 502, error: 'Bad Gateway', message: 'The Buyology Kanban API is not reachable right now.' },
      { status: 502 },
    );
  }
}

export {
  proxy as GET,
  proxy as POST,
  proxy as PUT,
  proxy as PATCH,
  proxy as DELETE,
  proxy as HEAD,
};
