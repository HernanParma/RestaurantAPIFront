import { $, debounce } from '../../shared/dom.js';
import { CategoryApi, DishApi, OrderApi } from '../../../api/index.js';
import { cart, loadCart, addToCart, removeFromCartIndex, cartCount, cartTotal } from '../../../state/cartStore.js';
import { renderCategories, highlightCategory } from './renderCategories.js';
import { renderDishes } from './renderDishes.js';

const state = {
  categories: [],
  dishes: [],
  filters: { name: '', categoryId: '', priceSort: '' }
};

async function loadCategories() {
  state.categories = await CategoryApi.list();
  renderCategories('#categoryList', state.categories, (catId) => {
    state.filters.categoryId = catId || '';
    loadDishes();
    highlightCategory('#categoryList', catId);
  });
}

async function loadDishes() {
  const params = {
    categoryId: state.filters.categoryId || '',
    priceSort: (state.filters.priceSort || '').toLowerCase()
  };
  state.dishes = await DishApi.list(params);
  renderDishes('#dishGrid', state.dishes, state.filters, (dish, qty, notes) => {
    addToCart(dish, qty, notes);
    renderCartIcon();
  });
}

function renderCartIcon() {
  $('#cartCount').textContent = cartCount();
}

function renderCartModal() {
  const box = $('#cartItems');
  if (!cart.items.length) {
    box.innerHTML = `<div class="text-muted">Tu comanda está vacía.</div>`;
  } else {
    box.innerHTML = cart.items.map((i, idx) => `
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
  $('#cartTotal').textContent = cartTotal().toFixed(2);

  document.querySelectorAll('#cartItems [data-remove]').forEach(btn => {
    btn.onclick = () => { removeFromCartIndex(parseInt(btn.dataset.remove,10)); renderCartModal(); renderCartIcon(); };
  });
}

async function placeOrder() {
  if (!cart.items.length) { alert('Agregá al menos un plato.'); return; }
  const type  = $('#deliveryType').value;
  const value = $('#deliveryValue').value.trim();
  if (!value) { alert('Completá mesa/nombre/dirección.'); return; }

  const payload = {
    deliveryType: type,
    identifier: value,
    items: cart.items.map(i => ({ dishId: i.dishId, quantity: i.quantity, notes: i.notes }))
  };

  const order = await OrderApi.create(payload);
  alert(`Pedido creado. N° ${order.id ?? ''}`);
  cart.items = [];
  localStorage.setItem('cart', JSON.stringify(cart));
  renderCartIcon();
  const modal = bootstrap.Modal.getInstance(document.getElementById('cartModal'));
  if (modal) modal.hide();
}

function bindUI() {
  $('#btnSearch').onclick = () => {
    state.filters.name = $('#searchInput').value.trim();
    state.filters.priceSort = $('#sortSelect').value;
    loadDishes();
  };

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
    cart.items = [];
    localStorage.setItem('cart', JSON.stringify(cart));
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
  loadCart();
  renderCartIcon();
  await loadCategories();
  await loadDishes();
}

document.addEventListener('DOMContentLoaded', init);
