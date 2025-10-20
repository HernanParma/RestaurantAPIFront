export const isLocalHost =
  location.hostname === 'localhost' ||
  location.hostname === '127.0.0.1' ||
  location.port === '5500';

export const API_BASE = isLocalHost
  ? 'https://localhost:7266/api/v1'
  : 'https://tu-dominio-de-api.com/api/v1';

export async function http(url, { method='GET', params=null, body=null, headers={}, timeoutMs=10000 }={}) {
  const u = new URL(url);
  if (params) Object.entries(params).forEach(([k,v]) => v!=='' && v!=null && u.searchParams.set(k, v));
  const ctrl = new AbortController();
  const t = setTimeout(()=>ctrl.abort('timeout'), timeoutMs);
  try {
    const res = await fetch(u, {
      method,
      headers: { Accept:'application/json', ...(body?{'Content-Type':'application/json'}:{}), ...headers },
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

let dishesCache = null;
export async function ensureDishes() {
  if (dishesCache) return dishesCache;
  dishesCache = await http(API_BASE + '/Dish');
  return dishesCache;
}

export async function addItemToOrder(orderId, dishId, quantity, notes) {
  return http(API_BASE + `/Order/${orderId}`, {
    method: 'PATCH',
    body: { items: [{ op:'add', dishId, quantity, notes }] }
  });
}
