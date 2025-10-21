import { postOrder } from './api.js';
import { $ } from './utils.js';
import { state, renderCartIcon } from './state.js';
import { showToast } from '../../../shared/toast.js';
import { cart } from '../../../state/cartStore.js';

function mapDeliveryId(type) {
  switch (type) {
    case 'Delivery': return 1;
    case 'TakeAway': return 2;
    case 'DineIn':   return 3;
    default:         return 0;
  }
}

export async function placeOrder() {
  if (!cart.items.length) { showToast('Agregá al menos un plato.', 'warning'); return; }

  const typeValue = $('#deliveryType').value;
  const rawTo = $('#deliveryValue').value.trim();
  if (!rawTo) { showToast('Completá mesa/nombre/dirección.', 'warning'); return; }

  let toValue = rawTo;
  if (typeValue === 'DineIn') {
    const n = parseInt(rawTo, 10);
    if (!Number.isFinite(n) || n < 1) { showToast('Ingresá un número de mesa válido.', 'warning'); return; }
    toValue = `Mesa ${n}`;
  }

  const payload = {
    items: cart.items.map(i => ({ id: i.dishId, quantity: i.quantity, notes: i.notes || '' })),
    delivery: { id: mapDeliveryId(typeValue), to: toValue },
    notes: ''
  };

  try {
    const order = await postOrder(payload);
    const num = order.orderNumber ?? order.id ?? '';
    showToast(`Pedido creado. N° ${num}`, 'success', 3500);
    
    // Limpiar el carrito
    cart.items = [];
    localStorage.setItem('cart', JSON.stringify(cart));
    localStorage.setItem('ident', toValue);
    
    // Actualizar la UI
    renderCartIcon();
    
    // Cerrar el modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('cartModal'));
    if (modal) modal.hide();
  } catch (e) {
    showToast('No se pudo crear el pedido.', 'danger');
  }
}
