import { $, $$, isAvailable, getDishId, getDishImage, applyLocalFilter } from './utils.js';
import { state, saveCart, renderCartIcon } from './state.js';
import { updateDish } from './api.js';
import { isStaff } from '../../../shared/auth.js';

function renderPager(totalPages) {
  const pager = document.getElementById('pager');
  if (!pager) return;

  const cur = state.pagination.page;
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const windowSize = 5;
  const half = Math.floor(windowSize / 2);
  const start = clamp(cur - half, 1, Math.max(1, totalPages - windowSize + 1));
  const end = Math.min(totalPages, start + windowSize - 1);

  if (totalPages <= 1) { pager.innerHTML = ''; return; }

  const li = [];
  const liBtn = (label, page, disabled = false, active = false) => `
    <li class="page-item ${disabled ? 'disabled' : ''} ${active ? 'active' : ''}">
      <button class="page-link" ${disabled ? 'tabindex="-1" aria-disabled="true"' : `data-page="${page}"`}>${label}</button>
    </li>
  `;

  li.push(liBtn('«', 1, cur === 1));
  li.push(liBtn('‹', cur - 1, cur === 1));
  for (let p = start; p <= end; p++) li.push(liBtn(String(p), p, false, p === cur));
  li.push(liBtn('›', cur + 1, cur === totalPages));
  li.push(liBtn('»', totalPages, cur === totalPages));

  pager.innerHTML = `<nav aria-label="Paginación de platos"><ul class="pagination mb-0">${li.join('')}</ul></nav>`;
  pager.querySelectorAll('[data-page]').forEach(b => {
    b.onclick = () => {
      const next = parseInt(b.getAttribute('data-page'), 10);
      if (Number.isFinite(next)) { state.pagination.page = next; renderDishes(); }
    };
  });
}

async function toggleDishAvailability(dish) {
  const newActive = !isAvailable(dish);
  if (!confirm(`¿${newActive ? 'DAR ALTA' : 'DAR BAJA'} "${dish.name}"?`)) return;

  const id = getDishId(dish);
  const body = {
    name: dish.name,
    description: dish.description ?? '',
    price: dish.price,
    category: dish.category?.id ?? dish.categoryId ?? dish.category ?? null,
    isActive: newActive,
    image: getDishImage(dish)
  };
  await updateDish(id, body);
  window.loadDishes?.();
}

export function renderDishes() {
  const grid = document.getElementById('dishGrid');
  grid.innerHTML = '';

  const staff = typeof isStaff === 'function' ? isStaff() : false;

  let list = applyLocalFilter(Array.isArray(state.dishes) ? state.dishes : [], state.filters.name);
  if (!staff) list = list.filter(isAvailable);

  const { page, perPage } = state.pagination;
  const totalPages = Math.max(1, Math.ceil(list.length / perPage));
  if (page > totalPages) state.pagination.page = totalPages;

  const start = (state.pagination.page - 1) * perPage;
  const pageItems = list.slice(start, start + perPage);

  if (!pageItems.length) {
    grid.innerHTML = `<div class="text-muted">No hay platos para mostrar.</div>`;
    renderPager(totalPages);
    return;
  }

  pageItems.forEach(d => {
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
                ` : ''
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

    const imgEl = col.querySelector('img');
    imgEl.onerror = () => { if (!imgEl.src.includes('NoDisponible.jpg')) imgEl.src = '/assets/NoDisponible.jpg'; };

    if (active && id) {
      const addBtn = col.querySelector(`[data-add="${id}"]`);
      if (addBtn) {
        addBtn.onclick = () => {
          const qty   = parseInt(col.querySelector(`[data-qty="${id}"]`)?.value || '1', 10);
          const notes = col.querySelector(`[data-notes="${id}"]`)?.value || '';
          if (!Array.isArray(state.cart?.items)) state.cart = { items: [] };
          const idx = state.cart.items.findIndex(i => i.dishId === id && i.notes === notes);
          if (idx >= 0) state.cart.items[idx].quantity += qty;
          else state.cart.items.push({ dishId: id, name, price, quantity: qty, notes });
          saveCart();
          renderCartIcon();
        };
      }
    }

    if (staff && id) {
      const editBtn = col.querySelector(`[data-edit="${id}"]`);
      if (editBtn) editBtn.onclick = () => { window.location.href = `./admin.html?edit=${encodeURIComponent(id)}`; };
      const toggleBtn = col.querySelector(`[data-toggle="${id}"]`);
      if (toggleBtn) toggleBtn.onclick = () => toggleDishAvailability(d);
    }
  });

  renderPager(totalPages);
}
