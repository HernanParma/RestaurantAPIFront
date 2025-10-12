const KEY = 'cart';

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) ?? { items: [] }; }
  catch { return { items: [] }; }
}
function save(state) { localStorage.setItem(KEY, JSON.stringify(state)); }

export const CartStore = {
  state: load(),
  add(dish, quantity = 1, notes = '') {
    const idx = this.state.items.findIndex(i => i.dishId === dish.id && i.notes === notes);
    if (idx >= 0) this.state.items[idx].quantity += quantity;
    else this.state.items.push({ dishId: dish.id, name: dish.name, price: dish.price, quantity, notes });
    save(this.state);
  },
  removeAt(i) { this.state.items.splice(i, 1); save(this.state); },
  clear() { this.state = { items: [] }; save(this.state); },
  total() { return this.state.items.reduce((t, i) => t + i.price * i.quantity, 0); },
  count() { return this.state.items.reduce((t, i) => t + i.quantity, 0); },
};
