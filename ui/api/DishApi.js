// ui/api/DishApi.js
import { http } from '../shared/http.js';

export const DishApi = {
  async create({ name, description, price, category, image }) {
    const payload = {
      name,
      description,
      price: Number(price),
      category: Number(category), // << ENTERO, clave exacta que espera tu back
      image
    };
    return http('/Dish', { method: 'POST', body: payload });
  }
};
