export const cart = { items: [] };

export function loadCart() {
  try {
    const raw = localStorage.getItem('cart');
    const parsed = raw ? JSON.parse(raw) : null;
    Object.assign(cart, parsed && Array.isArray(parsed.items) ? parsed : { items: [] });
  } catch { Object.assign(cart, { items: [] }); }
}

export function saveCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
}

export function addToCart(dish, quantity=1, notes='') {
  const i = cart.items.findIndex(x => x.dishId === dish.id && x.notes === notes);
  if (i >= 0) cart.items[i].quantity += quantity;
  else cart.items.push({ dishId:dish.id, name:dish.name, price:dish.price, quantity, notes });
  saveCart();
}

export function removeFromCartIndex(idx) {
  cart.items.splice(idx, 1);
  saveCart();
}

export const cartCount = () => cart.items.reduce((a,b)=>a+(b.quantity||0),0);
export const cartTotal = () => cart.items.reduce((t,i)=>t+(Number(i.price)||0)*(Number(i.quantity)||0),0);
