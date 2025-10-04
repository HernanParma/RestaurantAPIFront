const API_BASE = location.hostname.includes('localhost')
  ? 'https://localhost:7266/api/v1'
  : 'https://tu-dominio-de-api.com/api/v1';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

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
  post: (p, b) => http(API_BASE + p, { method: 'POST', body: b }),
  patch: (p, b) => http(API_BASE + p, { method: 'PATCH', body: b }),
  del: (p) => http(API_BASE + p, { method: 'DELETE' })
};

const state = {
  categories: [],
  dishes: [],
  filters: { name: '', categoryId: '', priceSort: '' },
  cart: loadCart()
};

function loadCart() {
  try { return JSON.parse(localStorage.getItem('cart')) ?? { items: [] }; }
  catch { return { items: [] }; }
}

function saveCart() { localStorage.setItem('cart', JSON.stringify(state.cart)); }

async function loadCategories() {
  state.categories = await api.get('/Category');
  renderCategories();
}

async function loadDishes() {
  const params = {
    name: state.filters.name,
    categoryId: state.filters.categoryId,
    priceSort: (state.filters.priceSort || '').toLowerCase()
  };
  state.dishes = await api.get('/Dish', params);
  renderDishes();
}

function renderCategories() {
  const box = $('#categoryList');
  box.innerHTML = '';
  const all = document.createElement('button');
  all.className = 'list-group-item list-group-item-action active';
  all.textContent = 'Todas';
  all.onclick = () => { state.filters.categoryId = ''; loadDishes(); highlightCategory(''); };
  box.appendChild(all);
  state.categories
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
    .forEach(c => {
      const btn = document.createElement('button');
      btn.className = 'list-group-item list-group-item-action';
      btn.textContent = c.name;
      btn.dataset.catid = c.id;
      btn.onclick = () => { state.filters.categoryId = c.id; loadDishes(); highlightCategory(c.id); };
      box.appendChild(btn);
    });
}

function highlightCategory(catId) {
  $$('#categoryList .list-group-item').forEach(el => el.classList.remove('active'));
  const el = $(`#categoryList .list-group-item[data-catid="${catId}"]`);
  (el ?? $$('#categoryList .list-group-item')[0]).classList.add('active');
}

function renderDishes() {
  const grid = $('#dishGrid');
  grid.innerHTML = '';
  if (!state.dishes.length) {
    grid.innerHTML = `<div class="text-muted">No hay platos para mostrar.</div>`;
    return;
  }
  state.dishes.forEach(d => {
    const col = document.createElement('div');
    col.className = 'col';
    col.innerHTML = `
      <div class="card h-100">
        <img src="${d.image ?? './assets/placeholder.jpg'}" class="card-img-top" alt="${d.name}">
        <div class="card-body d-flex flex-column">
          <h6 class="card-title mb-1">${d.name}</h6>
          <small class="text-muted mb-2">${d.description ?? ''}</small>
          <div class="mt-auto d-flex justify-content-between align-items-center">
            <span class="fw-bold">$${Number(d.price).toFixed(2)}</span>
            <button class="btn btn-sm btn-primary">Agregar</button>
          </div>
          <div class="mt-2">
            <input class="form-control form-control-sm" placeholder="Notas (sin cebolla, punto...)" data-notes="${d.id}">
          </div>
          <div class="mt-2 d-flex align-items-center gap-2">
            <label class="small">Cant.</label>
            <input type="number" class="form-control form-control-sm" value="1" min="1" style="max-width:90px" data-qty="${d.id}">
          </div>
        </div>
      </div>
    `;
    grid.appendChild(col);
    col.querySelector('button.btn-primary').onclick = () => {
      const qty = parseInt(col.querySelector(`[data-qty="${d.id}"]`).value || '1', 10);
      const notes = col.querySelector(`[data-notes="${d.id}"]`).value || '';
      addToCart(d, qty, notes);
    };
  });
}

function addToCart(dish, quantity = 1, notes = '') {
  const idx = state.cart.items.findIndex(i => i.dishId === dish.id && i.notes === notes);
  if (idx >= 0) state.cart.items[idx].quantity += quantity;
  else state.cart.items.push({ dishId: dish.id, name: dish.name, price: dish.price, quantity, notes });
  saveCart();
  renderCartIcon();
}

function renderCartIcon() {
  const count = state.cart.items.reduce((a, b) => a + b.quantity, 0);
  $('#cartCount').textContent = count;
}

function renderCartModal() {
  const box = $('#cartItems');
  if (!state.cart.items.length) {
    box.innerHTML = `<div class="text-muted">Tu comanda está vacía.</div>`;
  } else {
    box.innerHTML = state.cart.items.map((i, idx) => `
      <div class="d-flex justify-content-between align-items-start mb-2">
        <div>
          <div class="fw-semibold">${i.name} × ${i.quantity}</div>
          <div class="small text-muted">${i.notes || ''}</div>
        </div>
        <div class="text-end">
          <div>$${(i.price * i.quantity).toFixed(2)}</div>
          <button class="btn btn-sm btn-outline-danger mt-1" data-remove="${idx}">Quitar</button>
        </div>
      </div>
    `).join('');
  }
  $('#cartTotal').textContent = totalCart().toFixed(2);
  $$('#cartItems [data-remove]').forEach(btn => {
    btn.onclick = () => {
      state.cart.items.splice(parseInt(btn.dataset.remove, 10), 1);
      saveCart();
      renderCartModal();
      renderCartIcon();
    };
  });
}

function totalCart() {
  return state.cart.items.reduce((t, i) => t + i.price * i.quantity, 0);
}

async function placeOrder() {
  if (!state.cart.items.length) { alert('Agregá al menos un plato.'); return; }
  const type = $('#deliveryType').value;
  const value = $('#deliveryValue').value.trim();
  if (!value) { alert('Completá mesa/nombre/dirección.'); return; }
  const payload = {
    deliveryType: type,
    identifier: value,
    items: state.cart.items.map(i => ({ dishId: i.dishId, quantity: i.quantity, notes: i.notes }))
  };
  try {
    const order = await api.post('/Order', payload);
    alert(`Pedido creado. N° ${order.id ?? ''}`);
    state.cart = { items: [] };
    saveCart();
    renderCartIcon();
    bootstrap.Modal.getInstance(document.getElementById('cartModal')).hide();
  } catch (e) {
    console.error(e);
    alert('No se pudo crear el pedido. ' + e.message);
  }
}

function bindUI() {
  $('#btnSearch').onclick = () => {
    state.filters.name = $('#searchInput').value.trim();
    state.filters.priceSort = $('#sortSelect').value;
    loadDishes();
  };
  $('#btnCart').onclick = () => {
    renderCartModal();
    const modal = new bootstrap.Modal(document.getElementById('cartModal'));
    modal.show();
  };
  $('#btnClearCart').onclick = () => {
    state.cart = { items: [] };
    saveCart();
    renderCartModal();
    renderCartIcon();
  };
  $('#btnPlaceOrder').onclick = placeOrder;
  $('#deliveryType').onchange = e => {
    const t = e.target.value;
    $('#deliveryLabel').textContent = t === 'DineIn' ? 'Nro de mesa' : t === 'TakeAway' ? 'Nombre del comensal' : 'Dirección de entrega';
    $('#deliveryValue').placeholder = t === 'DineIn' ? 'Mesa 12' : t === 'TakeAway' ? 'Juan Pérez' : 'Av. Siempreviva 742';
  };
}

async function init() {
  bindUI();
  renderCartIcon();
  await loadCategories();
  await loadDishes();
}

document.addEventListener('DOMContentLoaded', init);
