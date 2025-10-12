import { api } from './http.js';

export const MetaApi = {
  getCategories: () => api.get('/Category'),
  getDeliveryTypes: () => api.get('/deliverytypes'),
  getStatuses: () => api.get('/Status'),
};
