import { NO_IMAGE } from '../../../shared/env.js';

import { $, $$ } from '../../../shared/utils.js';
export const debounce = (fn, ms=250) => { let h; return (...a)=>{ clearTimeout(h); h=setTimeout(()=>fn(...a), ms); }; };

export const isAvailable   = d => (d.available ?? d.isActive ?? d.active ?? true);
export const getCategoryId = d => (d.category?.id ?? d.categoryId ?? d.category ?? null);
export const getDishId     = d => (d.id ?? d.dishId ?? d.DishId ?? d.Id);
export const getDishImage  = d => {
  const url = d.imageUrl ?? d.image ?? '';
  console.log('getDishImage called with:', d);
  console.log('Image URL found:', url);
  const result = (typeof url === 'string' && url.trim()) ? url : NO_IMAGE;
  console.log('getDishImage returning:', result);
  return result;
};

export function applyLocalFilter(dishes, term) {
  const t = (term || '').toLowerCase();
  if (!t) return dishes;
  return dishes.filter(d =>
    (d.name || '').toLowerCase().includes(t) ||
    (d.description || '').toLowerCase().includes(t)
  );
}
