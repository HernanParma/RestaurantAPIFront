import { postOrder } from './api.js';
import { $ } from './utils.js';
import { state } from './state.js';

function mapDeliveryId(type) {
  switch (type) {
    case 'Delivery': return 1;
    case 'TakeAway': return 2;
    case 'DineIn':   return 3;
    default:         return 0;
  }
}

export async function placeOrder() {
  if (!state.cart.items.length) { alert('Agregá al menos un plato.'); return; }

  const typeValue = $('#deliveryType').value;
  const toValue = $('#deliveryValue').value.trim();
  if (!toValue) { alert('Completá mesa/nombre/dirección.'); return; }

  const payload = {
    items: state.cart.items.map(i => ({ id: i.dishId, quantity: i.quantity, notes: i.notes || '' })),
    delivery: { id: mapDeliveryId(typeValue), to: toValue },
    notes: ''
  };

  const order = await postOrder(payload);
  alert(`Pedido creado. N° ${order.id ?? ''}`);
  state.cart = { items: [] };
  localStorage.setItem('cart', JSON.stringify(state.cart));
  const modal = bootstrap.Modal.getInstance(document.getElementById('cartModal'));
  if (modal) modal.hide();
}
