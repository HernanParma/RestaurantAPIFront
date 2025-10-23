import { $, $$ } from '../shared/utils.js';
import { cartStore } from '../shared/cartStore.js';

export function renderCartModal() {
  const items = cartStore.getItems();
  const box = $('#cartItems');

  if (cartStore.isEmpty()) {
    box.innerHTML = `<div class="text-muted">Tu comanda está vacía.</div>`;
  } else {
    box.innerHTML = items.map((item, idx) => `
      <div class="d-flex justify-content-between align-items-start mb-2">
        <div>
          <div class="fw-semibold">${item.name} × ${item.quantity}</div>
          <div class="small text-muted">${item.notes || ''}</div>
        </div>
        <div class="text-end">
          <div>$${(item.price * item.quantity).toFixed(2)}</div>
          <button class="btn btn-sm btn-outline-danger mt-1" data-remove="${idx}">Quitar</button>
        </div>
      </div>
    `).join('');
  }

  $('#cartTotal').textContent = cartStore.getTotal().toFixed(2);

  $$('#cartItems [data-remove]').forEach(btn => {
    btn.onclick = () => {
      const idx = parseInt(btn.dataset.remove, 10);
      cartStore.remove(idx);
      renderCartModal();
      renderCartIcon();
    };
  });
}

export function renderCartIcon() {
  const countEl = $('#cartCount');
  if (countEl) {
    countEl.textContent = cartStore.getCount();
  }
}


export const addToCart = (dish, quantity, notes) => cartStore.add(dish, quantity, notes);
export const totalCart = () => cartStore.getTotal();