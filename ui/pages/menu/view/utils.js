import { NO_IMAGE } from '../../../shared/env.js';

export const $  = (s, r=document) => r.querySelector(s);
export const $$ = (s, r=document) => [...r.querySelectorAll(s)];
export const debounce = (fn, ms=250) => { let h; return (...a)=>{ clearTimeout(h); h=setTimeout(()=>fn(...a), ms); }; };

export const isAvailable   = d => (d.available ?? d.isActive ?? d.active ?? true);
export const getCategoryId = d => (d.category?.id ?? d.categoryId ?? d.category ?? null);
export const getDishId     = d => (d.id ?? d.dishId ?? d.DishId ?? d.Id);
export const getDishImage  = d => {
  const url = d.imageUrl ?? d.image ?? '';
  return (typeof url === 'string' && url.trim()) ? url : NO_IMAGE;
};

export function applyLocalFilter(dishes, term) {
  const t = (term || '').toLowerCase();
  if (!t) return dishes;
  return dishes.filter(d =>
    (d.name || '').toLowerCase().includes(t) ||
    (d.description || '').toLowerCase().includes(t)
  );
}
