import { OrderApi } from '../../../services/OrderApi.js';

const $ = (s, r = document) => r.querySelector(s);

const fmtMoney = n => `$${Number(n ?? 0).toFixed(2)}`;
const fmtDate  = d => { try { return new Date(d).toLocaleString('es-AR'); } catch { return ''; } };

const STATUS_DEF = [
  { id: 1, label: 'Pending' },
  { id: 2, label: 'In progress' },
  { id: 3, label: 'Ready' },
  { id: 4, label: 'Delivery' },
  { id: 5, label: 'Closed' },
];

const NAME_TO_ID  = STATUS_DEF.reduce((m, s) => { m[s.label.toLowerCase()] = s.id; return m; }, {});
const ID_TO_LABEL = STATUS_DEF.reduce((m, s) => { m[s.id] = s.label; return m; }, {});
const DELIVERY_LABEL = { 0: 'En mesa', 1: 'Para llevar', 2: 'Delivery' };

const orderIdVisible = o => o.orderNumber ?? o.number ?? o.code ?? o.id ?? '—';
const orderIdApi     = o => o.orderNumber ?? o.orderId ?? o.id ?? o.number ?? o.code;
const createdAt      = o => o.createdAt ?? o.createDate ?? o.created ?? o.createdOn ?? o.date ?? o.timestamp;

const val = (...xs) => xs.find(v => v !== undefined && v !== null);

function normalizeStatusId(raw) {
  if (raw == null) return null;
  if (typeof raw === 'number') return raw;
  if (typeof raw === 'string') return NAME_TO_ID[raw.toLowerCase()] ?? null;
  const byId = raw?.id;
  if (typeof byId === 'number') return byId;
  const byName = raw?.name ?? raw?.label ?? raw?.value;
  if (typeof byName === 'string') return NAME_TO_ID[byName.toLowerCase()] ?? null;
  return null;
}

function pickOrderStatusLabel(o) {
  const raw = o.status ?? o.orderStatus;
  const id = normalizeStatusId(raw);
  return ID_TO_LABEL[id] ?? (typeof raw === 'string' ? raw : 'Pending');
}

const pickItems = o => o.items ?? o.orderItems ?? [];
const itemId    = i => i.id ?? i.itemId ?? i.orderItemId ?? i.lineId;
const itemName  = i => i.name ?? i.dishName ?? i.title ?? i.dish?.name ?? '—';
const itemQty   = i => i.quantity ?? i.qty ?? i.count ?? 0;

function unitPriceOf(i) {
  const q = Number(itemQty(i) || 1) || 1;
  const p = Number(
    val(
      i.price,
      i.unitPrice,
      i.amount,
      i.unit_price,
      i.dish?.price,
      (i.total ?? i.subtotal ?? 0) / q
    )
  );
  return Number.isFinite(p) ? p : 0;
}

function itemStatusId(i) {
  const raw = i.status ?? i.itemStatus ?? i.state;
  return normalizeStatusId(raw) ?? 1;
}

function deliveryTypeText(o) {
  const deliv = o.delivery ?? {};
  const idNum = deliv.id ?? o.deliveryId ?? o.deliveryTypeId;
  const labelFromMap = typeof idNum === 'number' ? (DELIVERY_LABEL[idNum] ?? `Tipo ${idNum}`) : null;
  const typeRaw = o.deliveryType ?? deliv.type ?? deliv.name ?? deliv.label ?? labelFromMap ?? 'Entrega';
  return typeof typeRaw === 'string' ? typeRaw : (typeRaw?.name ?? typeRaw?.label ?? 'Entrega');
}

function whoOf(o) {
  return val(
    o.delivery?.to,
    o.deliveryTo,
    o.identifier,
    o.delivery_to,
    ''
  );
}

const saveTimers = new Map();
const debounceSave = (orderId, fn, ms = 500) => {
  const prev = saveTimers.get(orderId);
  if (prev) clearTimeout(prev);
  const t = setTimeout(fn, ms);
  saveTimers.set(orderId, t);
};

async function loadOrders() {
  const rawDate = ($('#dateInput')?.value || '').trim();
  const status  = ($('#statusFilter')?.value || '').trim();
  const params = {};
  if (rawDate) params.date = rawDate;
  if (status) params.status = status;
  const orders = await OrderApi.search(params);
  renderOrders(orders || []);
}

function renderOrders(orders) {
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
            <span class="badge text-bg-secondary">${ordStat}</span>
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
        debounceSave(orderId, () => saveOrderFromCard(col), 500);
      }

      const bar = e.target.closest('[data-statusbar]');
      const btn = e.target.closest('button[data-statusid]');
      if (bar && btn) {
        const row = bar.closest('[data-row]');
        const orderId = row.dataset.order;
        const iId = row.dataset.item;
        const statusId = Number(btn.dataset.statusid);
        bar.querySelectorAll('button').forEach(b => (b.disabled = true));
        try {
          await OrderApi.setItemStatus(orderId, iId, statusId);
          await loadOrders();
        } catch {
          alert('No se pudo actualizar el estado del ítem');
        }
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
      debounceSave(orderId, () => saveOrderFromCard(col), 600);
    });
  });
}

function updateRowTotals(rowEl) {
  const price = Number(rowEl.dataset.price || 0);
  const qty   = parseInt(rowEl.querySelector('[data-qty]')?.value || '1', 10);
  const line  = price * (Number.isFinite(qty) ? qty : 1);
  const out   = rowEl.querySelector('[data-linetotal]');
  if (out) out.textContent = fmtMoney(line);
}

function updateOrderTotal(cardEl) {
  let total = 0;
  cardEl.querySelectorAll('[data-row]').forEach(r => {
    const price = Number(r.dataset.price || 0);
    const qty   = parseInt(r.querySelector('[data-qty]')?.value || '1', 10);
    total += price * (Number.isFinite(qty) ? qty : 1);
  });
  const tgt = cardEl.querySelector('[data-ordertotal]');
  if (tgt) tgt.textContent = fmtMoney(total);
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

  try {
    await OrderApi.updateOrder(orderId, items);
  } catch {
    alert('No se pudieron guardar los cambios de la orden.');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const dateInput = $('#dateInput');
  if (dateInput) dateInput.value = '';
  const statusSel = $('#statusFilter');
  if (statusSel) statusSel.value = '';
  $('#btnLoad').onclick = loadOrders;
  loadOrders();
});
