export function renderDishCard(d, { onAdd }) {
  const FALLBACK = './assets/NoDisponible.jpg';

  const col = document.createElement('div');
  col.className = 'col';
  col.innerHTML = `
    <div class="card h-100">
      <img
        src="${(d.imageUrl && d.imageUrl.trim()) ? d.imageUrl : FALLBACK}"
        class="card-img-top"
        alt="${d.name ?? 'Plato'}">
      <div class="card-body d-flex flex-column">
        <h6 class="card-title mb-1">${d.name}</h6>
        <small class="text-muted mb-2">${d.description ?? ''}</small>
        <div class="mt-auto d-flex justify-content-between align-items-center">
          <span class="fw-bold">$${Number(d.price).toFixed(2)}</span>
          <button class="btn btn-sm btn-primary">Agregar</button>
        </div>
        <div class="mt-2">
          <input class="form-control form-control-sm" placeholder="Notas..." data-notes>
        </div>
        <div class="mt-2 d-flex align-items-center gap-2">
          <label class="small">Cant.</label>
          <input type="number" class="form-control form-control-sm" value="1" min="1" style="max-width:90px" data-qty>
        </div>
      </div>
    </div>
  `;

  // Fallback si la imagen no carga
  const img = col.querySelector('img');
  img.onerror = () => { img.onerror = null; img.src = FALLBACK; };

  col.querySelector('button.btn-primary').onclick = () => {
    const qty = parseInt(col.querySelector('[data-qty]').value || '1', 10);
    const notes = col.querySelector('[data-notes]').value || '';
    onAdd(qty, notes);
  };

  return col;
}
