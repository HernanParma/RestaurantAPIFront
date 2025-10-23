export const $ = (selector, context = document) => context.querySelector(selector);
export const $$ = (selector, context = document) => context.querySelectorAll(selector);

export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

export function formatCurrency(amount) {
  return `$${Number(amount).toFixed(2)}`;
}

export function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function handleError(error, defaultMessage = 'Ha ocurrido un error') {
  console.error('Error:', error);
  return error?.message || defaultMessage;
}

export function validateForm(formData, rules) {
  const errors = {};
  
  for (const [field, rule] of Object.entries(rules)) {
    const value = formData[field];
    
    if (rule.required && (!value || value.trim() === '')) {
      errors[field] = `${rule.label || field} es requerido`;
      continue;
    }
    
    if (rule.minLength && value && value.length < rule.minLength) {
      errors[field] = `${rule.label || field} debe tener al menos ${rule.minLength} caracteres`;
      continue;
    }
    
    if (rule.maxLength && value && value.length > rule.maxLength) {
      errors[field] = `${rule.label || field} no puede tener más de ${rule.maxLength} caracteres`;
      continue;
    }
    
    if (rule.pattern && value && !rule.pattern.test(value)) {
      errors[field] = `${rule.label || field} tiene un formato inválido`;
      continue;
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

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
