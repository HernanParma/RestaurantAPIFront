import { DishApi } from '../../../services/DishApi.js';
import { MetaApi } from '../../../services/MetaApi.js';
import { CartStore } from '../../../state/cartStore.js';
import { renderDishCard } from '../../components/dishCard.js';
import { renderCategoryList, highlightCategory } from '../../components/categoryList.js';
import { bindOrderModal, renderCartIcon, renderCartModal } from '../../components/orderModal.js';

const $ = (s, r = document) => r.querySelector(s);

const state = {
  filters: { name: '', categoryId: '', priceSort: '' },
  dishes: [],
  categories: []
};

async function loadCategories() {
  state.categories = await MetaApi.getCategories();
  renderCategoryList($('#categoryList'), state.categories, {
    onSelect: (catId) => { state.filters.categoryId = catId; loadDishes(); highlightCategory($('#categoryList'), catId); }
  });
}

async function loadDishes() {
  const q = {
    name: state.filters.name,
    categoryId: state.filters.categoryId,
    priceSort: (state.filters.priceSort || '').toLowerCase()
  };
  state.dishes = await DishApi.search(q);

  const grid = $('#dishGrid');
  grid.innerHTML = '';
  if (!state.dishes.length) {
    grid.innerHTML = `<div class="text-muted">No hay platos para mostrar.</div>`;
    return;
  }
  state.dishes.forEach(d => {
    const card = renderDishCard(d, {
      onAdd: (qty, notes) => { CartStore.add(d, qty, notes); renderCartIcon(); }
    });
    grid.appendChild(card);
  });
}

function bindUI() {
  $('#btnSearch').onclick = () => {
    state.filters.name = $('#searchInput').value.trim();
    state.filters.priceSort = $('#sortSelect').value;
    loadDishes();
  };
  $('#btnCart').onclick = () => {
    renderCartModal();
    new bootstrap.Modal(document.getElementById('cartModal')).show();
  };
  bindOrderModal();
}

document.addEventListener('DOMContentLoaded', async () => {
  bindUI();
  renderCartIcon();
  await loadCategories();
  await loadDishes();
});
