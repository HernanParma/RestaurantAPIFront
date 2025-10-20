import { api } from './api.js';

let dishesCache = null;

export async function ensureDishes() {
  if (dishesCache) return dishesCache;
  dishesCache = await api.get('/Dish');
  return dishesCache;
}
