import { BaseService } from './BaseService.js';
import { http } from '../ui/shared/http.js';

class OrderApiClass extends BaseService {
  constructor() {
    super('/Order');
  }

  async setItemStatus(orderId, itemId, statusId) {
    return http(`${this.basePath}/${orderId}/item/${itemId}`, {
      method: 'PATCH',
      body: { status: statusId },
    });
  }

  async updateOrder(orderId, items) {
    return this.update(orderId, { items });
  }

  async patchOrder(orderId, body) {
    return this.patch(orderId, body);
  }

  async addItemToOrder(orderId, dishId, quantity, notes) {
    return this.patch(orderId, {
      items: [{ op: 'add', dishId, quantity, notes }]
    });
  }
}

export const OrderApi = new OrderApiClass();
