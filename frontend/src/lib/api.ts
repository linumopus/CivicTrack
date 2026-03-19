import { env } from './env';

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

function getBaseUrl() {
  // Single-port setup: default to same-origin (no env needed).
  if (!env.apiBaseUrl) return '';
  return env.apiBaseUrl.replace(/\/$/, '');
}

export async function apiFetch<T>(
  path: string,
  opts?: { method?: HttpMethod; body?: unknown; token?: string }
): Promise<T> {
  const url = `${getBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: opts?.method ?? 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(opts?.token ? { Authorization: `Bearer ${opts.token}` } : {}),
      },
      body: opts?.body ? JSON.stringify(opts.body) : undefined,
    });
  } catch (e) {
    throw new ApiError(
      e instanceof Error ? e.message : 'Network error',
      0,
      null
    );
  }

  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? (JSON.parse(text) as unknown) : null;
  } catch {
    data = text || null;
  }
  if (!res.ok) {
    const message =
      data && typeof data === 'object' && 'message' in (data as any)
        ? String((data as any).message)
        : `Request failed (${res.status})`;
    throw new ApiError(message, res.status, data);
  }
  return data as T;
}

