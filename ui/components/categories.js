import { $, $$ } from '../pages/menu/view/utils.js';
import { state } from '../pages/menu/state.js';

export function renderCategories() {
  const box = $('#categoryList');
  box.innerHTML = '';

  const all = document.createElement('button');
  all.className = 'btn category-pill active';
  all.textContent = 'Todas';
  all.onclick = () => { state.filters.categoryId = ''; state.pagination.page = 1; window.loadDishes(); highlightCategory(''); };
  box.appendChild(all);

  state.categories
    .sort((a,b)=>(a.order ?? 999) - (b.order ?? 999))
    .forEach(c=>{
      const btn = document.createElement('button');
      btn.className = 'btn category-pill';
      btn.textContent = c.name;
      btn.dataset.catid = c.id;
      btn.onclick = () => { state.filters.categoryId = Number(c.id); state.pagination.page = 1; window.loadDishes(); highlightCategory(c.id); };
      box.appendChild(btn);
    });
}

export function highlightCategory(catId) {
  $$('#categoryList .category-pill').forEach(el=>el.classList.remove('active'));
  const el = $(`#categoryList .category-pill[data-catid="${catId}"]`);
  (el ?? $$('#categoryList .category-pill')[0]).classList.add('active');
}