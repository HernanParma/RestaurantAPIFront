import { $, $$ } from '../utils.js';
import { state, saveCart, renderCartIcon } from '../state.js';
import { showToast } from '../shared/toast.js';

export function addToCart(dish, quantity = 1, notes = '') {
  if (!Array.isArray(state.cart?.items)) state.cart = { items: [] };
  const idx = state.cart.items.findIndex(i => i.dishId === dish.id && i.notes === notes);
  if (idx >= 0) state.cart.items[idx].quantity += quantity;
  else state.cart.items.push({ dishId: dish.id, name: dish.name, price: dish.price, quantity, notes });

  saveCart();
  renderCartIcon();

  showToast(`¡${dish?.name || 'Plato'} agregado a su pedido!`);
}

export function totalCart() {
  const items = Array.isArray(state.cart?.items) ? state.cart.items : [];
  return items.reduce((t,i)=>t+(Number(i.price)||0)*(Number(i.quantity)||0),0);
}

export function renderCartModal() {
  const items = Array.isArray(state.cart?.items) ? state.cart.items : [];
  const box = $('#cartItems');

  if (!items.length) {
    box.innerHTML = `<div class="text-muted">Tu comanda está vacía.</div>`;
  } else {
    box.innerHTML = items.map((i,idx)=>`
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

  $('#cartTotal').textContent = totalCart().toFixed(2);

  $$('#cartItems [data-remove]').forEach(btn=>{
    btn.onclick = () => {
      const idx = parseInt(btn.dataset.remove, 10);
      state.cart.items.splice(idx,1);
      saveCart();
      renderCartModal();
      renderCartIcon();
    };
  });
}