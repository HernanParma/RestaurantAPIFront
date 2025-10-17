const isLocal = ['localhost', '127.0.0.1'].includes(location.hostname) || location.protocol === 'file:';
const API_BASE = isLocal ? 'https://localhost:7266/api/v1' : 'https://tu-dominio-de-api.com/api/v1';

const $ = (s, r=document) => r.querySelector(s);

function getEditId() {
  const p = new URLSearchParams(location.search);
  return p.get('edit');
}

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
    const p = Number.parseFloat(out.price.toString().replace(/\./g, '').replace(',', '.'));
    if (Number.isFinite(p)) out.price = p;
  }
  if (out.image && !out.imageUrl) out.imageUrl = out.image;
  return out;
}

async function http(path, { method='GET', params=null, body=null, headers={}, timeoutMs=10000 } = {}) {
  const q = params
    ? '?' + Object.entries(params)
        .filter(([,v]) => v !== '' && v != null)
        .map(([k,v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&')
    : '';
  const url = API_BASE + path + q;

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort('timeout'), timeoutMs);

  try {
    let finalBody = body;
    if (body && typeof body === 'object' && method !== 'GET' && /\/Dish(\/|$)/i.test(path)) {
      finalBody = normalizeDishPayload(body);
    }

    const res = await fetch(url, {
      method,
      headers: { Accept:'application/json', ...(finalBody ? { 'Content-Type':'application/json' } : {}), ...headers },
      body: finalBody ? JSON.stringify(finalBody) : null,
      signal: ctrl.signal
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

function showAlert(kind, text) {
  const box = $('#adminAlert');
  box.className = `alert alert-${kind}`;
  box.textContent = text;
  box.classList.remove('d-none');
  setTimeout(() => box.classList.add('d-none'), 4000);
}

async function loadCategories() {
  const data = await http('/Category');
  const sel = $('#dishCategory');
  sel.innerHTML = '';
  data
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
    .forEach(c => {
      const opt = document.createElement('option');
      opt.value = String(c.id ?? c.categoryId ?? c.Id ?? c.CategoryId);
      opt.textContent = c.name;
      sel.appendChild(opt);
    });
}

async function getDish(id) {
  return http(`/Dish/${encodeURIComponent(id)}`);
}

function readForm() {
  const name = $('#dishName').value.trim();
  const priceStr = $('#dishPrice').value.trim();
  const price = Number.parseFloat(priceStr.toString().replace(/\./g, '').replace(',', '.'));
  const category = Number.parseInt($('#dishCategory').value, 10);
  const description = $('#dishDesc').value.trim();
  const image = $('#dishImage').value.trim();
  const isActive = $('#dishActive').checked;
  return { name, description, price, category, image, isActive };
}

function fillForm(d) {
  $('#dishName').value  = d.name ?? '';
  $('#dishDesc').value  = d.description ?? '';
  $('#dishPrice').value = Number(d.price ?? 0);
  $('#dishImage').value = d.image ?? d.imageUrl ?? '';
  $('#dishActive').checked = (d.isActive ?? d.available ?? d.active ?? true);
  const catId = d.category?.id ?? d.categoryId ?? d.category ?? null;
  if (catId != null) $('#dishCategory').value = String(catId);
}

async function init() {
  try {
    const editId = getEditId();
    await loadCategories();

    if (editId) {
      const title = document.querySelector('main h3');
      if (title) title.textContent = 'Editar plato';

      let dish;
      try {
        dish = await getDish(editId);
      } catch (e) {
        showAlert('danger', 'No pude cargar el plato: ' + e.message);
        return;
      }
      fillForm(dish);

      $('#dishForm').onsubmit = async (e) => {
        e.preventDefault();
        const body = readForm();
        if (!body.name) return showAlert('warning', 'Ingresá un nombre.');
        if (!Number.isFinite(body.price) || body.price < 0) return showAlert('warning', 'Precio inválido.');
        if (!Number.isInteger(body.category) || body.category <= 0) return showAlert('warning', 'Elegí una categoría válida.');
        if (!body.description) return showAlert('warning', 'Ingresá una descripción.');
        if (!body.image) return showAlert('warning', 'Ingresá la URL de imagen.');
        try {
          await http(`/Dish/${encodeURIComponent(editId)}`, { method:'PUT', body });
          showAlert('success', 'Plato actualizado correctamente.');
        } catch (err) {
          showAlert('danger', 'Error al actualizar: ' + err.message);
        }
      };

      const saveBtn = $('#btnSaveDish');
      if (saveBtn) saveBtn.textContent = 'Guardar cambios';
    } else {
      $('#dishForm').onsubmit = async (e) => {
        e.preventDefault();
        const body = readForm();
        if (!body.name) return showAlert('warning', 'Ingresá un nombre.');
        if (!Number.isFinite(body.price) || body.price < 0) return showAlert('warning', 'Precio inválido.');
        if (!Number.isInteger(body.category) || body.category <= 0) return showAlert('warning', 'Elegí una categoría válida.');
        if (!body.description) return showAlert('warning', 'Ingresá una descripción.');
        if (!body.image) return showAlert('warning', 'Ingresá la URL de imagen.');
        try {
          await http('/Dish', { method:'POST', body });
          $('#dishForm').reset();
          $('#dishActive').checked = true;
          showAlert('success', 'Plato creado correctamente.');
        } catch (err) {
          showAlert('danger', 'Error al crear: ' + err.message);
        }
      };
    }
  } catch (e) {
    showAlert('danger', 'Error inicializando: ' + e.message);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
