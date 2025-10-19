import { postOrder } from './api.js';
import { $ } from './utils.js';
import { state } from './state.js';
import { showToast } from '../../../shared/toast.js';

function mapDeliveryId(type) {
  switch (type) {
    case 'Delivery': return 1;
    case 'TakeAway': return 2;
    case 'DineIn':   return 3;
    default:         return 0;
  }
}

export async function placeOrder() {
  if (!state.cart.items.length) { showToast('Agregá al menos un plato.', 'warning'); return; }

  const typeValue = $('#deliveryType').value;
  const toValue = $('#deliveryValue').value.trim();
  if (!toValue) { showToast('Completá mesa/nombre/dirección.', 'warning'); return; }

  const payload = {
    items: state.cart.items.map(i => ({ id: i.dishId, quantity: i.quantity, notes: i.notes || '' })),
    delivery: { id: mapDeliveryId(typeValue), to: toValue },
    notes: ''
  };

  try {
    const order = await postOrder(payload);
    const num = order.orderNumber ?? order.id ?? '';
    showToast(`Pedido creado. N° ${num}`, 'success', 3500);
    state.cart = { items: [] };
    localStorage.setItem('cart', JSON.stringify(state.cart));
    localStorage.setItem('ident', toValue);
    const modal = bootstrap.Modal.getInstance(document.getElementById('cartModal'));
    if (modal) modal.hide();
  } catch (e) {
    showToast('No se pudo crear el pedido.', 'danger');
  }
}
