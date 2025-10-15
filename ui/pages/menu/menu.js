// ui/pages/menu/menu.js
import { http } from '../../shared/http.js';
import { isStaff } from '../../shared/auth.js';

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const state = {
  categories: [],
  dishes: [],
  filters: { name: '', categoryId: '', priceSort: '' }, // '', 'ASC', 'DESC'
  cart: loadCart(),
};

/* =============== helpers =============== */
const debounce = (fn, ms = 250) => {
  let h;
  return (...args) => { clearTimeout(h); h = setTimeout(() => fn(...args), ms); };
};

function applyLocalFilter(dishes, term) {
  const t = (term || '').toLowerCase();
  if (!t) return dishes;
  return dishes.filter(d =>
    (d.name || '').toLowerCase().includes(t) ||
    (d.description || '').toLowerCase().includes(t)
  );
}

// disponibilidad/categoría tolerantes a distintos DTOs
const isAvailable   = (d) => (d.available ?? d.isActive ?? d.active ?? true);
const getCategoryId = (d) => (d.category?.id ?? d.categoryId ?? d.category ?? null);

/* =============== Cart =============== */
function loadCart() {
  try {
    const raw = localStorage.getItem('cart');
    const parsed = raw ? JSON.parse(raw) : null;
    if (!parsed || !Array.isArray(parsed.items)) return { items: [] };
    return parsed;
  } catch {
    return { items: [] };
  }
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

/* =============== Fetchers =============== */
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
  renderDishes(); // luego aplicamos filtro local por descripción también
}

/* =============== Renderers =============== */
function renderCategories() {
  const box = $('#categoryList');
  box.innerHTML = '';

  const all = document.createElement('button');
  all.className = 'btn category-pill active';
  all.textContent = 'Todas';
  all.onclick = () => {
    state.filters.categoryId = '';
    loadDishes();
    highlightCategory('');
  };
  box.appendChild(all);

  state.categories
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
    .forEach(c => {
      const btn = document.createElement('button');
      btn.className = 'btn category-pill';
      btn.textContent = c.name;
      btn.dataset.catid = c.id;
      btn.onclick = () => {
        state.filters.categoryId = Number(c.id);
        loadDishes();
        highlightCategory(c.id);
      };
      box.appendChild(btn);
    });
}

function highlightCategory(catId) {
  $$('#categoryList .category-pill').forEach(el => el.classList.remove('active'));
  const el = $(`#categoryList .category-pill[data-catid="${catId}"]`);
  (el ?? $$('#categoryList .category-pill')[0]).classList.add('active');
}

/* =============== Acciones STAFF =============== */
async function toggleDishAvailability(dish) {
  const newActive = !isAvailable(dish);
  const accionTxt = newActive ? 'DAR ALTA' : 'DAR BAJA';
  if (!confirm(`¿${accionTxt} "${dish.name}"?`)) return;

  // Ajustá 'isActive' -> 'available' si tu PUT usa ese nombre en el backend
  const body = {
    name: dish.name,
    description: dish.description ?? '',
    price: dish.price,
    category: getCategoryId(dish),
    isActive: newActive,
    image: dish.image || dish.imageUrl || null
  };

  try {
    await http(`/Dish/${dish.id}`, { method: 'PUT', body });
    await loadDishes();
  } catch (e) {
    console.error(e);
    alert(`No se pudo ${newActive ? 'dar de alta' : 'dar de baja'} el plato: ` + (e.message || 'Error'));
  }
}

/* =============== Platos =============== */
function renderDishes() {
  const grid = $('#dishGrid');
  grid.innerHTML = '';

  const staff = isStaff();

  // Filtro local por nombre + descripción
  let list = applyLocalFilter(state.dishes, state.filters.name);

  // Si no es staff, mostrar solo activos
  if (!staff) list = list.filter(isAvailable);

  if (!list.length) {
    grid.innerHTML = `<div class="text-muted">No hay platos para mostrar.</div>`;
    return;
  }

  list.forEach(d => {
    const img    = d.image || d.imageUrl || './assets/placeholder.jpg';
    const price  = Number(d.price) || 0;
    const active = isAvailable(d);

    const col = document.createElement('div');
    col.className = 'col';
    col.innerHTML = `
      <div class="card h-100 ${!active && staff ? 'border-warning-subtle' : ''}">
        <img src="${img}" class="card-img-top" alt="${d.name}">
        <div class="card-body d-flex flex-column">
          <div class="d-flex justify-content-between align-items-start gap-2">
            <div>
              <h6 class="card-title mb-1">${d.name}</h6>
              <small class="text-muted">${d.description ?? ''}</small>
              ${staff && !active ? `<div class="mt-1"><span class="badge text-bg-warning">Inactivo</span></div>` : ''}
            </div>
            ${
              staff
                ? `
                  <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-secondary" data-edit="${d.id}">Modificar</button>
                    <button class="btn ${active ? 'btn-outline-warning' : 'btn-outline-success'}" data-toggle="${d.id}">
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
                active
                  ? `<button class="btn btn-sm btn-primary" data-add="${d.id}">Agregar</button>`
                  : `<button class="btn btn-sm btn-secondary" disabled>No disponible</button>`
              }
            </div>

            <div class="mt-2">
              <input class="form-control form-control-sm" placeholder="Notas (sin cebolla, punto...)" data-notes="${d.id}">
            </div>
            <div class="mt-2 d-flex align-items-center gap-2">
              <label class="small mb-0">Cant.</label>
              <input type="number" class="form-control form-control-sm" value="1" min="1" style="max-width:90px" data-qty="${d.id}">
            </div>
          </div>
        </div>
      </div>
    `;
    grid.appendChild(col);

    // Agregar al carrito (solo si está activo)
    if (active) {
      col.querySelector('[data-add]').onclick = () => {
        const qty   = parseInt(col.querySelector(`[data-qty="${d.id}"]`).value || '1', 10);
        const notes = col.querySelector(`[data-notes="${d.id}"]`).value || '';
        addToCart(d, qty, notes);
      };
    }

    // Acciones de staff
    if (staff) {
      col.querySelector(`[data-edit="${d.id}"]`).onclick = () => {
        window.location.href = `./admin.html?edit=${encodeURIComponent(d.id)}`;
      };
      col.querySelector(`[data-toggle="${d.id}"]`).onclick = () => toggleDishAvailability(d);
    }
  });
}

/* =============== Cart ops =============== */
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

/* =============== Order =============== */
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

  const typeValue  = $('#deliveryType').value;
  const toValue    = $('#deliveryValue').value.trim();
  if (!toValue) { alert('Completá mesa/nombre/dirección.'); return; }

  const payload = {
    items: state.cart.items.map(i => ({
      id: i.dishId,
      quantity: i.quantity,
      notes: i.notes || ''
    })),
    delivery: { id: mapDeliveryId(typeValue), to: toValue },
    notes: ''
  };

  try {
    const order = await http('/Order', { method: 'POST', body: payload });
    alert(`Pedido creado. N° ${order.id ?? ''}`);
    state.cart = { items: [] };
    localStorage.setItem('cart', JSON.stringify(state.cart));
    renderCartIcon();
    bootstrap.Modal.getInstance(document.getElementById('cartModal')).hide();
  } catch (e) {
    console.error(e);
    alert('No se pudo crear el pedido. ' + e.message);
  }
}

/* =============== Bindings =============== */
function bindUI() {
  // Botón aplicar (sigue activo por si lo querés usar)
  $('#btnSearch').onclick = () => {
    state.filters.name = $('#searchInput').value.trim();
    state.filters.priceSort = $('#sortSelect').value; // '', 'ASC', 'DESC'
    loadDishes();
  };

  // Filtrado EN VIVO: re-render local (nombre + descripción)
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
      t === 'DineIn' ? 'Nro de mesa' :
      t === 'TakeAway' ? 'Nombre del comensal' :
      'Dirección de entrega';
    $('#deliveryValue').placeholder =
      t === 'DineIn' ? 'Mesa 12' :
      t === 'TakeAway' ? 'Juan Pérez' :
      'Av. Siempreviva 742';
  };
}

/* =============== Init =============== */
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
