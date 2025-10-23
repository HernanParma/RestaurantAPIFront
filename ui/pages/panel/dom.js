import { $, fmtMoney, fmtDate, STATUS_DEF, orderIdVisible, orderIdApi, createdAt, pickOrderStatusLabel, pickItems, itemStatusId, itemId, itemName, itemQty, unitPriceOf, deliveryTypeText, whoOf, updateRowTotals, updateOrderTotal, debounceSave } from './helpers.js';
import { showToast } from '../../shared/toast.js';
import { http } from '../../shared/http.js';

function updateSummary(container) {
  const summaryBox = container.querySelector('[data-summary]');
  if (!summaryBox) return;
  const rows = [...container.querySelectorAll('[data-row]')];
  const items = rows.map(row => {
    const name = row.querySelector('.item-name')?.textContent?.trim() || '';
    const qty = parseInt(row.querySelector('[data-qty]')?.value || '1', 10);
    const unit = Number(row.dataset.price || 0);
    const q = Number.isFinite(qty) && qty > 0 ? qty : 1;
    return { name, qty: q, unit, value: unit * q };
  });
  summaryBox.innerHTML = items.length ? items.map(it => `
    <div class="d-flex justify-content-between align-items-center py-1">
      <span>${it.name} × ${it.qty} <span class="text-muted">(${fmtMoney(it.unit)} c/u)</span></span>
      <span>${fmtMoney(it.value)}</span>
    </div>
  `).join('') : '<div class="text-muted">Sin ítems.</div>';
}

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
    col.className = 'order-card-wrapper';
    col.innerHTML = `
      <div class="order-sections">
        <div class="order-card card card-info">
          <div class="card-header d-flex justify-content-between align-items-center">
            <div class="card-title">Datos de orden</div>
            <span class="badge bg-secondary">${ordStat}</span>
          </div>
          <div class="px-3 py-2">
            <div><strong>Número:</strong> ${idVis}</div>
            <div><strong>Fecha de creación:</strong> ${created ? fmtDate(created) : '-'}</div>
          </div>
        </div>

        <div class="order-card card card-delivery">
          <div class="card-header">
            <div class="card-title">Información de Entrega</div>
          </div>
          <div class="px-3 py-2">
            <div><strong>Tipo:</strong> ${delivType}</div>
            ${who ? `<div><strong>Para:</strong> ${who}</div>` : ''}
          </div>
        </div>

        <div class="order-card card card-items">
          <div class="card-header">
            <div class="d-flex justify-content-between align-items-center">
              <div class="card-title">Ítems</div>
              <button class="btn btn-sm btn-outline-primary" data-additem="${idApi}" ${ordStat.toLowerCase()==='closed'?'disabled':''}>Agregar ítem</button>
            </div>
          </div>
          <div class="my-3 px-3" data-rows></div>
        </div>

        <div class="order-card card card-summary">
          <div class="card-header">
            <div class="card-title">Resumen</div>
          </div>
          <div class="px-3 pt-2 pb-1" data-summary></div>
          <div class="order-total">
            <div class="total-label">Total: <span data-ordertotal>$0.00</span></div>
          </div>
        </div>
      </div>
    `;
    const rowsBox = col.querySelector('[data-rows]');
    const summaryBox = col.querySelector('[data-summary]');

    const summaryLines = [];
    items.forEach(i => {
      const iStatId = itemStatusId(i);
      const iId     = itemId(i);
      const qty     = Number(itemQty(i)) || 1;
      const price   = unitPriceOf(i);
      const lineTot = price * qty;
      initialTotal += lineTot;
      summaryLines.push({ label: `${itemName(i)} × ${qty} <span class=\"text-muted\">(${fmtMoney(price)} c/u)</span>`, value: lineTot });

      const row = document.createElement('div');
      row.className = 'order-item';
      row.setAttribute('data-row', '');
      row.dataset.order = String(idApi);
      row.dataset.item  = String(iId);
      row.dataset.price = String(price);

      row.innerHTML = `
        <div class="d-flex align-items-start justify-content-between gap-2">
          <div class="me-2 flex-grow-1">
            <div class="item-name">${itemName(i)}</div>
            <div class="quantity-controls">
              <button class="btn btn-outline-secondary" type="button" data-qtyminus>-</button>
              <input type="number" class="form-control" min="1" value="${qty}" data-qty>
              <button class="btn btn-outline-secondary" type="button" data-qtyplus>+</button>
            </div>
            <input class="form-control notes-input" placeholder="Notas…" value="${i.notes ?? ''}" data-notes>
          </div>
          <div class="text-end" style="min-width:110px">
            <div class="price-info">Unit: ${fmtMoney(price)}</div>
            <div class="price-total" data-linetotal>${fmtMoney(lineTot)}</div>
          </div>
        </div>
        <div class="status-buttons" data-statusbar>
          ${STATUS_DEF.map(s => `
            <button type="button"
              class="btn ${iStatId === s.id ? 'active' : ''}"
              data-statusid="${s.id}">
              ${s.label}
            </button>
          `).join('')}
        </div>
      `;
      rowsBox.appendChild(row);

      
      if ((!Number.isFinite(price) || price === 0) && (i.dishId || i.dish?.id)) {
        const dishId = i.dishId ?? i.dish?.id;
        http(`/Dish/${dishId}`).then(dish => {
          const p2 = Number(dish?.price ?? 0);
          if (p2 > 0) {
            row.dataset.price = String(p2);
            const qtyInput = row.querySelector('[data-qty]');
            const qNow = parseInt(qtyInput?.value || '1', 10);
            const unitEl = row.querySelector('.price-info');
            const lineEl = row.querySelector('[data-linetotal]');
            if (unitEl) unitEl.textContent = `Unit: ${fmtMoney(p2)}`;
            if (lineEl) lineEl.textContent = fmtMoney(p2 * (Number.isFinite(qNow) ? qNow : 1));
            updateOrderTotal(col);
            updateSummary(col);
          }
        }).catch(()=>{});
      }
    });
    
    updateOrderTotal(col);
    updateSummary(col);
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
        updateSummary(col);
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
        const buttons = [...bar.querySelectorAll('button')];
        buttons.forEach(b => (b.disabled = true));
        try {
          await handlers.onChangeStatus(orderId, iId, statusId);
        } finally {
          buttons.forEach(b => (b.disabled = false));
        }
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
        updateSummary(col);
      }
      const orderId = row.dataset.order;
      debounceSave(orderId, () => handlers.onDebouncedSave(col), 600);
    });
  });
}
