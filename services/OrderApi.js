import { http } from '../ui/shared/http.js';

export const OrderApi = {
  async search(params = {}) {
    return http('/Order', { params });
  },

  async setItemStatus(orderId, itemId, statusId) {
    return http(`/Order/${orderId}/item/${itemId}`, {
      method: 'PATCH',
      body: { status: statusId },
    });
  },

  async updateOrder(orderId, items) {
    return http(`/Order/${orderId}`, { method: 'PUT', body: { items } });
  },
};
