import { api } from './http.js';

export const OrderApi = {
  create: (dto) => api.post('/Order', dto),                   // { deliveryType, identifier, items: [{dishId,quantity,notes}] }
  search: (q) => api.get('/Order', q),                        // { date?, status? }
  getById: (id) => api.get(`/Order/${id}`),
  setStatus: (id, status) => api.patch(`/Order/${id}/status`, { status }),

  // Ítems de la orden (si tu OpenAPI los expone así)
  addItem: (id, dto) => api.post(`/Order/${id}/item`, dto),   // { dishId, quantity, notes }
  updateItem: (id, itemId, dto) => api.patch(`/Order/${id}/item/${itemId}`, dto),
  removeItem: (id, itemId) => api.del(`/Order/${id}/item/${itemId}`),
};
