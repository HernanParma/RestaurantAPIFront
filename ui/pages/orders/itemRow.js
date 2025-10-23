import { val, unitPriceOf, money, updateCardTotal, upsertOp } from '../../shared/utils.js';
import { http } from '../../shared/http.js';

export function createItemRow(it, { isClosed, patchOps, card }) {
  const orderItemId = val(it.id, it.orderItemId);
  const dishId      = val(it.dishId, it.dish?.id, null);
  const dishName    = val(it.dish?.name, it.dishName, it.name, '—');
  const qty         = Number(val(it.quantity, 1));
  let price         = unitPriceOf(it);
  const line        = price * qty;

  const tr = document.createElement('tr');
  tr.setAttribute('data-row', '');
  tr.setAttribute('data-price', String(price));
  tr.innerHTML = `
    <td>${dishName}</td>
    <td>
      <div class="input-group input-group-sm" style="max-width:140px">
        <button class="btn btn-outline-secondary" data-dec>-</button>
        <input class="form-control text-center" type="number" min="1" value="${qty}" data-qty>
        <button class="btn btn-outline-secondary" data-inc>+</button>
      </div>
    </td>
    <td><input class="form-control form-control-sm" value="${val(it.notes, '')}" data-notes></td>
    <td class="text-end"><span data-linetotal>${money(line)}</span></td>
    <td class="text-end"><button class="btn btn-sm btn-outline-danger" data-remove>Quitar</button></td>
  `;

  const qtyInput   = tr.querySelector('[data-qty]');
  const notesInput = tr.querySelector('[data-notes]');

  function updateRowAndTotal() {
    const p = Number(tr.dataset.price || 0);
    const qv = parseInt(qtyInput.value || '1', 10);
    tr.querySelector('[data-linetotal]').textContent = money(p * (Number.isFinite(qv) ? qv : 1));
    updateCardTotal(card);
  }

  function queueUpdate() {
    if (!orderItemId) return;
    upsertOp(patchOps, {
      op:'update',
      orderItemId,
      quantity: parseInt(qtyInput.value,10),
      notes: notesInput.value
    });
  }

  tr.querySelector('[data-inc]').onclick = () => {
    if (isClosed) return;
    qtyInput.value = (+qtyInput.value || 1) + 1;
    updateRowAndTotal();
    queueUpdate();
  };
  tr.querySelector('[data-dec]').onclick = () => {
    if (isClosed) return;
    const v = (+qtyInput.value || 1) - 1;
    qtyInput.value = v < 1 ? 1 : v;
    updateRowAndTotal();
    queueUpdate();
  };
  qtyInput.oninput   = () => { if ((+qtyInput.value || 0) < 1) qtyInput.value = 1; updateRowAndTotal(); };
  qtyInput.onchange  = () => { if (isClosed) return; if ((+qtyInput.value || 0) < 1) qtyInput.value = 1; updateRowAndTotal(); queueUpdate(); };
  notesInput.onchange = () => { if (isClosed) return; queueUpdate(); };

  tr.querySelector('[data-remove]').onclick = () => {
    if (isClosed) return;
    if (!orderItemId) return;
    upsertOp(patchOps, { op:'remove', orderItemId });
    tr.remove();
    updateCardTotal(card);
  };

  if ((price === 0 || !Number.isFinite(price)) && dishId) {
    http(`/Dish/${dishId}`).then(dish => {
      const p2 = Number(val(dish?.price, 0));
      if (p2 > 0) {
        tr.dataset.price = String(p2);
        updateRowAndTotal();
      }
    }).catch(()=>{});
  }

  return tr;
}
