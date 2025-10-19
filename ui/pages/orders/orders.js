const isLocalHost =
  location.hostname === 'localhost' ||
  location.hostname === '127.0.0.1' ||
  location.port === '5500';

const API_BASE = isLocalHost
  ? 'https://localhost:7266/api/v1'
  : 'https://tu-dominio-de-api.com/api/v1';

const $  = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];
const money = n => `$${Number(n ?? 0).toFixed(2)}`;
const fmtDate = d => { try { return new Date(d).toLocaleString('es-AR'); } catch { return d ?? ''; } };

import { showToast } from '../../shared/toast.js';

const api = {
  get:   (p, q) => http(API_BASE + p, { params: q }),
  patch: (p, b) => http(API_BASE + p, { method: 'PATCH', body: b })
};

async function http(url, { method='GET', params=null, body=null, headers={}, timeoutMs=10000 }={}) {
  const u = new URL(url);
  if (params) Object.entries(params).forEach(([k,v]) => v!=='' && v!=null && u.searchParams.set(k, v));
  const ctrl = new AbortController();
  const t = setTimeout(()=>ctrl.abort('timeout'), timeoutMs);
  try {
    const res = await fetch(u, {
      method,
      headers: { Accept:'application/json', ...(body?{'Content-Type':'application/json'}:{}), ...headers },
      body: body ? JSON.stringify(body) : null,
      signal: ctrl.signal,
      credentials: 'include'
    });
    if (!res.ok) {
      let msg = `${res.status} ${res.statusText}`;
      try { const j = await res.json(); msg = j.message || j.error || msg; } catch {}
      throw new Error(msg);
    }
    return res.status === 204 ? null : res.json();
  } finally {
    clearTimeout(t);
  }
}

const val = (...xs) => xs.find(v => v !== undefined && v !== null);

function unitPriceOf(it) {
  const qty = Number(val(it.quantity, 1)) || 1;
  const p = Number(
    val(
      it.price,
      it.unitPrice,
      it.amount,
      it.unit_price,
      it.dish?.price,
      (it.total ?? it.subtotal ?? 0) / qty
    )
  );
  return Number.isFinite(p) ? p : 0;
}

const state = { orders: [] };
let dishesCache = null;

async function ensureDishes() {
  if (dishesCache) return dishesCache;
  dishesCache = await api.get('/Dish');
  return dishesCache;
}

function todayStr(d=new Date()) { return d.toISOString().slice(0,10); }

function loadFiltersFromStorage() {
  $('#identInput').value = localStorage.getItem('ident') || '';
  const from = localStorage.getItem('mine_from');
  const to   = localStorage.getItem('mine_to');
  $('#fromInput').value = from || todayStr(new Date(Date.now()-7*864e5));
  $('#toInput').value   = to   || todayStr();
}

function saveFilters() {
  localStorage.setItem('ident', $('#identInput').value.trim());
  localStorage.setItem('mine_from', $('#fromInput').value);
  localStorage.setItem('mine_to',   $('#toInput').value);
}

async function loadOrders() {
  const ident = $('#identInput').value.trim();
  if (!ident) { showToast('Completá tu identificador (mesa/nombre/dirección).', 'warning'); return; }
  const q = {
    deliveryTo: ident,
    from: $('#fromInput').value,
    to:   $('#toInput').value
  };
  state.orders = await api.get('/Order', q);
  await renderOrders();
}

async function renderOrders() {
  const box = $('#ordersContainer');
  box.innerHTML = '';
  if (!state.orders?.length) {
    box.innerHTML = `<div class="text-muted">No tenés pedidos en el rango indicado.</div>`;
    return;
  }

  for (const order of state.orders) {
    const orderId   = val(order.orderNumber, order.orderId, order.id);
    const createdAt = val(order.createdAt, order.createDate, '');
    const statusStr = val(order.status?.name, order.statusName, order.overallStatusId, '');
    const delivStr  = val(order.deliveryType?.name, order.deliveryTypeName, order.deliveryType, '');
    const totalFromApi = Number(val(order.totalAmount, order.price, 0));
    const items     = val(order.items, []);
    const createdNice = fmtDate(createdAt);
    const who = val(order.delivery?.to, order.deliveryTo, order.identifier, order.delivery_to, '');

    const statusNameLc = String(statusStr).toLowerCase();
    const statusIdNum  = Number(statusStr);
    const isClosed = statusIdNum === 5 || statusNameLc === 'closed' || statusNameLc === 'cerrada';

    const card = document.createElement('div');
    card.className = 'card mb-3';
    card.innerHTML = `
      <div class="card-header d-flex justify-content-between align-items-center">
        <div>
          <div><strong>Orden #${orderId ?? ''}</strong></div>
          <div class="small text-muted">
            Tipo de entrega: ${delivStr}
            ${who ? ` • Para: ${who}` : ''}
            ${createdNice ? ` • Fecha de creación: ${createdNice}` : ''}
          </div>
        </div>
        <div class="d-flex gap-2">
          <button class="btn btn-outline-primary btn-sm" data-additem="${orderId}">Agregar ítem</button>
          <span class="badge text-bg-secondary align-self-center">${statusStr}</span>
        </div>
      </div>
      <div class="card-body" data-ordercard="${orderId}">
        <div class="table-responsive">
          <table class="table align-middle mb-0">
            <thead>
              <tr>
                <th>Plato</th>
                <th style="width:140px">Cantidad</th>
                <th>Notas</th>
                <th class="text-end" style="width:140px">Subtotal</th>
                <th style="width:110px"></th>
              </tr>
            </thead>
            <tbody></tbody>
          </table>
        </div>
        <hr>
        <div class="d-flex align-items-center">
          <div class="ms-auto d-flex align-items-center gap-3">
            <strong>Total: <span data-ordertotal>${money(totalFromApi)}</span></strong>
            <button class="btn btn-success" data-save>Guardar cambios</button>
          </div>
        </div>
      </div>
    `;
    box.appendChild(card);

    const tbody = card.querySelector('tbody');
    const patchOps = [];

    for (const it of items) {
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
      tbody.appendChild(tr);

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
        try {
          const dish = await api.get(`/Dish/${dishId}`);
          const p2 = Number(val(dish?.price, 0));
          if (p2 > 0) {
            tr.dataset.price = String(p2);
            updateRowAndTotal();
          }
        } catch {}
      }
    }

    const saveBtn = card.querySelector('[data-save]');
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
        await loadOrders();
      } catch(e) {
        showToast('No se pudo guardar: ' + e.message, 'danger', 4000);
      } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = originalHtml;
      }
    };

    if (isClosed) {
      saveBtn.disabled = true;
      saveBtn.title = 'La orden está cerrada';
      card.querySelectorAll('[data-row] button, [data-row] input').forEach(el => { el.disabled = true; });
      card.querySelector('[data-additem]')?.setAttribute('disabled','true');
    }

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

    updateCardTotal(card);
  }
}

function updateCardTotal(cardEl) {
  let total = 0;
  cardEl.querySelectorAll('[data-row]').forEach(r => {
    const price = Number(r.dataset.price || 0);
    const qty   = parseInt(r.querySelector('[data-qty]')?.value || '1', 10);
    total += price * (Number.isFinite(qty) ? qty : 1);
  });
  const tgt = cardEl.querySelector('[data-ordertotal]');
  if (tgt) tgt.textContent = money(total);
}

function upsertOp(list, op) {
  if (op.orderItemId) {
    const i = list.findIndex(x => x.orderItemId === op.orderItemId);
    if (i >= 0) list[i] = { ...list[i], ...op };
    else list.push(op);
    return;
  }
}

function bind() {
  $('#btnLoad').onclick = async () => { saveFilters(); await loadOrders(); };
  $('#addItemConfirm').onclick = async () => {
    const orderId = $('#addItemOrderId').value;
    const dishId = $('#addItemDish').value;
    let qty = parseInt($('#addItemQty').value || '1', 10);
    if (!Number.isFinite(qty) || qty < 1) qty = 1;
    const notes = $('#addItemNotes').value || null;
    try {
      await api.patch(`/Order/${orderId}`, {
        items: [{ op:'add', dishId, quantity: qty, notes }]
      });
      bootstrap.Modal.getInstance($('#addItemModal'))?.hide();
      showToast('Ítem agregado a la orden.', 'success', 2200);
      await loadOrders();
    } catch (e) {
      showToast('No se pudo agregar el ítem: ' + e.message, 'danger', 3500);
    }
  };
}

async function init() {
  loadFiltersFromStorage();
  bind();
  await loadOrders();
}

document.addEventListener('DOMContentLoaded', init);
