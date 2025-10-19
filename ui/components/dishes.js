import { $, getDishId, getDishImage, isAvailable, applyLocalFilter } from '../pages/menu/view/utils.js';
import { state, renderCartIcon } from '../pages/menu/state.js';
import { updateDish } from '../pages/menu/api.js';
import { renderPager } from './pager.js';
import { isStaff } from '../shared/auth.js';

export function attachImageFallback(imgEl, fallback) {
  imgEl.onerror = () => { if (!imgEl.src.includes('NoDisponible.jpg')) imgEl.src = fallback; };
}

export async function toggleDishAvailability(dish) {
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
  await window.loadDishes();
}

export function renderDishes() {
  const grid = $('#dishGrid');
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

    attachImageFallback(col.querySelector('img'), getDishImage({}));

    if (active && id) {
      const addBtn = col.querySelector(`[data-add="${id}"]`);
      if (addBtn) {
        addBtn.onclick = () => {
          const qty   = parseInt(col.querySelector(`[data-qty="${id}"]`)?.value || '1', 10);
          const notes = col.querySelector(`[data-notes="${id}"]`)?.value || '';
          window.addToCart({ id, name, price }, qty, notes);
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