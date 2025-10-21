import { http } from '../../shared/http.js';

let dishesCache = null;

export async function ensureDishes() {
  if (dishesCache) return dishesCache;
  dishesCache = await http('/Dish');
  return dishesCache;
}
