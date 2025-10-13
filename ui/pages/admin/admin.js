// ui/pages/admin/admin.js
import { http } from '../../shared/http.js';
import { DishApi } from '../../api/DishApi.js';

const $ = (s, r = document) => r.querySelector(s);

// ---- UI helpers ----
function showAlert(kind, text) {
  const box = $('#adminAlert');
  box.className = `alert alert-${kind}`;
  box.textContent = text;
  box.classList.remove('d-none');
  setTimeout(() => box.classList.add('d-none'), 4000);
}

// ---- Cargar categorías ----
async function loadCategories() {
  try {
    const data = await http('/Category');
    const sel = $('#dishCategory');
    sel.innerHTML = '';
    data
      .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
      .forEach(c => {
        const opt = document.createElement('option');
        opt.value = String(c.id);        // value del <option>
        opt.textContent = c.name;
        sel.appendChild(opt);
      });
  } catch (err) {
    console.error(err);
    showAlert('danger', 'No pude cargar categorías: ' + err.message);
  }
}

// ---- Submit crear plato ----
async function submitDishForm(e) {
  e.preventDefault();

  const name = $('#dishName').value.trim();
  const rawPrice = $('#dishPrice').value.trim();
  const price = Number.parseFloat(rawPrice.replace(/\./g, '').replace(',', '.'));
  const category = Number.parseInt($('#dishCategory').value, 10); // ID numérico
  const description = $('#dishDesc').value.trim();
  const image = $('#dishImage').value.trim();

  // Validaciones simples
  if (!name) return showAlert('warning', 'Ingresá un nombre.');
  if (!Number.isFinite(price) || price < 0) return showAlert('warning', 'Precio inválido.');
  if (!Number.isInteger(category) || category <= 0) return showAlert('warning', 'Elegí una categoría válida.');
  if (!description) return showAlert('warning', 'Ingresá una descripción.');
  if (!image) return showAlert('warning', 'Ingresá la URL de imagen.');

  try {
    // usa DishApi para normalizar payload
    const created = await DishApi.create({ name, description, price, category, image });
    console.log('CREATED:', created);
    $('#dishForm').reset();
    showAlert('success', 'Plato creado correctamente.');
  } catch (err) {
    console.error('Create dish error:', err);
    showAlert('danger', `No se pudo crear el plato: ${err.message || 'Error desconocido'}`);
  }
}

// ---- Init ----
document.addEventListener('DOMContentLoaded', async () => {
  await loadCategories();
  $('#dishForm').addEventListener('submit', submitDishForm);
});
