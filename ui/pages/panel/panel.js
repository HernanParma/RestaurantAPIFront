import { OrderApi } from '../../../services/OrderApi.js';
import { $, updateRowTotals, updateOrderTotal } from './helpers.js';
import { renderOrders } from './dom.js';
import { ensureDishes, addItemToOrder } from './api-extra.js';

async function loadOrders() {
  const rawDate = ($('#dateInput')?.value || '').trim();
  const status  = ($('#statusFilter')?.value || '').trim();
  const params = {};
  if (rawDate) params.date = rawDate;
  if (status) params.status = status;
  const orders = await OrderApi.search(params);
  renderOrders(orders || [], {
    onDebouncedSave: saveOrderFromCard,
    onChangeStatus: async (orderId, itemId, statusId) => {
      try { await OrderApi.setItemStatus(orderId, itemId, statusId); await loadOrders(); }
      catch { alert('No se pudo actualizar el estado del ítem'); }
    },
    onAddItem: async (orderId) => {
      const list = await ensureDishes();
      const sel = $('#addItemDish');
      sel.innerHTML = list.map(d => `<option value="${d.dishId ?? d.id}">${d.name ?? d.title ?? '—'}</option>`).join('');
      $('#addItemQty').value = '1';
      $('#addItemNotes').value = '';
      $('#addItemOrderId').value = String(orderId);
      bootstrap.Modal.getOrCreateInstance($('#addItemModal')).show();
    }
  });
}

async function saveOrderFromCard(cardEl) {
  const firstRow = cardEl.querySelector('[data-row]');
  if (!firstRow) return;
  const orderId = firstRow.dataset.order;

  const items = [...cardEl.querySelectorAll('[data-row]')].map(r => ({
    id: r.dataset.item,
    quantity: parseInt(r.querySelector('[data-qty]')?.value || '1', 10),
    notes: r.querySelector('[data-notes]')?.value || ''
  }));

  try { await OrderApi.updateOrder(orderId, items); }
  catch { alert('No se pudieron guardar los cambios de la orden.'); }
}

async function addItemConfirm() {
  const orderId = $('#addItemOrderId').value;
  const dishId = $('#addItemDish').value;
  let qty = parseInt($('#addItemQty').value || '1', 10);
  if (!Number.isFinite(qty) || qty < 1) qty = 1;
  const notes = $('#addItemNotes').value || null;
  try {
    await addItemToOrder(orderId, dishId, qty, notes);
    bootstrap.Modal.getInstance($('#addItemModal'))?.hide();
    await loadOrders();
  } catch (e) {
    alert('No se pudo agregar el ítem: ' + e.message);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const dateInput = $('#dateInput');
  if (dateInput) dateInput.value = '';
  const statusSel = $('#statusFilter');
  if (statusSel) statusSel.value = '';
  $('#btnLoad').onclick = loadOrders;
  $('#addItemConfirm').onclick = addItemConfirm;
  loadOrders();
});
