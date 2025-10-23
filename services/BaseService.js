import { http } from '../ui/shared/http.js';

export class BaseService {
  constructor(basePath) {
    this.basePath = basePath;
  }

  async list(params = {}) {
    return http(this.basePath, { params });
  }

  async get(id) {
    return http(`${this.basePath}/${id}`);
  }

  async create(data) {
    return http(this.basePath, {
      method: 'POST',
      body: data
    });
  }

  async update(id, data) {
    return http(`${this.basePath}/${id}`, {
      method: 'PUT',
      body: data
    });
  }

  async patch(id, data) {
    return http(`${this.basePath}/${id}`, {
      method: 'PATCH',
      body: data
    });
  }

  async delete(id) {
    return http(`${this.basePath}/${id}`, {
      method: 'DELETE'
    });
  }

  async search(params = {}) {
    return http(this.basePath, { params });
  }
}
