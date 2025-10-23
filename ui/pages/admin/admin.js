
import { http } from '../../shared/http.js';
import { DishesService } from '../../../services/DishesService.js';

const $ = (s, r = document) => r.querySelector(s);

function showAlert(kind, text) {
  const box = $('#adminAlert');
  box.className = `alert alert-${kind}`;
  box.textContent = text;
  box.classList.remove('d-none');
  setTimeout(() => box.classList.add('d-none'), 4000);
}

async function loadCategories(selectedId = null) {
  try {
    const data = await http('/Category');
    const sel = $('#dishCategory');
    if (!sel) {
      console.error('Category select element not found');
      return;
    }
    
    sel.innerHTML = '<option value="">Seleccionar categoría...</option>';
    
    if (Array.isArray(data)) {
      data
        .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
        .forEach(c => {
          const opt = document.createElement('option');
          opt.value = String(c.id);
          opt.textContent = c.name;
          if (selectedId && String(selectedId) === String(c.id)) opt.selected = true;
          sel.appendChild(opt);
        });
    } else {
      console.error('Categories data is not an array:', data);
    }
  } catch (error) {
    console.error('Error loading categories:', error);
    showAlert('danger', 'Error al cargar las categorías');
  }
}

function readPrice(inputStr) {
  const raw = String(inputStr ?? '').trim();
  return Number.parseFloat(raw.replace(/\./g, '').replace(',', '.'));
}

function setUIEditMode(isEdit) {
  const title = $('#formTitle') || document.querySelector('h1,h2,.page-title');
  if (title) title.textContent = isEdit ? 'Editar plato' : 'Nuevo plato';
  const submitBtn = $('#dishForm button[type="submit"]');
  if (submitBtn) submitBtn.textContent = isEdit ? 'Guardar cambios' : 'Guardar plato';
}

async function loadDishIntoForm(id) {
  const d = await http(`/Dish/${id}`);
  console.log('Received dish data from server:', d);
  console.log('Image fields:', { image: d.image, imageUrl: d.imageUrl });
  
  $('#dishName').value  = d.name ?? '';
  $('#dishDesc').value  = d.description ?? '';
  $('#dishImage').value = d.imageUrl ?? d.image ?? '';
  $('#dishPrice').value = (Number(d.price ?? 0)).toString();
  const catId = d.category?.id ?? d.categoryId ?? d.category ?? null;
  if (catId) $('#dishCategory').value = String(catId);
  const active = d.isActive ?? d.active ?? d.available ?? true;
  const chk = $('#dishActive');
  if (chk) chk.checked = !!active;
  
  console.log('Form loaded with image URL:', $('#dishImage').value);
}

async function submitDishForm(e) {
  e.preventDefault();

  const name = $('#dishName').value.trim();
  const price = readPrice($('#dishPrice').value);
  const category = Number.parseInt($('#dishCategory').value, 10);
  const description = $('#dishDesc').value.trim();
  const image = $('#dishImage').value.trim();
  const isActive = $('#dishActive') ? $('#dishActive').checked : true;

  if (!name) return showAlert('warning', 'Ingresá un nombre.');
  if (!Number.isFinite(price) || price < 0) return showAlert('warning', 'Precio inválido.');
  if (!Number.isInteger(category) || category <= 0) return showAlert('warning', 'Elegí una categoría válida.');
  if (!description) return showAlert('warning', 'Ingresá una descripción.');
  if (!image) return showAlert('warning', 'Ingresá la URL de imagen.');

  const params = new URLSearchParams(location.search);
  const editId = params.get('edit');

  try {
    if (editId) {
      
      const body = { 
        name, 
        description, 
        price, 
        category, 
        isActive,
        image: image
      };
      console.log('Sending complete update body:', body);
      
      try {
        await http(`/Dish/${editId}`, { method: 'PUT', body });
        console.log('Dish updated successfully with image');
        
        
        await new Promise(resolve => setTimeout(resolve, 300));
        await loadDishIntoForm(editId);
        
        showAlert('success', 'Plato actualizado correctamente.');
      } catch (error) {
        console.error('Error updating dish:', error);
        showAlert('danger', 'Error al actualizar el plato. Intenta nuevamente.');
      }
    } else {
      await DishesService.create({ name, description, price, category, image: image, isActive });
      $('#dishForm').reset();
      showAlert('success', 'Plato creado correctamente.');
    }
  } catch (err) {
    showAlert('danger', `Error: ${err.message || 'Operación fallida'}`);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(location.search);
  const editId = params.get('edit');

  await loadCategories();
  setUIEditMode(!!editId);
  if (editId) {
    try { await loadDishIntoForm(editId); } catch { showAlert('danger', 'No se pudo cargar el plato.'); }
  }

  $('#dishForm').addEventListener('submit', submitDishForm);

  const clearBtn = $('#btnClear');
  if (clearBtn) clearBtn.onclick = () => $('#dishForm').reset();
});

