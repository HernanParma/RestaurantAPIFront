import { api } from './http.js';

export const DishApi = {
  search: (q) => api.get('/Dish', q),                 // { name?, categoryId?, priceSort: 'asc'|'desc' }
  getById: (id) => api.get(`/Dish/${id}`),
  create: (dto) => api.post('/Dish', dto),            // { name, description, price, categoryId, image }
  update: (id, dto) => api.patch(`/Dish/${id}`, dto),
  remove: (id) => api.del(`/Dish/${id}`),
};
