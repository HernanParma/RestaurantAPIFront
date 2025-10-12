import { MetaApi } from '../../../services/MetaApi.js';
import { DishApi } from '../../../services/DishApi.js';
import { showToast } from '../../components/toast.js';

const $ = (s, r = document) => r.querySelector(s);

async function loadCategories() {
  const data = await MetaApi.getCategories();
  const sel = $('#dishCategory'); sel.innerHTML = '';
  data.sort((a, b) => (a.order ?? 999) - (b.order ?? 999)).forEach(c => {
    const opt = document.createElement('option'); opt.value = c.id; opt.textContent = c.name; sel.appendChild(opt);
  });
}

async function submitDishForm(e) {
  e.preventDefault();
  const name = $('#dishName').value.trim();
  const rawPrice = $('#dishPrice').value.trim();
  const price = Number.parseFloat(rawPrice.replace(/\./g, '').replace(',', '.'));
  const categoryId = $('#dishCategory').value;
  const description = $('#dishDesc').value.trim();
  const image = $('#dishImage').value.trim();

  if (!name || isNaN(price) || !categoryId || !description || !image) {
    showToast('warning', 'Completá todos los campos.', $('#adminAlert')); return;
  }

  try {
    await DishApi.create({ name, description, price, categoryId, image });
    $('#dishForm').reset();
    await loadCategories();
    showToast('success', 'Plato creado correctamente.', $('#adminAlert'));
  } catch (err) {
    showToast('danger', 'No se pudo crear el plato: ' + err.message, $('#adminAlert'));
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadCategories();
  $('#dishForm').addEventListener('submit', submitDishForm);
});
