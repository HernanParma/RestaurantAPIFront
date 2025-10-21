import { $, debounce } from './view/utils.js';
import { state, loadCart, renderCartIcon } from './view/state.js';
import { fetchCategories, fetchDishes } from './view/api.js';
import { renderCategories } from './view/renderCategories.js';
import { renderDishes } from './view/renderDishes.js';
import { placeOrder } from './view/orders.js';

function showToast(message = '¡Agregado a su pedido!', variant = 'success', delay = 2000) {
  const el = document.getElementById('appToast');
  const body = document.getElementById('appToastBody');
  if (!el || !body) return;
  el.className = `toast align-items-center text-bg-${variant} border-0`;
  body.textContent = message;
  const t = bootstrap.Toast.getOrCreateInstance(el, { delay });
  t.show();
}

async function loadCats() {
  state.categories = await fetchCategories();
  renderCategories(state);
}
async function loadDishes() {
  state.dishes = await fetchDishes(state.filters);
  renderDishes(state);
}

window.loadDishes = loadDishes;

function bindUI() {
  $('#btnSearch').onclick = () => {
    state.filters.name = $('#searchInput').value.trim();
    state.filters.priceSort = $('#sortSelect').value;
    state.pagination.page = 1;
    loadDishes();
  };

  const si = $('#searchInput');
  si.addEventListener('input', debounce(() => {
    state.filters.name = si.value.trim();
    state.pagination.page = 1;
    renderDishes(state);
  }, 200));

  const btnCart = $('#btnCart');
  if (btnCart) {
    btnCart.onclick = () => {
      const modal = new bootstrap.Modal(document.getElementById('cartModal'));
      modal.show();
    };
  }

  $('#btnClearCart')?.addEventListener('click', () => {
    state.cart = { items: [] };
    localStorage.setItem('cart', JSON.stringify(state.cart));
    renderCartIcon();
    renderDishes(state);
  });

  $('#btnPlaceOrder')?.addEventListener('click', placeOrder);

  $('#deliveryType')?.addEventListener('change', e => {
    const t = e.target.value;
    $('#deliveryLabel').textContent =
      t === 'DineIn' ? 'Nro de mesa' :
      t === 'TakeAway' ? 'Nombre del comensal' :
      'Dirección de entrega';
    $('#deliveryValue').placeholder =
      t === 'DineIn' ? '12' :
      t === 'TakeAway' ? 'Juan Pérez' :
      'Av. Siempreviva 742';
  });

  document.addEventListener('click', e => {
    const addBtn = e.target.closest('[data-add],[data-action="add"],.btn-add');
    if (!addBtn) return;
    showToast();
  });
}

async function init() {
  bindUI();
  loadCart();
  renderCartIcon();
  await Promise.all([loadCats(), loadDishes()]);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
