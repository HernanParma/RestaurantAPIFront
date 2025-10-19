import { $ } from '../pages/menu/view/utils.js';
import { state } from '../pages/menu/state.js';

export function renderPager(totalPages) {
  const pager = document.getElementById('pager');
  if (!pager) return;

  const cur = state.pagination.page;
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const windowSize = 5;
  const half = Math.floor(windowSize / 2);
  const start = clamp(cur - half, 1, Math.max(1, totalPages - windowSize + 1));
  const end = Math.min(totalPages, start + windowSize - 1);

  if (totalPages <= 1) { pager.innerHTML = ''; return; }

  const li = [];
  const liBtn = (label, page, disabled=false, active=false) => `
    <li class="page-item ${disabled?'disabled':''} ${active?'active':''}">
      <button class="page-link" ${disabled?'tabindex="-1" aria-disabled="true"':`data-page="${page}"`}>${label}</button>
    </li>
  `;
  li.push(liBtn('«', 1, cur===1));
  li.push(liBtn('‹', cur-1, cur===1));
  for (let p=start; p<=end; p++) li.push(liBtn(String(p), p, false, p===cur));
  li.push(liBtn('›', cur+1, cur===totalPages));
  li.push(liBtn('»', totalPages, cur===totalPages));

  pager.innerHTML = `<nav aria-label="Paginación"><ul class="pagination mb-0">${li.join('')}</ul></nav>`;
  pager.querySelectorAll('[data-page]').forEach(b=>{
    b.onclick = () => { state.pagination.page = parseInt(b.dataset.page,10); window.renderDishes(); };
  });
}