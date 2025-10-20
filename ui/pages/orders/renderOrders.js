import { $, val } from './utils.js';
import { api } from './api.js';
import { ensureDishes } from './dishesRepo.js';
import { createOrderCard, disableOrderEdition } from './orderCard.js';
import { createItemRow } from './itemRow.js';

export async function renderOrders(state, showToast) {
  const box = $('#ordersContainer');
  box.innerHTML = '';
  if (!state.orders?.length) {
    box.innerHTML = `<div class="text-muted">No tenés pedidos en el rango indicado.</div>`;
    return;
  }

  for (const order of state.orders) {
    const { card, tbody, saveBtn, orderId, statusStr } = createOrderCard(order);
    box.appendChild(card);

    const statusNameLc = String(statusStr).toLowerCase();
    const statusIdNum  = Number(statusStr);
    const isClosed = statusIdNum === 5 || statusNameLc === 'closed' || statusNameLc === 'cerrada';

    const items = val(order.items, []);
    const patchOps = [];

    for (const it of items) {
      const tr = createItemRow(it, { isClosed, patchOps, card });
      tbody.appendChild(tr);
    }

    saveBtn.onclick = async () => {
      if (isClosed) { showToast('La orden está cerrada. No se pueden aplicar cambios.', 'warning'); return; }
      if (!patchOps.length) { showToast('No hay cambios para enviar.', 'info'); return; }
      const payload = {
        deliveryTo: order.deliveryTo,
        items: patchOps.map(m => ({
          op: m.op,
          orderItemId: m.orderItemId ?? null,
          dishId: m.dishId ?? null,
          quantity: m.quantity ?? null,
          notes: m.notes ?? null
        }))
      };
      const originalHtml = saveBtn.innerHTML;
      saveBtn.disabled = true;
      saveBtn.innerHTML = 'Guardando…';
      try {
        await api.patch(`/Order/${orderId}`, payload);
        showToast('Cambios aplicados.', 'success', 2500);
        const refreshed = await api.get('/Order', window.__lastQueryParams || {});
        state.orders = refreshed;
        await renderOrders(state, showToast);
      } catch(e) {
        showToast('No se pudo guardar: ' + e.message, 'danger', 4000);
      } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = originalHtml;
      }
    };

    if (isClosed) disableOrderEdition(card);

    card.querySelector('[data-additem]')?.addEventListener('click', async () => {
      if (isClosed) { showToast('La orden está cerrada.', 'warning'); return; }
      const list = await ensureDishes();
      const sel = $('#addItemDish');
      sel.innerHTML = list.map(d => `<option value="${d.dishId ?? d.id}">${d.name ?? d.title ?? '—'}</option>`).join('');
      $('#addItemQty').value = '1';
      $('#addItemNotes').value = '';
      $('#addItemOrderId').value = String(orderId);
      bootstrap.Modal.getOrCreateInstance($('#addItemModal')).show();
    });
  }
}
