// ui/shared/http.js
const API_BASE = (location.hostname === 'localhost' || location.hostname === '127.0.0.1' || location.protocol === 'file:')
  ? 'https://localhost:7266/api/v1'
  : 'https://tu-dominio-de-api.com/api/v1';

export async function http(path, { method='GET', params=null, body=null, headers={}, timeoutMs=10000 } = {}) {
  const q = params
    ? '?' + Object.entries(params).filter(([,v]) => v !== '' && v != null)
        .map(([k,v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join('&')
    : '';
  const url = API_BASE + path + q;

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort('timeout'), timeoutMs);

  try {
    const res = await fetch(url, {
      method,
      headers: { Accept:'application/json', ...(body ? { 'Content-Type':'application/json' } : {}), ...headers },
      body: body ? JSON.stringify(body) : null,
    });
    if (!res.ok) {
      let msg = `${res.status} ${res.statusText}`;
      try { const j = await res.json(); msg = j.detail || j.title || j.message || msg; } catch {}
      throw new Error(msg);
    }
    return res.status === 204 ? null : res.json();
  } finally {
    clearTimeout(t);
  }
}
