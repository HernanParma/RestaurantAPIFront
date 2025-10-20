export const $  = (s, r=document) => r.querySelector(s);
export const $$ = (s, r=document) => [...r.querySelectorAll(s)];
export const money = n => `$${Number(n ?? 0).toFixed(2)}`;
export const fmtDate = d => { try { return new Date(d).toLocaleString('es-AR'); } catch { return d ?? ''; } };
export const val = (...xs) => xs.find(v => v !== undefined && v !== null);
export const todayStr = (d=new Date()) => d.toISOString().slice(0,10);

export function unitPriceOf(it) {
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

export function updateCardTotal(cardEl) {
  let total = 0;
  cardEl.querySelectorAll('[data-row]').forEach(r => {
    const price = Number(r.dataset.price || 0);
    const qty   = parseInt(r.querySelector('[data-qty]')?.value || '1', 10);
    total += price * (Number.isFinite(qty) ? qty : 1);
  });
  const tgt = cardEl.querySelector('[data-ordertotal]');
  if (tgt) tgt.textContent = money(total);
}

export function upsertOp(list, op) {
  if (op.orderItemId) {
    const i = list.findIndex(x => x.orderItemId === op.orderItemId);
    if (i >= 0) list[i] = { ...list[i], ...op };
    else list.push(op);
  }
}
