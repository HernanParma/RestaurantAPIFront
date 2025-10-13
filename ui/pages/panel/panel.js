// ui/pages/panel/panel.js
import { OrderApi } from '../../../services/OrderApi.js';

const $ = (s, r = document) => r.querySelector(s);

// ---------- helpers ----------
const fmtMoney = n => `$${Number(n ?? 0).toFixed(2)}`;
const fmtDate  = d => { try { return new Date(d).toLocaleString(); } catch { return ''; } };

// Estados tal cual tu seeding (id + label exacta)
const STATUS_DEF = [
  { id: 1, label: 'Pending' },
  { id: 2, label: 'In progress' },
  { id: 3, label: 'Ready' },
  { id: 4, label: 'Delivery' },
  { id: 5, label: 'Closed' },
];
// Mapeos para normalizar nombres ↔ ids
const NAME_TO_ID  = STATUS_DEF.reduce((m, s) => { m[s.label.toLowerCase()] = s.id; return m; }, {});
const ID_TO_LABEL = STATUS_DEF.reduce((m, s) => { m[s.id] = s.label; return m; }, {});

// entrega (texto)
const DELIVERY_LABEL = { 0: 'En mesa', 1: 'Para llevar', 2: 'Delivery' };

// id visible (para mostrar) y real (para API)
const orderIdVisible = o => o.orderNumber ?? o.number ?? o.code ?? o.id ?? '—';
const orderIdApi     = o => o.orderNumber ?? o.orderId ?? o.id ?? o.number ?? o.code;
// fecha de creación
const createdAt = o =>
  o.createdAt ?? o.createDate ?? o.created ?? o.createdOn ?? o.date ?? o.timestamp;

// ---------- normalizadores de estado ----------
function normalizeStatusId(raw) {
  if (raw == null) return null;
  if (typeof raw === 'number') return raw;
  if (typeof raw === 'string') return NAME_TO_ID[raw.toLowerCase()] ?? null;

  const byId = raw.id;
  if (typeof byId === 'number') return byId;

  const byName = raw.name ?? raw.label ?? raw.value;
  if (typeof byName === 'string') return NAME_TO_ID[byName.toLowerCase()] ?? null;

  return null;
}

function pickOrderStatusLabel(o) {
  const raw = o.status ?? o.orderStatus;
  const id = normalizeStatusId(raw);
  return ID_TO_LABEL[id] ?? (typeof raw === 'string' ? raw : 'Pending');
}

// ítems + helpers
const pickItems = o => o.items ?? o.orderItems ?? [];
const itemId    = i => i.id ?? i.itemId ?? i.orderItemId ?? i.lineId;
const itemName  = i => i.name ?? i.dishName ?? i.title ?? i.dish?.name ?? '—';
const itemQty   = i => i.quantity ?? i.qty ?? i.count ?? 0;
function itemStatusId(i) {
  const raw = i.status ?? i.itemStatus ?? i.state;
  return normalizeStatusId(raw) ?? 1; // default Pending
}

// totals
const orderTotal = o => o.total ?? o.totalAmount ?? o.amount ?? o.summary?.total ?? 0;

// entrega (texto)
function deliveryText(o) {
  const deliv = o.delivery ?? {};
  const idNum = deliv.id ?? o.deliveryId ?? o.deliveryTypeId;
  const labelFromMap =
    typeof idNum === 'number' ? (DELIVERY_LABEL[idNum] ?? `Tipo ${idNum}`) : null;

  const typeRaw = o.deliveryType ?? deliv.type ?? deliv.name ?? deliv.label ?? labelFromMap ?? 'Entrega';
  const typeStr = typeof typeRaw === 'string' ? typeRaw : (typeRaw?.name ?? typeRaw?.label ?? 'Entrega');
  const to = deliv.to ?? o.identifier ?? o.destination ?? '';
  return `${typeStr}${to ? ' • ' + to : ''}`;
}

// ---------- data fetch ----------
async function loadOrders() {
  // ✅ No forzamos fecha por defecto. Construimos params solo con lo que haya.
  const rawDate = ($('#dateInput')?.value || '').trim();
  const status  = ($('#statusFilter')?.value || '').trim();

  const params = {};
  if (rawDate) {
    // Permitir dd/mm/aaaa o yyyy-mm-dd
    const m = rawDate.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    params.date = m ? `${m[3]}-${m[2]}-${m[1]}` : rawDate;
  }
  if (status) params.status = status;

  const orders = await OrderApi.search(params);
  renderOrders(orders || []);
}

// ---------- render ----------
function renderOrders(orders) {
  const grid = $('#ordersGrid');
  grid.innerHTML = '';

  if (!orders.length) {
    grid.innerHTML = `<div class="text-muted">Sin órdenes.</div>`;
    return;
  }

  orders.forEach(o => {
    const idVis   = orderIdVisible(o);
    const idApi   = orderIdApi(o);
    const ordStat = pickOrderStatusLabel(o);
    const items   = pickItems(o);
    const total   = orderTotal(o);
    const deliv   = deliveryText(o);
    const created = createdAt(o);

    const col = document.createElement('div');
    col.className = 'col-12 col-lg-6';
    col.innerHTML = `
      <div class="card h-100 shadow-sm">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <div class="fw-bold">Orden #${idVis}</div>
              <div class="small text-muted">
                ${deliv}${created ? ` • ${fmtDate(created)}` : ''}
              </div>
            </div>
            <span class="badge text-bg-secondary">${ordStat}</span>
          </div>

          <div class="my-3">
            ${items.map(i => {
              const iStatId = itemStatusId(i);
              const iId     = itemId(i);
              return `
                <div class="d-flex align-items-start justify-content-between gap-2 py-1 border-bottom small">
                  <div class="me-2">
                    <div class="fw-semibold">${itemName(i)} × ${itemQty(i)}</div>
                    ${i.notes ? `<div class="text-muted"><em>${i.notes}</em></div>` : ''}
                  </div>
                  <div class="d-flex flex-wrap gap-1" data-order="${idApi}" data-item="${iId}">
                    ${STATUS_DEF.map(s => `
                      <button
                        type="button"
                        class="btn btn-xs btn-sm ${iStatId === s.id ? 'btn-primary' : 'btn-outline-primary'}"
                        data-statusid="${s.id}">
                        ${s.label}
                      </button>
                    `).join('')}
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          <div class="d-flex justify-content-between align-items-center">
            <div class="fw-semibold">Total: ${fmtMoney(total)}</div>
          </div>
        </div>
      </div>
    `;

    grid.appendChild(col);

    // Clicks por ÍTEM (PATCH /Order/{id}/item/{itemId} con { status: <number> })
    col.querySelectorAll('[data-order][data-item]').forEach(group => {
      const orderId = group.getAttribute('data-order');
      const itemId  = group.getAttribute('data-item');

      group.querySelectorAll('button[data-statusid]').forEach(btn => {
        btn.onclick = async () => {
          const statusId = Number(btn.dataset.statusid);
          group.querySelectorAll('button').forEach(b => (b.disabled = true));
          try {
            await OrderApi.setItemStatus(orderId, itemId, statusId);
            await loadOrders();
          } catch (e) {
            console.error(e);
            alert('No se pudo actualizar el estado del ítem');
          } finally {
            group.querySelectorAll('button').forEach(b => (b.disabled = false));
          }
        };
      });
    });
  });
}

// ---------- init ----------
document.addEventListener('DOMContentLoaded', () => {
  // ✅ Dejamos filtros vacíos para traer todo al entrar
  const dateInput = $('#dateInput');
  if (dateInput) dateInput.value = '';
  const statusSel = $('#statusFilter');
  if (statusSel) statusSel.value = '';

  $('#btnLoad').onclick = loadOrders;
  loadOrders(); // carga inmediata sin filtros
});
