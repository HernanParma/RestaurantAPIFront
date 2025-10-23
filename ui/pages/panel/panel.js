import { OrderApi } from '../../../services/OrderApi.js';
import { $ } from './helpers.js';
import { renderOrders } from './dom.js';
import { DishesService } from '../../../services/DishesService.js';
import { showToast } from '../../shared/toast.js';

const state = {
  all: [],
  page: 1,
  pageSize: 1,
};

function clampPage() {
  const totalPages = Math.max(1, Math.ceil(state.all.length / state.pageSize));
  if (state.page > totalPages) state.page = totalPages;
  if (state.page < 1) state.page = 1;
  return totalPages;
}

function renderPager(totalPages) {
  const pager = $('#ordersPager');
  if (!pager) return;
  if (totalPages <= 1) { pager.innerHTML = ''; return; }
  const btn = (label, page, disabled = false, active = false) => `
    <button class="btn ${active ? 'btn-elegant' : 'btn-elegant-outline'} mx-1" data-gopage="${page}" ${disabled ? 'disabled' : ''}>${label}</button>
  `;
  const ellipsis = () => `<span class="mx-2 text-muted">…</span>`;

  const parts = [];
  
  parts.push(btn('«', state.page - 1, state.page === 1));

  
  const windowSize = 2; 
  const start = Math.max(1, state.page - windowSize);
  const end = Math.min(totalPages, state.page + windowSize);

  
  if (start > 1) {
    parts.push(btn('1', 1, false, state.page === 1));
  }
  
  if (start > 2) parts.push(ellipsis());

  
  for (let p = start; p <= end; p++) {
    
    if (p === 1 || p === totalPages) continue;
    parts.push(btn(String(p), p, false, p === state.page));
  }

  
  if (end < totalPages - 1) parts.push(ellipsis());

  
  if (totalPages > 1) {
    parts.push(btn(String(totalPages), totalPages, false, state.page === totalPages));
  }

  
  parts.push(btn('»', state.page + 1, state.page === totalPages));

  pager.innerHTML = parts.join('');
  pager.querySelectorAll('[data-gopage]').forEach(b => b.addEventListener('click', () => {
    state.page = parseInt(b.getAttribute('data-gopage'), 10);
    renderPage();
  }));
}

function renderPage() {
  const totalPages = clampPage();
  const start = (state.page - 1) * state.pageSize;
  const pageItems = state.all.slice(start, start + state.pageSize);
  renderOrders(pageItems, {
    onDebouncedSave: saveOrderFromCard,
    onChangeStatus: async (orderId, itemId, statusId) => {
      try { await OrderApi.setItemStatus(orderId, itemId, statusId); await loadOrders(false); }
      catch { showToast('No se pudo actualizar el estado del ítem', 'danger'); }
    },
    onAddItem: async (orderId) => {
      const list = await DishesService.ensureDishes();
      const sel = $('#addItemDish');
      sel.innerHTML = list.map(d => `<option value="${d.dishId ?? d.id}">${d.name ?? d.title ?? '—'}</option>`).join('');
      $('#addItemQty').value = '1';
      $('#addItemNotes').value = '';
      $('#addItemOrderId').value = String(orderId);
      bootstrap.Modal.getOrCreateInstance($('#addItemModal')).show();
    }
  });
  renderPager(totalPages);
}

async function loadOrders(resetPage = true) {
  const rawDate = ($('#dateInput')?.value || '').trim();
  const status  = ($('#statusFilter')?.value || '').trim();
  const params = {};
  if (rawDate) params.date = rawDate;
  if (status) params.status = status;
  const orders = await OrderApi.search(params);
  state.all = orders || [];
  if (resetPage) state.page = 1;
  renderPage();
}

async function saveOrderFromCard(cardEl) {
  const firstRow = cardEl.querySelector('[data-row]');
  if (!firstRow) return;
  const orderId = firstRow.dataset.order;

  const patchItems = [...cardEl.querySelectorAll('[data-row]')]
    .map(r => ({
      op: 'update',
      orderItemId: r.dataset.item,
      quantity: parseInt(r.querySelector('[data-qty]')?.value || '1', 10),
      notes: r.querySelector('[data-notes]')?.value || ''
    }));

  try {
    await OrderApi.patchOrder(orderId, { items: patchItems });
  } catch (e) {
    throw e;
  }
}

async function addItemConfirm() {
  const orderId = $('#addItemOrderId').value;
  const dishId = $('#addItemDish').value;
  let qty = parseInt($('#addItemQty').value || '1', 10);
  if (!Number.isFinite(qty) || qty < 1) qty = 1;
  const notes = $('#addItemNotes').value || null;
  try {
    await OrderApi.addItemToOrder(orderId, dishId, qty, notes);
    bootstrap.Modal.getInstance($('#addItemModal'))?.hide();
    await loadOrders();
  } catch (e) {
    showToast('No se pudo agregar el ítem: ' + (e?.message || ''), 'danger');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const dateInput = $('#dateInput');
  if (dateInput) dateInput.value = '';
  const statusSel = $('#statusFilter');
  if (statusSel) statusSel.value = '';
  $('#btnLoad').onclick = loadOrders;
  $('#addItemConfirm').onclick = addItemConfirm;
  loadOrders();
});
