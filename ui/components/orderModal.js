import { CartStore } from '../../state/cartStore.js';
import { OrderApi } from '../../services/OrderApi.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

export function bindOrderModal() {
  // tipos → label/placeholder dinámico
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
    renderCartModal();
    renderCartIcon();
  };

  $('#btnPlaceOrder').onclick = placeOrder;
}

export function renderCartIcon() {
  $('#cartCount').textContent = CartStore.count();
}

export function renderCartModal() {
  const box = $('#cartItems');

  if (!CartStore.state.items.length) {
    box.innerHTML = `<div class="text-muted">Tu comanda está vacía.</div>`;
  } else {
    box.innerHTML = CartStore.state.items.map((i, idx) => `
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

  $('#cartTotal').textContent = CartStore.total().toFixed(2);

  $$('#cartItems [data-remove]').forEach(btn => {
    btn.onclick = () => {
      CartStore.removeAt(parseInt(btn.dataset.remove, 10));
      renderCartModal();
      renderCartIcon();
    };
  });
}

async function placeOrder() {
  if (!CartStore.state.items.length) { alert('Agregá al menos un plato.'); return; }
  const type = $('#deliveryType').value;
  const value = $('#deliveryValue').value.trim();
  if (!value) { alert('Completá mesa/nombre/dirección.'); return; }

  const payload = {
    deliveryType: type,
    identifier: value,
    items: CartStore.state.items.map(i => ({ dishId: i.dishId, quantity: i.quantity, notes: i.notes }))
  };

  try {
    const order = await OrderApi.create(payload);
    alert(`Pedido creado. N° ${order.id ?? ''}`);
    CartStore.clear();
    renderCartModal();
    renderCartIcon();
    bootstrap.Modal.getInstance(document.getElementById('cartModal')).hide();
  } catch (e) {
    console.error(e);
    alert('No se pudo crear el pedido. ' + e.message);
  }
}
