import { http } from '../ui/shared/http.js';

let dishesCache = null;

export const DishesService = {
  async list(params = {}) {
    return http('/Dish', { params });
  },

  async ensureDishes() {
    if (dishesCache) return dishesCache;
    dishesCache = await http('/Dish');
    return dishesCache;
  },

  async categories() {
    return http('/Category');
  },
};


