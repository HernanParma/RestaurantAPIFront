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
  console.log('toggleDishAvailability called with:', dish);
  const newActive = !isAvailable(dish);
  console.log('newActive:', newActive);
  
  try {
    const confirmed = await showToggleConfirmation(dish.name, newActive);
    console.log('User confirmed:', confirmed);
    if (!confirmed) return;
  } catch (error) {
    console.error('Error in showToggleConfirmation:', error);
    return;
  }

  const id = getDishId(dish);
  const imageUrl = dish.imageUrl ?? dish.image ?? '';
  console.log('Original dish image:', dish.imageUrl, dish.image);
  console.log('Processed image URL:', imageUrl);
  
  const body = {
    name: dish.name,
    description: dish.description ?? '',
    price: dish.price,
    category: dish.category?.id ?? dish.categoryId ?? dish.category ?? null,
    isActive: newActive,
    imageUrl: imageUrl || getDishImage(dish),
    image: imageUrl || getDishImage(dish)
  };
  console.log('Sending body to updateDish:', body);
  await updateDish(id, body);
  console.log('Dish updated successfully');
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
      <div class="dish-card card h-100 ${!active && staff ? 'border-warning-subtle' : ''}">
        <img src="${imgUrl}" class="card-img-top" alt="${name}">
        <div class="card-body d-flex flex-column">
          <div>
            <h6 class="card-title">${name}</h6>
            <small class="card-text">${desc}</small>
            ${staff && !active ? `<div class="mt-1"><span class="badge text-bg-warning">Inactivo</span></div>` : ''}
          </div>

          <div class="mt-auto">
            <div class="d-flex align-items-center justify-content-between gap-2 mb-2">
              <div class="dish-price">$${price.toFixed(2)}</div>
              <div class="d-flex align-items-center gap-2">
                <label class="small text-coffee fw-semibold mb-0">Cant.</label>
                <input type="number" class="form-control form-control-sm" value="1" min="1" style="max-width:70px" data-qty="${id ?? ''}">
              </div>
            </div>

            <div class="mt-2">
              <input class="form-control form-control-sm" placeholder="Notas (sin cebolla, punto...)" data-notes="${id ?? ''}">
            </div>
            <div class="mt-2 d-flex align-items-center justify-content-center gap-2">
              ${
                staff && id
                  ? `
                    <div class="d-flex gap-1">
                      <button class="btn btn-elegant-outline btn-sm" data-edit="${id}">Modificar</button>
                      <button class="btn ${active ? 'btn-elegant-outline' : 'btn-elegant'} btn-sm" data-toggle="${id}">
                        ${active ? 'Dar baja' : 'Dar alta'}
                      </button>
                    </div>
                  ` : ''
              }
            </div>
            ${
              active && id
                ? `<button class="btn btn-add-cart mt-3" data-add="${id}">Agregar</button>`
                : `<button class="btn btn-secondary mt-3" disabled>No disponible</button>`
            }
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
      if (toggleBtn) {
        console.log('Setting up toggle button for:', d.name);
        toggleBtn.onclick = () => {
          console.log('Toggle button clicked for:', d.name);
          toggleDishAvailability(d);
        };
      }
    }
  });

  renderPager(totalPages);
}

// Modal personalizado para confirmación de dar alta/baja
function showToggleConfirmation(dishName, isActivating) {
  console.log('showToggleConfirmation called with:', dishName, isActivating);
  return new Promise((resolve) => {
    // Crear el modal
    const modalHtml = `
      <div id="toggleModal" class="modal fade show" tabindex="-1" style="display: block !important; background: rgba(0,0,0,0.5); position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 9999;">
        <div class="modal-dialog" style="margin: 0; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); max-width: 450px; width: 90%;">
          <div class="modal-content" style="border-radius: 16px; border: none; box-shadow: 0 20px 40px rgba(0,0,0,0.3);">
            <div class="modal-body text-center" style="padding: 2rem;">
              <h5 class="modal-title mb-3" style="font-family: 'Playfair Display', serif; font-weight: 700; color: #2c1810; font-size: 1.4rem;">
                ${isActivating ? 'Activar plato' : 'Desactivar plato'}
              </h5>
              <p class="mb-4" style="color: #6c757d; font-size: 1rem; line-height: 1.5;">
                ${isActivating 
                  ? `¿Estás seguro de que querés activar "<strong>${dishName}</strong>"?<br><small class="text-muted">El plato volverá a estar disponible en el menú.</small>`
                  : `¿Estás seguro de que querés desactivar "<strong>${dishName}</strong>"?<br><small class="text-muted">El plato ya no estará disponible para los clientes.</small>`
                }
              </p>
              <div class="d-flex justify-content-center gap-3">
                <button type="button" class="btn btn-outline-secondary" id="cancelToggle" 
                        style="border-radius: 8px; padding: 0.6rem 1.5rem; font-weight: 600; min-width: 100px;">
                  Cancelar
                </button>
                <button type="button" class="btn" id="confirmToggle" 
                        style="border-radius: 8px; padding: 0.6rem 1.5rem; font-weight: 600; min-width: 100px;
                               background: ${isActivating ? 'linear-gradient(135deg, #28a745, #20c997)' : 'linear-gradient(135deg, #dc3545, #fd7e14)'};
                               border: none; color: white;">
                  ${isActivating ? 'Activar' : 'Desactivar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Agregar el modal al DOM
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modal = document.getElementById('toggleModal');
    console.log('Modal created:', modal);

    // Event listeners
    const cancelBtn = document.getElementById('cancelToggle');
    const confirmBtn = document.getElementById('confirmToggle');
    
    console.log('Cancel button:', cancelBtn);
    console.log('Confirm button:', confirmBtn);

    if (cancelBtn) {
      cancelBtn.onclick = () => {
        console.log('Cancel button clicked');
        modal.remove();
        resolve(false);
      };
    }

    if (confirmBtn) {
      confirmBtn.onclick = () => {
        console.log('Confirm button clicked');
        modal.remove();
        resolve(true);
      };
    }

    // Cerrar con ESC
    const handleKeydown = (e) => {
      if (e.key === 'Escape') {
        console.log('ESC pressed');
        modal.remove();
        document.removeEventListener('keydown', handleKeydown);
        resolve(false);
      }
    };
    document.addEventListener('keydown', handleKeydown);

    // Cerrar al hacer click fuera del modal
    modal.onclick = (e) => {
      if (e.target === modal) {
        console.log('Clicked outside modal');
        modal.remove();
        document.removeEventListener('keydown', handleKeydown);
        resolve(false);
      }
    };
  });
}
