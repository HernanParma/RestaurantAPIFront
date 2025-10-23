import { $, debounce } from '../../shared/utils.js';
import { MetaApi } from '../../../services/MetaApi.js';
import { DishesService } from '../../../services/DishesService.js';
import { OrderApi } from '../../../services/OrderApi.js';
import { cartStore } from '../../../shared/cartStore.js';
import { renderCategories, highlightCategory } from './renderCategories.js';
import { renderDishes } from './renderDishes.js';

const state = {
  categories: [],
  dishes: [],
  filters: { name: '', categoryId: '', priceSort: '' }
};

async function loadCategories() {
  state.categories = await MetaApi.getCategories();
  renderCategories('#categoryList', state.categories, (catId) => {
    state.filters.categoryId = catId || '';
    loadDishes();
    highlightCategory('#categoryList', catId);
  });
}

async function loadDishes() {
  const params = {
    categoryId: state.filters.categoryId || '',
    SortByPrice: state.filters.priceSort || ''
  };
  state.dishes = await DishesService.list(params);
  renderDishes('#dishGrid', state.dishes, state.filters, (dish, qty, notes) => {
    cartStore.add(dish, qty, notes);
    renderCartIcon();
  });
}

function renderCartIcon() {
  $('#cartCount').textContent = cartStore.getCount();
}

function renderCartModal() {
  const box = $('#cartItems');
  if (cartStore.isEmpty()) {
    box.innerHTML = `<div class="text-muted">Tu comanda está vacía.</div>`;
  } else {
    box.innerHTML = cartStore.getItems().map((i, idx) => `
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
  $('#cartTotal').textContent = cartStore.getTotal().toFixed(2);

  document.querySelectorAll('#cartItems [data-remove]').forEach(btn => {
    btn.onclick = () => { cartStore.remove(parseInt(btn.dataset.remove,10)); renderCartModal(); renderCartIcon(); };
  });
}

async function placeOrder() {
  if (cartStore.isEmpty()) { alert('Agregá al menos un plato.'); return; }
  const type  = $('#deliveryType').value;
  const value = $('#deliveryValue').value.trim();
  if (!value) { alert('Completá mesa/nombre/dirección.'); return; }

  const payload = {
    deliveryType: type,
    identifier: value,
    items: cartStore.getItems().map(i => ({ dishId: i.dishId, quantity: i.quantity, notes: i.notes }))
  };

  const order = await OrderApi.create(payload);
  alert(`Pedido creado. N° ${order.id ?? ''}`);
  cartStore.clear();
  renderCartIcon();
  const modal = bootstrap.Modal.getInstance(document.getElementById('cartModal'));
  if (modal) modal.hide();
}

function bindUI() {
  // Establecer valor por defecto para el ordenamiento
  $('#sortSelect').value = 'ASC';
  state.filters.priceSort = 'ASC';

  // Agregar evento para cambio de ordenamiento
  $('#sortSelect').addEventListener('change', () => {
    state.filters.priceSort = $('#sortSelect').value;
    loadDishes();
  });

  const si = $('#searchInput');
  si.addEventListener('input', debounce(() => {
    state.filters.name = si.value.trim();
    loadDishes();
  }, 200));

  $('#btnCart').onclick = () => {
    renderCartModal();
    new bootstrap.Modal(document.getElementById('cartModal')).show();
  };

  $('#btnClearCart').onclick = () => {
    cartStore.clear();
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
  cartStore.load();
  renderCartIcon();
  await loadCategories();
  await loadDishes();
}

document.addEventListener('DOMContentLoaded', init);
