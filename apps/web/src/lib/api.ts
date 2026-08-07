import type { NextRequest } from 'next/server';

/** Simple JSON responder for API routes. */
export function json(data: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    status: init?.status ?? 200,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
}

export function notFound(message = 'Not found') {
  return json({ error: message }, { status: 404 });
}

export function badRequest(message = 'Bad request') {
  return json({ error: message }, { status: 400 });
}

export function unauthorized(message = 'Unauthorized') {
  return json({ error: message }, { status: 401 });
}

export function forbidden(message = 'Forbidden') {
  return json({ error: message }, { status: 403 });
}

export function serverError(message = 'Internal server error') {
  return json({ error: message }, { status: 500 });
}

export async function readJson<T>(req: Request): Promise<T | null> {
  try {
    return (await req.json()) as T;
  } catch {
    return null;
  }
}

export function getIp(req: NextRequest): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return req.headers.get('x-real-ip') ?? 'unknown';
}

/** Extract a Bearer token from the Authorization header (desktop app). */
export function getBearerToken(req: NextRequest): string | null {
  const header = req.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) return null;
  return header.slice(7);
}
