import { $ } from './utils.js';
import { cart, loadCart as storeLoadCart, saveCart as storeSaveCart } from '../../../state/cartStore.js';

export const state = {
  categories: [],
  dishes: [],
  filters: { name: '', categoryId: '', priceSort: '' },
  cart: cart,
  pagination: { page: 1, perPage: 8 }
};

export function loadCart() { storeLoadCart(); }

export function saveCart() { storeSaveCart(); }

export function renderCartIcon() {
  const items = Array.isArray(state.cart?.items) ? state.cart.items : [];
  const count = items.reduce((a, b) => a + (Number(b.quantity) || 0), 0);
  const el = $('#cartCount');
  if (el) el.textContent = count;
}
