import { http } from '../../shared/http.js';
import { isStaff } from '../../shared/auth.js';
import { NO_IMAGE } from '../../shared/env.js';
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const state = {
  categories: [],
  dishes: [],
  filters: { name: '', categoryId: '', priceSort: '' },
  cart: loadCart(),
};

// ---------- helpers ----------
const debounce = (fn, ms = 250) => { let h; return (...args) => { clearTimeout(h); h = setTimeout(() => fn(...args), ms); }; };

function applyLocalFilter(dishes, term) {
  const t = (term || '').toLowerCase();
  if (!t) return dishes;
  return dishes.filter(d =>
    (d.name || '').toLowerCase().includes(t) ||
    (d.description || '').toLowerCase().includes(t)
  );
}

const isAvailable   = d => (d.available ?? d.isActive ?? d.active ?? true);
const getCategoryId = d => (d.category?.id ?? d.categoryId ?? d.category ?? null);
const getDishId     = d => (d.id ?? d.dishId ?? d.DishId ?? d.Id);

// **ÚNICA** función para la imagen (usa fallback si viene vacía)
const getDishImage  = d => {
  const url = d.imageUrl ?? d.image ?? '';
  return (typeof url === 'string' && url.trim()) ? url : NO_IMAGE;
};

function loadCart() {
  try {
    const raw = localStorage.getItem('cart');
    const parsed = raw ? JSON.parse(raw) : null;
    if (!parsed || !Array.isArray(parsed.items)) return { items: [] };
    return parsed;
  } catch { return { items: [] }; }
}
function saveCart() {
  const safe = Array.isArray(state.cart?.items) ? state.cart : { items: [] };
  localStorage.setItem('cart', JSON.stringify(safe));
}
function renderCartIcon() {
  const items = Array.isArray(state.cart?.items) ? state.cart.items : [];
  const count = items.reduce((a, b) => a + (Number(b.quantity) || 0), 0);
  $('#cartCount').textContent = count;
}

// ---------- data ----------
async function loadCategories() {
  state.categories = await http('/Category');
  renderCategories();
}
async function loadDishes() {
  const priceSort = (state.filters.priceSort || '').toLowerCase();
  const cat = state.filters.categoryId;
  const params = {
    name: state.filters.name || '',
    priceSort,
    ...(cat ? { categoryId: Number(cat), category: Number(cat) } : {})
  };
  state.dishes = await http('/Dish', { params });
  renderDishes();
}

// ---------- UI ----------
function renderCategories() {
  const box = $('#categoryList');
  box.innerHTML = '';

  const all = document.createElement('button');
  all.className = 'btn category-pill active';
  all.textContent = 'Todas';
  all.onclick = () => { state.filters.categoryId = ''; loadDishes(); highlightCategory(''); };
  box.appendChild(all);

  state.categories
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
    .forEach(c => {
      const btn = document.createElement('button');
      btn.className = 'btn category-pill';
      btn.textContent = c.name;
      btn.dataset.catid = c.id;
      btn.onclick = () => { state.filters.categoryId = Number(c.id); loadDishes(); highlightCategory(c.id); };
      box.appendChild(btn);
    });
}

function highlightCategory(catId) {
  $$('#categoryList .category-pill').forEach(el => el.classList.remove('active'));
  const el = $(`#categoryList .category-pill[data-catid="${catId}"]`);
  (el ?? $$('#categoryList .category-pill')[0]).classList.add('active');
}

async function toggleDishAvailability(dish) {
  const newActive = !isAvailable(dish);
  if (!confirm(`¿${newActive ? 'DAR ALTA' : 'DAR BAJA'} "${dish.name}"?`)) return;

  const id = getDishId(dish);
  const body = {
    name: dish.name,
    description: dish.description ?? '',
    price: dish.price,
    category: getCategoryId(dish),
    isActive: newActive,
    image: getDishImage(dish)
  };

  await http(`/Dish/${id}`, { method: 'PUT', body });
  await loadDishes();
}

function renderDishes() {
  const grid = $('#dishGrid');
  grid.innerHTML = '';

  const staff = typeof isStaff === 'function' ? isStaff() : false;

  let list = applyLocalFilter(Array.isArray(state.dishes) ? state.dishes : [], state.filters.name);
  if (!staff) list = list.filter(isAvailable);

  if (!list.length) {
    grid.innerHTML = `<div class="text-muted">No hay platos para mostrar.</div>`;
    return;
  }

  list.forEach(d => {
    const id     = getDishId(d);
    const imgUrl = getDishImage(d);
    const name   = d.name ?? '';
    const desc   = d.description ?? '';
    const price  = Number(d.price) || 0;
    const active = isAvailable(d);

    const col = document.createElement('div');
    col.className = 'col';
    col.innerHTML = `
      <div class="card h-100 ${!active && staff ? 'border-warning-subtle' : ''}">
        <img src="${imgUrl}" class="card-img-top" alt="${name}">
        <div class="card-body d-flex flex-column">
          <div class="d-flex justify-content-between align-items-start gap-2">
            <div>
              <h6 class="card-title mb-1">${name}</h6>
              <small class="text-muted">${desc}</small>
              ${staff && !active ? `<div class="mt-1"><span class="badge text-bg-warning">Inactivo</span></div>` : ''}
            </div>
            ${
              staff && id
                ? `
                  <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-secondary" data-edit="${id}">Modificar</button>
                    <button class="btn ${active ? 'btn-outline-warning' : 'btn-outline-success'}" data-toggle="${id}">
                      ${active ? 'Dar baja' : 'Dar alta'}
                    </button>
                  </div>
                `
                : ''
            }
          </div>

          <div class="mt-auto">
            <div class="d-flex justify-content-between align-items-center mt-2">
              <span class="fw-bold">$${price.toFixed(2)}</span>
              ${
                active && id
                  ? `<button class="btn btn-sm btn-primary" data-add="${id}">Agregar</button>`
                  : `<button class="btn btn-sm btn-secondary" disabled>No disponible</button>`
              }
            </div>

            <div class="mt-2">
              <input class="form-control form-control-sm" placeholder="Notas (sin cebolla, punto...)" data-notes="${id ?? ''}">
            </div>
            <div class="mt-2 d-flex align-items-center gap-2">
              <label class="small mb-0">Cant.</label>
              <input type="number" class="form-control form-control-sm" value="1" min="1" style="max-width:90px" data-qty="${id ?? ''}">
            </div>
          </div>
        </div>
      </div>
    `;
    grid.appendChild(col);

    // Fallback en tiempo de ejecución si la imagen falla (404/CORS/etc.)
    const imgEl = col.querySelector('img');
    imgEl.onerror = () => {
      if (!imgEl.src.includes('NoDisponible.jpg')) imgEl.src = NO_IMAGE;
    };

    if (active && id) {
      const addBtn = col.querySelector(`[data-add="${id}"]`);
      if (addBtn) {
        addBtn.onclick = () => {
          const qty   = parseInt(col.querySelector(`[data-qty="${id}"]`)?.value || '1', 10);
          const notes = col.querySelector(`[data-notes="${id}"]`)?.value || '';
          const dishForCart = { id, name, price };
          addToCart(dishForCart, qty, notes);
        };
      }
    }

    if (staff && id) {
      const editBtn = col.querySelector(`[data-edit="${id}"]`);
      if (editBtn) {
        editBtn.onclick = () => {
          window.location.href = `./admin.html?edit=${encodeURIComponent(id)}`;
        };
      }
      const toggleBtn = col.querySelector(`[data-toggle="${id}"]`);
      if (toggleBtn) {
        toggleBtn.onclick = () => toggleDishAvailability(d);
      }
    }
  });
}

// ---------- cart ----------
function addToCart(dish, quantity = 1, notes = '') {
  if (!Array.isArray(state.cart?.items)) state.cart = { items: [] };
  const idx = state.cart.items.findIndex(i => i.dishId === dish.id && i.notes === notes);
  if (idx >= 0) state.cart.items[idx].quantity += quantity;
  else state.cart.items.push({ dishId: dish.id, name: dish.name, price: dish.price, quantity, notes });
  saveCart();
  renderCartIcon();
}

function renderCartModal() {
  const items = Array.isArray(state.cart?.items) ? state.cart.items : [];
  const box = $('#cartItems');

  if (!items.length) {
    box.innerHTML = `<div class="text-muted">Tu comanda está vacía.</div>`;
  } else {
    box.innerHTML = items.map((i, idx) => `
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
      const idx = parseInt(btn.dataset.remove, 10);
      state.cart.items.splice(idx, 1);
      saveCart();
      renderCartModal();
      renderCartIcon();
    };
  });
}

function totalCart() {
  const items = Array.isArray(state.cart?.items) ? state.cart.items : [];
  return items.reduce((t, i) => t + (Number(i.price) || 0) * (Number(i.quantity) || 0), 0);
}

// ---------- order ----------
function mapDeliveryId(type) {
  switch (type) {
    case 'Delivery': return 1;
    case 'TakeAway': return 2;
    case 'DineIn':   return 3;
    default:         return 0;
  }
}

async function placeOrder() {
  if (!state.cart.items.length) { alert('Agregá al menos un plato.'); return; }

  const typeValue = $('#deliveryType').value;
  const toValue = $('#deliveryValue').value.trim();
  if (!toValue) { alert('Completá mesa/nombre/dirección.'); return; }

  const payload = {
    items: state.cart.items.map(i => ({ id: i.dishId, quantity: i.quantity, notes: i.notes || '' })),
    delivery: { id: mapDeliveryId(typeValue), to: toValue },
    notes: ''
  };

  const order = await http('/Order', { method: 'POST', body: payload });
  alert(`Pedido creado. N° ${order.id ?? ''}`);
  state.cart = { items: [] };
  localStorage.setItem('cart', JSON.stringify(state.cart));
  renderCartIcon();
  bootstrap.Modal.getInstance(document.getElementById('cartModal')).hide();
}

// ---------- boot ----------
function bindUI() {
  $('#btnSearch').onclick = () => {
    state.filters.name = $('#searchInput').value.trim();
    state.filters.priceSort = $('#sortSelect').value;
    loadDishes();
  };

  const si = $('#searchInput');
  si.addEventListener('input', debounce(() => {
    state.filters.name = si.value.trim();
    renderDishes();
  }, 200));

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
    $('#deliveryLabel').textContent =
      t === 'DineIn' ? 'Nro de mesa'
      : t === 'TakeAway' ? 'Nombre del comensal'
      : 'Dirección de entrega';
    $('#deliveryValue').placeholder =
      t === 'DineIn' ? 'Mesa 12'
      : t === 'TakeAway' ? 'Juan Pérez'
      : 'Av. Siempreviva 742';
  };
}

async function init() {
  bindUI();
  if (!Array.isArray(state.cart?.items)) state.cart = { items: [] };
  renderCartIcon();
  await Promise.all([loadCategories(), loadDishes()]);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
