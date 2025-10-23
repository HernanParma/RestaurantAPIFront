import { isLocal, API_BASE, NO_IMAGE } from './env.js';

export const CONFIG = {
  API_BASE,
  TIMEOUT: 10000,
  
  DEBOUNCE_DELAY: 200,
  THROTTLE_DELAY: 100,
  TOAST_DELAY: 2000,
  
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 50,
  
  CART_KEY: 'restaurant_cart',
  
  NO_IMAGE,
  FALLBACK_IMAGE: './assets/NoDisponible.jpg',
  
  MIN_PASSWORD_LENGTH: 6,
  MAX_NAME_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 500,
  
  ROLES: {
    STAFF: 'staff',
    GUEST: 'guest'
  },
  
  ORDER_STATUS: {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    PREPARING: 'preparing',
    READY: 'ready',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled'
  },
  
  DELIVERY_TYPES: {
    DINE_IN: 'DineIn',
    TAKEAWAY: 'TakeAway',
    DELIVERY: 'Delivery'
  }
};

export const DEV_CONFIG = {
  ENABLE_LOGGING: isLocal,
  ENABLE_DEBUG: isLocal,
  MOCK_API: false
};
