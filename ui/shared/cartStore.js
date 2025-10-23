import { showToast } from './toast.js';

const CART_KEY = 'restaurant_cart';

class CartStore {
  constructor() {
    this.items = [];
    this.load();
  }

  load() {
    try {
      const stored = localStorage.getItem(CART_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.items = Array.isArray(data.items) ? data.items : [];
      }
    } catch (error) {
      console.error('Error loading cart:', error);
      this.items = [];
    }
  }

  save() {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify({ items: this.items }));
    } catch (error) {
      console.error('Error saving cart:', error);
    }
  }

  add(dish, quantity = 1, notes = '') {
    if (!dish || !dish.id) return false;

    const existingIndex = this.items.findIndex(
      item => item.dishId === dish.id && item.notes === notes
    );

    if (existingIndex >= 0) {
      this.items[existingIndex].quantity += quantity;
    } else {
      this.items.push({
        dishId: dish.id,
        name: dish.name,
        price: dish.price,
        quantity,
        notes
      });
    }

    this.save();
    showToast(`¡${dish.name} agregado al carrito!`);
    return true;
  }

  remove(index) {
    if (index >= 0 && index < this.items.length) {
      this.items.splice(index, 1);
      this.save();
      return true;
    }
    return false;
  }

  updateQuantity(index, quantity) {
    if (index >= 0 && index < this.items.length && quantity > 0) {
      this.items[index].quantity = quantity;
      this.save();
      return true;
    }
    return false;
  }

  clear() {
    this.items = [];
    this.save();
  }

  getTotal() {
    return this.items.reduce((total, item) => {
      return total + (Number(item.price) || 0) * (Number(item.quantity) || 0);
    }, 0);
  }

  getCount() {
    return this.items.reduce((count, item) => count + (Number(item.quantity) || 0), 0);
  }

  isEmpty() {
    return this.items.length === 0;
  }

  getItems() {
    return [...this.items];
  }
}

export const cartStore = new CartStore();

export const cart = cartStore;
export const addToCart = (dish, quantity, notes) => cartStore.add(dish, quantity, notes);
export const removeFromCartIndex = (index) => cartStore.remove(index);
export const cartCount = () => cartStore.getCount();
export const cartTotal = () => cartStore.getTotal();
export const loadCart = () => cartStore.load();
export const saveCart = () => cartStore.save();
