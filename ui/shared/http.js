import { API_BASE } from './env.js';

export async function http(pathOrUrl, { method='GET', params=null, body=null, headers={}, timeoutMs=10000, credentials='include' } = {}) {
  const isAbsolute = /^https?:\/\//i.test(pathOrUrl);
  const base = isAbsolute ? '' : API_BASE;
  const u = new URL(base + pathOrUrl, window.location.origin);

  if (params) {
    Object.entries(params)
      .filter(([, v]) => v !== '' && v != null)
      .forEach(([k, v]) => u.searchParams.set(k, v));
  }

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort('timeout'), timeoutMs);

  try {
    const res = await fetch(u.toString(), {
      method,
      headers: {
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...headers
      },
      body: body ? JSON.stringify(body) : null,
      signal: ctrl.signal,
      credentials
    });

    if (!res.ok) {
      let msg = `${res.status} ${res.statusText}`;
      try {
        const j = await res.json();
        msg = j.detail || j.title || j.message || j.error || msg;
      } catch {}
      throw new Error(msg);
    }

    return res.status === 204 ? null : res.json();
  } finally {
    clearTimeout(t);
  }
}
