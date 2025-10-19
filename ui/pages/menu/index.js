import { $, debounce } from './view/utils.js';
import { state, loadCart, renderCartIcon } from './view/state.js';
import { fetchCategories, fetchDishes } from './view/api.js';
import { renderCategories } from './view/renderCategories.js';
import { renderDishes } from './view/renderDishes.js';
import { placeOrder } from './view/orders.js';

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
      t === 'DineIn' ? 'Mesa 12' :
      t === 'TakeAway' ? 'Juan Pérez' :
      'Av. Siempreviva 742';
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
