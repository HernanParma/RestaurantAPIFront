const isLocal = ['localhost', '127.0.0.1'].includes(location.hostname) || location.protocol === 'file:';
const API_BASE = isLocal ? 'https://localhost:7266/api/v1' : 'https://tu-dominio-de-api.com/api/v1';

const $ = (s, r = document) => r.querySelector(s);

async function http(url, { method = 'GET', params = null, body = null, headers = {}, timeoutMs = 10000 } = {}) {
  const u = new URL(url);
  if (params) Object.entries(params).forEach(([k, v]) => v !== '' && v != null && u.searchParams.set(k, v));
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort('timeout'), timeoutMs);
  try {
    const res = await fetch(u, {
      method,
      headers: { Accept: 'application/json', ...(body ? { 'Content-Type': 'application/json' } : {}), ...headers },
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

const api = {
  get: (p, q) => http(API_BASE + p, { params: q }),
  post: (p, b) => http(API_BASE + p, { method: 'POST', body: b })
};

function showAlert(kind, text) {
  const box = $('#adminAlert');
  box.className = `alert alert-${kind}`;
  box.textContent = text;
  box.classList.remove('d-none');
  setTimeout(() => box.classList.add('d-none'), 3500);
}

async function loadCategories() {
  try {
    const data = await api.get('/Category');
    const sel = $('#dishCategory');
    sel.innerHTML = '';
    data.sort((a, b) => (a.order ?? 999) - (b.order ?? 999)).forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = c.name;
      sel.appendChild(opt);
    });
  } catch (err) {
    console.error(err);
    showAlert('danger', 'No pude cargar categorías: ' + err.message);
  }
}

async function submitDishForm(e) {
  e.preventDefault();
  const name = $('#dishName').value.trim();
  const rawPrice = $('#dishPrice').value.trim();
  const normalized = rawPrice.replace(/\./g, '').replace(',', '.');
  const price = Number.parseFloat(normalized);
  const categoryId = $('#dishCategory').value;
  const description = $('#dishDesc').value.trim();
  const image = $('#dishImage').value.trim();

  if (!name || isNaN(price) || !categoryId || !description || !image) {
    showAlert('warning', 'Completá todos los campos.');
    return;
  }

  const payload = { name, description, price, categoryId, image };

  try {
    await api.post('/Dish', payload);
    $('#dishForm').reset();
    await loadCategories();
    showAlert('success', 'Plato creado correctamente.');
  } catch (err) {
    console.error(err);
    showAlert('danger', 'No se pudo crear el plato: ' + err.message);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadCategories();
  $('#dishForm').addEventListener('submit', submitDishForm);
});
