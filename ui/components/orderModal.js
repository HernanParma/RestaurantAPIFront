import { cartStore } from '../../shared/cartStore.js';
import { OrderApi } from '../../services/OrderApi.js';
import { showToast } from '../../shared/toast.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

export function bindOrderModal() {
  $('#deliveryType').onchange = e => {
    const t = e.target.value;
    $('#deliveryLabel').textContent =
      t === 'DineIn'   ? 'Nro de mesa' :
      t === 'TakeAway' ? 'Nombre del comensal' :
                          'Dirección de entrega';
    $('#deliveryValue').placeholder =
      t === 'DineIn'   ? 'Mesa 12' :
      t === 'TakeAway' ? 'Juan Pérez' :
                          'Av. Siempreviva 742';
  };

  $('#btnClearCart').onclick = () => {
    CartStore.clear();
    syncLegacyCartAndBadges();
    renderCartModal();
    renderCartIcon();
  };

  $('#btnPlaceOrder').onclick = placeOrder;
}

export function renderCartIcon() {
  const n = cartStore.getCount();
  $('#cartCount') && ($('#cartCount').textContent = n);
  document.querySelectorAll('[data-cart-count]').forEach(el => el.textContent = n);
  const cartBtn = document.querySelector('#appNav a, #appNav button');
  if (cartBtn && /Carrito/i.test(cartBtn.textContent)) {
    cartBtn.textContent = `Carrito (${n})`;
  }
}

export function renderCartModal() {
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

  $$('#cartItems [data-remove]').forEach(btn => {
    btn.onclick = () => {
      cartStore.remove(parseInt(btn.dataset.remove, 10));
      syncLegacyCartAndBadges();
      renderCartModal();
      renderCartIcon();
    };
  });
}

async function placeOrder() {
  if (cartStore.isEmpty()) { showToast('Agregá al menos un plato.', 'warning'); return; }
  const type = $('#deliveryType').value;
  const value = $('#deliveryValue').value.trim();
  if (!value) { showToast('Completá mesa/nombre/dirección.', 'warning'); return; }

  const payload = {
    deliveryType: type,
    identifier: value,
    items: cartStore.getItems().map(i => ({ dishId: i.dishId, quantity: i.quantity, notes: i.notes }))
  };

  try {
    const order = await OrderApi.create(payload);
    const num = order.orderNumber ?? order.id ?? '';
    showToast(`Pedido creado. N° ${num}`, 'success', 3500);
    localStorage.setItem('ident', value);
    CartStore.clear();
    syncLegacyCartAndBadges();
    renderCartModal();
    renderCartIcon();
    bootstrap.Modal.getInstance(document.getElementById('cartModal')).hide();
  } catch {
    showToast('No se pudo crear el pedido.', 'danger');
  }
}

function syncLegacyCartAndBadges() {
  try {
    localStorage.setItem('cart', JSON.stringify({ items: [] }));
  } catch {}
  try {
    if (window.state && window.state.cart) window.state.cart = { items: [] };
  } catch {}
  document.dispatchEvent(new CustomEvent('cart:changed', { detail: { count: cartStore.getCount() } }));
  renderCartIcon();
}
