import { BaseService } from './BaseService.js';
import { http } from '../ui/shared/http.js';

let dishesCache = null;

class DishesServiceClass extends BaseService {
  constructor() {
    super('/Dish');
  }

  async ensureDishes() {
    if (dishesCache) return dishesCache;
    dishesCache = await this.list();
    return dishesCache;
  }

  async categories() {
    return http('/Category');
  }

  clearCache() {
    dishesCache = null;
  }
}

export const DishesService = new DishesServiceClass();


