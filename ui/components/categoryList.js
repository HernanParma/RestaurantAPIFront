export function renderCategoryList(container, categories, { onSelect }) {
  container.innerHTML = '';

  const all = document.createElement('button');
  all.className = 'list-group-item list-group-item-action active';
  all.textContent = 'Todas';
  all.onclick = () => onSelect('');
  container.appendChild(all);

  categories
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
    .forEach(c => {
      const btn = document.createElement('button');
      btn.className = 'list-group-item list-group-item-action';
      btn.textContent = c.name;
      btn.dataset.catid = c.id;
      btn.onclick = () => onSelect(c.id);
      container.appendChild(btn);
    });
}

export function highlightCategory(container, catId) {
  container.querySelectorAll('.list-group-item').forEach(el => el.classList.remove('active'));
  const el = container.querySelector(`.list-group-item[data-catid="${catId}"]`);
  (el ?? container.querySelector('.list-group-item')).classList.add('active');
}
