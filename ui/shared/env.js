export const isLocal =
  ['localhost', '127.0.0.1'].includes(location.hostname) ||
  location.protocol === 'file:';

export const API_BASE = isLocal
  ? 'https://localhost:7266/api/v1'
  : 'https://tu-dominio-de-api.com/api/v1';

export const NO_IMAGE = 'assets/NoDisponible.jpg';
