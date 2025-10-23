import { BaseService } from './BaseService.js';
import { http } from '../ui/shared/http.js';

class MetaApiClass extends BaseService {
  constructor() {
    super('/Meta');
  }

  async getCategories() {
    return http('/Category');
  }

  async getDeliveryTypes() {
    return this.list({ type: 'deliveryTypes' });
  }

  async getStatuses() {
    return this.list({ type: 'statuses' });
  }
}

export const MetaApi = new MetaApiClass();
