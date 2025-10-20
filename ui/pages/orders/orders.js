import { api } from './api.js';
import { $, todayStr } from './utils.js';
import { renderOrders } from './renderOrders.js';
import { state } from './state.js';
import { showToast } from '../../shared/toast.js';

function loadFiltersFromStorage() {
  $('#identInput').value = localStorage.getItem('ident') || '';
  const from = localStorage.getItem('mine_from');
  const to   = localStorage.getItem('mine_to');
  $('#fromInput').value = from || todayStr(new Date(Date.now()-7*864e5));
  $('#toInput').value   = to   || todayStr();
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
  state.orders = await api.get('/Order', q);
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
      await api.patch(`/Order/${orderId}`, {
        items: [{ op:'add', dishId, quantity: qty, notes }]
      });
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
