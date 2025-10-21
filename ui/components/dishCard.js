export function renderDishCard(d, { onAdd }) {
  const FALLBACK = './assets/NoDisponible.jpg';

  const col = document.createElement('div');
  col.className = 'col';
  col.innerHTML = `
    <div class="dish-card card h-100">
      <div class="card-img-container">
        <img
          src="${(d.imageUrl && d.imageUrl.trim()) ? d.imageUrl : FALLBACK}"
          class="card-img-top"
          alt="${d.name ?? 'Plato'}">
      </div>
      <div class="card-body d-flex flex-column">
        <h6 class="card-title">${d.name}</h6>
        <small class="card-text">${d.description ?? ''}</small>
        <div class="dish-price mt-auto">$${Number(d.price).toFixed(2)}</div>
        <div class="mt-2">
          <input class="form-control form-control-sm" placeholder="Notas (sin cebolla, punto...)" data-notes>
        </div>
        <div class="mt-2 d-flex align-items-center gap-2">
          <label class="small text-coffee fw-semibold">Cant.</label>
          <input type="number" class="form-control form-control-sm" value="1" min="1" style="max-width:90px" data-qty>
        </div>
        <button class="btn btn-add-cart mt-3">Agregar</button>
      </div>
    </div>
  `;

  // Fallback si la imagen no carga
  const img = col.querySelector('img');
  img.onerror = () => { img.onerror = null; img.src = FALLBACK; };

  col.querySelector('button.btn-add-cart').onclick = () => {
    const qty = parseInt(col.querySelector('[data-qty]').value || '1', 10);
    const notes = col.querySelector('[data-notes]').value || '';
    onAdd(qty, notes);
  };

  return col;
}
