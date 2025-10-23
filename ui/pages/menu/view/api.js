import { http } from '../../../shared/http.js';

export async function fetchCategories() {
  return http('/Category');
}

export async function fetchDishes(filters) {
  const cat = filters.categoryId;
  const params = {
    name: filters.name || '',
    SortByPrice: filters.priceSort || '',
    ...(cat ? { categoryId: Number(cat), category: Number(cat) } : {})
  };
  return http('/Dish', { params });
}

export async function updateDish(id, body) {
  return http(`/Dish/${id}`, { method: 'PUT', body });
}

export async function postOrder(payload) {
  return http('/Order', { method: 'POST', body: payload });
}
