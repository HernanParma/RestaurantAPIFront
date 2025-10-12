import { API_BASE } from './env.js';

const toQuery = (obj = {}) =>
  Object.entries(obj)
    .filter(([, v]) => v !== '' && v != null)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');

export async function http(path, {
  method = 'GET',
  params = null,
  body = null,
  headers = {},
  timeoutMs = 10000
} = {}) {
  const url = `${API_BASE}${path}${params ? `?${toQuery(params)}` : ''}`;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort('timeout'), timeoutMs);

  try {
    const res = await fetch(url, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...headers
      },
      body: body ? JSON.stringify(body) : null,
      signal: ctrl.signal,
      credentials: 'include'
    });

    if (!res.ok) {
      let msg = `${res.status} ${res.statusText}`;
      try { const j = await res.json(); msg = j.message || j.error || msg; } catch {}
      throw new Error(msg);
    }

    return res.status === 204 ? null : res.json();
  } finally {
    clearTimeout(t);
  }
}

export const api = {
  get: (p, q) => http(p, { params: q }),
  post: (p, b) => http(p, { method: 'POST', body: b }),
  patch: (p, b) => http(p, { method: 'PATCH', body: b }),
  del: (p) => http(p, { method: 'DELETE' })
};
