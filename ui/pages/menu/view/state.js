import { $ } from './utils.js';

export const state = {
  categories: [],
  dishes: [],
  filters: { name: '', categoryId: '', priceSort: '' },
  cart: { items: [] },
  pagination: { page: 1, perPage: 6 }
};

export function loadCart() {
  try {
    const raw = localStorage.getItem('cart');
    const parsed = raw ? JSON.parse(raw) : null;
    state.cart = (parsed && Array.isArray(parsed.items)) ? parsed : { items: [] };
  } catch { state.cart = { items: [] }; }
}

export function saveCart() {
  const safe = Array.isArray(state.cart?.items) ? state.cart : { items: [] };
  localStorage.setItem('cart', JSON.stringify(safe));
}

export function renderCartIcon() {
  const items = Array.isArray(state.cart?.items) ? state.cart.items : [];
  const count = items.reduce((a, b) => a + (Number(b.quantity) || 0), 0);
  const el = $('#cartCount');
  if (el) el.textContent = count;
}
