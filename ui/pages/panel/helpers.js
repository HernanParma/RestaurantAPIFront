export const $ = (s, r = document) => r.querySelector(s);

export const fmtMoney = n => `$${Number(n ?? 0).toFixed(2)}`;
export const fmtDate  = d => { try { return new Date(d).toLocaleString('es-AR'); } catch { return ''; } };

export const STATUS_DEF = [
  { id: 1, label: 'Pending' },
  { id: 2, label: 'In progress' },
  { id: 3, label: 'Ready' },
  { id: 4, label: 'Delivery' },
  { id: 5, label: 'Closed' },
];

export const NAME_TO_ID  = STATUS_DEF.reduce((m, s) => { m[s.label.toLowerCase()] = s.id; return m; }, {});
export const ID_TO_LABEL = STATUS_DEF.reduce((m, s) => { m[s.id] = s.label; return m; }, {});
export const DELIVERY_LABEL = { 0: 'En mesa', 1: 'Para llevar', 2: 'Delivery' };

export const val = (...xs) => xs.find(v => v !== undefined && v !== null);

export const orderIdVisible = o => o.orderNumber ?? o.number ?? o.code ?? o.id ?? '—';
export const orderIdApi     = o => o.orderNumber ?? o.orderId ?? o.id ?? o.number ?? o.code;
export const createdAt      = o => o.createdAt ?? o.createDate ?? o.created ?? o.createdOn ?? o.date ?? o.timestamp;

export function normalizeStatusId(raw) {
  if (raw == null) return null;
  if (typeof raw === 'number') return raw;
  if (typeof raw === 'string') return NAME_TO_ID[raw.toLowerCase()] ?? null;
  const byId = raw?.id;
  if (typeof byId === 'number') return byId;
  const byName = raw?.name ?? raw?.label ?? raw?.value;
  if (typeof byName === 'string') return NAME_TO_ID[byName.toLowerCase()] ?? null;
  return null;
}

export function pickOrderStatusLabel(o) {
  const raw = o.status ?? o.orderStatus;
  const id = normalizeStatusId(raw);
  return ID_TO_LABEL[id] ?? (typeof raw === 'string' ? raw : 'Pending');
}

export const pickItems = o => o.items ?? o.orderItems ?? [];
export const itemId    = i => i.id ?? i.itemId ?? i.orderItemId ?? i.lineId;
export const itemName  = i => i.name ?? i.dishName ?? i.title ?? i.dish?.name ?? '—';
export const itemQty   = i => i.quantity ?? i.qty ?? i.count ?? 0;

export function unitPriceOf(i) {
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

export function itemStatusId(i) {
  const raw = i.status ?? i.itemStatus ?? i.state;
  return normalizeStatusId(raw) ?? 1;
}

export function deliveryTypeText(o) {
  const deliv = o.delivery ?? {};
  const idNum = deliv.id ?? o.deliveryId ?? o.deliveryTypeId;
  const labelFromMap = typeof idNum === 'number' ? (DELIVERY_LABEL[idNum] ?? `Tipo ${idNum}`) : null;
  const typeRaw = o.deliveryType ?? deliv.type ?? deliv.name ?? deliv.label ?? labelFromMap ?? 'Entrega';
  return typeof typeRaw === 'string' ? typeRaw : (typeRaw?.name ?? typeRaw?.label ?? 'Entrega');
}

export function whoOf(o) {
  return val(o.delivery?.to, o.deliveryTo, o.identifier, o.delivery_to, '');
}

const saveTimers = new Map();
export const debounceSave = (orderId, fn, ms = 500) => {
  const prev = saveTimers.get(orderId);
  if (prev) clearTimeout(prev);
  const t = setTimeout(fn, ms);
  saveTimers.set(orderId, t);
};

export function updateRowTotals(rowEl) {
  const price = Number(rowEl.dataset.price || 0);
  const qty   = parseInt(rowEl.querySelector('[data-qty]')?.value || '1', 10);
  const line  = price * (Number.isFinite(qty) ? qty : 1);
  const out   = rowEl.querySelector('[data-linetotal]');
  if (out) out.textContent = fmtMoney(line);
}

export function updateOrderTotal(cardEl) {
  let total = 0;
  cardEl.querySelectorAll('[data-row]').forEach(r => {
    const price = Number(r.dataset.price || 0);
    const qty   = parseInt(r.querySelector('[data-qty]')?.value || '1', 10);
    total += price * (Number.isFinite(qty) ? qty : 1);
  });
  const tgt = cardEl.querySelector('[data-ordertotal]');
  if (tgt) tgt.textContent = fmtMoney(total);
}
