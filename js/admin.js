// ui/pages/admin/admin.js
const isLocal = ['localhost', '127.0.0.1'].includes(location.hostname) || location.protocol === 'file:';
const API_BASE = isLocal ? 'https://localhost:7266/api/v1' : 'https://tu-dominio-de-api.com/api/v1';
const $ = (s, r = document) => r.querySelector(s);

/* Normalizador de payload (convierte categoryId -> category y los parsea) */
function normalizeDishPayload(body) {
  const out = { ...body };
  if ('categoryId' in out && !('category' in out)) {
    out.category = out.categoryId;
    delete out.categoryId;
  }
  if (typeof out.category === 'string') {
    const n = Number.parseInt(out.category, 10);
    if (Number.isFinite(n)) out.category = n;
  }
  if (typeof out.price === 'string') {
    const p = Number.parseFloat(out.price);
    if (Number.isFinite(p)) out.price = p;
  }
  return out;
}

/* HTTP helper */
async function http(path, { method = 'GET', params = null, body = null, headers = {}, timeoutMs = 10000 } = {}) {
  const q = params
    ? '?' + Object.entries(params).filter(([, v]) => v !== '' && v != null)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&')
    : '';
  const url = API_BASE + path + q;

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort('timeout'), timeoutMs);

  try {
    let finalBody = body;
    if (body && typeof body === 'object' && method !== 'GET' && /\/Dish$/i.test(path)) {
      finalBody = normalizeDishPayload(body);
    }

    console.log(`[HTTP] ${method} ${url}`);
    if (finalBody != null) { console.log('FINAL BODY SENT ->'); console.table(finalBody); }

    const res = await fetch(url, {
      method,
      headers: { Accept: 'application/json', ...(finalBody ? { 'Content-Type': 'application/json' } : {}), ...headers },
      body: finalBody ? JSON.stringify(finalBody) : null
    });

    if (!res.ok) {
      let msg = `${res.status} ${res.statusText}`;
      try { const j = await res.json(); msg = j.detail || j.title || j.message || msg; } catch {}
      throw new Error(msg);
    }
    return res.status === 204 ? null : res.json();
  } finally { clearTimeout(t); }
}

function showAlert(kind, text) {
  const box = $('#adminAlert');
  box.className = `alert alert-${kind}`;
  box.textContent = text;
  box.classList.remove('d-none');
  setTimeout(() => box.classList.add('d-none'), 4000);
}

/* Cargar categorías */
async function loadCategories() {
  try {
    const data = await http('/Category');
    const sel = $('#dishCategory');
    sel.innerHTML = '';
    data.sort((a, b) => (a.order ?? 999) - (b.order ?? 999)).forEach(c => {
      const opt = document.createElement('option');
      opt.value = String(c.id);
      opt.textContent = c.name;
      sel.appendChild(opt);
    });
  } catch (err) { console.error(err); showAlert('danger', 'No pude cargar categorías: ' + err.message); }
}

/* Submit crear plato */
async function submitDishForm(e) {
  e.preventDefault();
  e.stopPropagation();
  if (e.stopImmediatePropagation) e.stopImmediatePropagation();

  const name = $('#dishName').value.trim();
  const price = Number.parseFloat($('#dishPrice').value.trim().replace(/\./g, '').replace(',', '.'));
  const category = Number.parseInt($('#dishCategory').value, 10);
  const description = $('#dishDesc').value.trim();
  const image = $('#dishImage').value.trim();

  if (!name) return showAlert('warning', 'Ingresá un nombre.');
  if (!Number.isFinite(price) || price < 0) return showAlert('warning', 'Precio inválido.');
  if (!Number.isInteger(category) || category <= 0) return showAlert('warning', 'Elegí una categoría válida.');
  if (!description) return showAlert('warning', 'Ingresá una descripción.');
  if (!image) return showAlert('warning', 'Ingresá la URL de imagen.');

  const payload = { name, description, price, category, image };

  try {
    const created = await http('/Dish', { method: 'POST', body: payload });
    console.log('CREATED:', created);
    $('#dishForm').reset();
    showAlert('success', 'Plato creado correctamente.');
  } catch (err) {
    console.error('Cr
