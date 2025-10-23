import { $ } from '../../../shared/utils.js';
import { cartStore } from '../../../shared/cartStore.js';

export const state = {
  categories: [],
  dishes: [],
  filters: { name: '', categoryId: '', priceSort: '' },
  cart: cartStore,
  pagination: { page: 1, perPage: 8 }
};

export function loadCart() { cartStore.load(); }

export function saveCart() { cartStore.save(); }

export function renderCartIcon() {
  const count = cartStore.getCount();
  const el = $('#cartCount');
  if (el) el.textContent = count;
}
