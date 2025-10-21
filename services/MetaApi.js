import { http } from '../ui/shared/http.js';

export const MetaApi = {
  getCategories: () => http('/Category'),
  getDeliveryTypes: () => http('/DeliveryTypes'),
  getStatuses: () => http('/Status'),
};
