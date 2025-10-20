import { $, fmtMoney, fmtDate, STATUS_DEF, orderIdVisible, orderIdApi, createdAt, pickOrderStatusLabel, pickItems, itemStatusId, itemId, itemName, itemQty, unitPriceOf, deliveryTypeText, whoOf, updateRowTotals, updateOrderTotal, debounceSave } from './helpers.js';

export function renderOrders(orders, handlers) {
  const grid = $('#ordersGrid');
  grid.innerHTML = '';

  if (!orders.length) {
    grid.innerHTML = `<div class="text-muted">Sin órdenes.</div>`;
    return;
  }

  orders.forEach(o => {
    const idVis     = orderIdVisible(o);
    const idApi     = orderIdApi(o);
    const ordStat   = pickOrderStatusLabel(o);
    const items     = pickItems(o);
    const created   = createdAt(o);
    const delivType = deliveryTypeText(o);
    const who       = whoOf(o);

    let initialTotal = 0;

    const col = document.createElement('div');
    col.className = 'col-12 col-lg-6';
    col.innerHTML = `
      <div class="card h-100 shadow-sm">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <div class="fw-bold">Orden #${idVis}</div>
              <div class="small text-muted">
                Tipo de entrega: ${delivType}${who ? ` • Para: ${who}` : ''}${created ? ` • Fecha de creación: ${fmtDate(created)}` : ''}
              </div>
            </div>
            <div class="d-flex align-items-center gap-2">
              <button class="btn btn-sm btn-outline-primary" data-additem="${idApi}" ${ordStat.toLowerCase()==='closed'?'disabled':''}>Agregar ítem</button>
              <span class="badge text-bg-secondary">${ordStat}</span>
            </div>
          </div>
          <div class="my-3" data-rows></div>
          <div class="d-flex justify-content-between align-items-center">
            <div class="fw-semibold">Total: <span data-ordertotal>$0.00</span></div>
          </div>
        </div>
      </div>
    `;
    const rowsBox = col.querySelector('[data-rows]');

    items.forEach(i => {
      const iStatId = itemStatusId(i);
      const iId     = itemId(i);
      const qty     = Number(itemQty(i)) || 1;
      const price   = unitPriceOf(i);
      const lineTot = price * qty;
      initialTotal += lineTot;

      const row = document.createElement('div');
      row.className = 'py-2 border-bottom';
      row.setAttribute('data-row', '');
      row.dataset.order = String(idApi);
      row.dataset.item  = String(iId);
      row.dataset.price = String(price);

      row.innerHTML = `
        <div class="d-flex align-items-start justify-content-between gap-2">
          <div class="me-2 flex-grow-1">
            <div class="fw-semibold">${itemName(i)}</div>
            <div class="d-flex align-items-center gap-2 mt-1">
              <div class="input-group input-group-sm" style="width:140px">
                <button class="btn btn-outline-secondary" type="button" data-qtyminus>-</button>
                <input type="number" class="form-control text-center" min="1" value="${qty}" data-qty>
                <button class="btn btn-outline-secondary" type="button" data-qtyplus>+</button>
              </div>
              <input class="form-control form-control-sm" placeholder="Notas…" value="${i.notes ?? ''}" data-notes>
            </div>
          </div>
          <div class="text-end" style="min-width:110px">
            <div class="small text-muted">Unit: ${fmtMoney(price)}</div>
            <div class="fw-semibold" data-linetotal>${fmtMoney(lineTot)}</div>
          </div>
        </div>
        <div class="d-flex flex-wrap gap-1 mt-2" data-statusbar>
          ${STATUS_DEF.map(s => `
            <button type="button"
              class="btn btn-xs btn-sm ${iStatId === s.id ? 'btn-primary' : 'btn-outline-primary'}"
              data-statusid="${s.id}">
              ${s.label}
            </button>
          `).join('')}
        </div>
      `;
      rowsBox.appendChild(row);
    });

    col.querySelector('[data-ordertotal]').textContent = fmtMoney(initialTotal);
    grid.appendChild(col);

    col.addEventListener('click', async (e) => {
      const plus  = e.target.closest('[data-qtyplus]');
      const minus = e.target.closest('[data-qtyminus]');
      if (plus || minus) {
        const row = e.target.closest('[data-row]');
        const qtyInput = row.querySelector('[data-qty]');
        let v = parseInt(qtyInput.value || '1', 10);
        v = Number.isFinite(v) ? v : 1;
        v = plus ? v + 1 : Math.max(1, v - 1);
        qtyInput.value = v;
        updateRowTotals(row);
        updateOrderTotal(col);
        const orderId = row.dataset.order;
        debounceSave(orderId, () => handlers.onDebouncedSave(col), 500);
      }

      const bar = e.target.closest('[data-statusbar]');
      const btn = e.target.closest('button[data-statusid]');
      if (bar && btn) {
        const row = bar.closest('[data-row]');
        const orderId = row.dataset.order;
        const iId = row.dataset.item;
        const statusId = Number(btn.dataset.statusid);
        bar.querySelectorAll('button').forEach(b => (b.disabled = true));
        await handlers.onChangeStatus(orderId, iId, statusId);
      }

      const addBtn = e.target.closest('button[data-additem]');
      if (addBtn) {
        const orderId = addBtn.getAttribute('data-additem');
        await handlers.onAddItem(orderId);
      }
    });

    col.addEventListener('input', (e) => {
      const row = e.target.closest('[data-row]');
      if (!row) return;
      if (e.target.matches('[data-qty]')) {
        let v = parseInt(e.target.value || '1', 10);
        if (!Number.isFinite(v) || v < 1) v = 1;
        e.target.value = v;
        updateRowTotals(row);
        updateOrderTotal(col);
      }
      const orderId = row.dataset.order;
      debounceSave(orderId, () => handlers.onDebouncedSave(col), 600);
    });
  });
}
