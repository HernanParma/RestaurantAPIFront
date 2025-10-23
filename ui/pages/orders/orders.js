import { http } from '../../shared/http.js';
import { $, todayStr } from '../../shared/utils.js';
import { renderOrders } from './renderOrders.js';
import { showToast } from '../../shared/toast.js';

const state = {
  orders: []
};

function loadFiltersFromStorage() {
  $('#identInput').value = localStorage.getItem('ident') || '';
  
  
  const today = new Date();
  const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const from = localStorage.getItem('mine_from');
  const to   = localStorage.getItem('mine_to');
  
  
  $('#fromInput').value = (from && from.trim()) ? from : todayStr(oneWeekAgo);
  $('#toInput').value   = (to && to.trim()) ? to : todayStr(today);
}

function saveFilters() {
  localStorage.setItem('ident', $('#identInput').value.trim());
  localStorage.setItem('mine_from', $('#fromInput').value);
  localStorage.setItem('mine_to',   $('#toInput').value);
}

async function loadOrders() {
  const ident = $('#identInput').value.trim();
  if (!ident) { showToast('Completá tu identificador (mesa/nombre/dirección).', 'warning'); return; }
  const q = {
    deliveryTo: ident,
    from: $('#fromInput').value,
    to:   $('#toInput').value
  };
  window.__lastQueryParams = q;
  state.orders = await http('/Order', { params: q });
  await renderOrders(state, showToast);
}

function bind() {
  $('#btnLoad').onclick = async () => { saveFilters(); await loadOrders(); };

  $('#addItemConfirm').onclick = async () => {
    const orderId = $('#addItemOrderId').value;
    const dishId = $('#addItemDish').value;
    let qty = parseInt($('#addItemQty').value || '1', 10);
    if (!Number.isFinite(qty) || qty < 1) qty = 1;
    const notes = $('#addItemNotes').value || null;
    try {
      await http(`/Order/${orderId}`, { method: 'PATCH', body: { items: [{ op:'add', dishId, quantity: qty, notes }] } });
      bootstrap.Modal.getInstance($('#addItemModal'))?.hide();
      showToast('Ítem agregado a la orden.', 'success', 2200);
      await loadOrders();
    } catch (e) {
      showToast('No se pudo agregar el ítem: ' + e.message, 'danger', 3500);
    }
  };
}

async function init() {
  loadFiltersFromStorage();
  bind();
  await loadOrders();
}

document.addEventListener('DOMContentLoaded', init);
