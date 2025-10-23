import { $, money, fmtDate, val } from '../../shared/utils.js';

export function createOrderCard(order) {
  const orderId   = val(order.orderNumber, order.orderId, order.id);
  const createdAt = val(order.createdAt, order.createDate, '');
  const statusStr = val(order.status?.name, order.statusName, order.overallStatusId, '');
  const delivStr  = val(order.deliveryType?.name, order.deliveryTypeName, order.deliveryType, '');
  const totalFromApi = Number(val(order.totalAmount, order.price, 0));
  const createdNice = fmtDate(createdAt);
  const who = val(order.delivery?.to, order.deliveryTo, order.identifier, order.delivery_to, '');

  const card = document.createElement('div');
  card.className = 'card mb-3';
  card.innerHTML = `
    <div class="card-header d-flex justify-content-between align-items-center">
      <div>
        <div><strong>Orden #${orderId ?? ''}</strong></div>
        <div class="small text-muted">
          Tipo de entrega: ${delivStr}
          ${who ? ` • Para: ${who}` : ''}
          ${createdNice ? ` • Fecha de creación: ${createdNice}` : ''}
        </div>
      </div>
      <div class="d-flex gap-2">
        <button class="btn btn-outline-primary btn-sm" data-additem="${orderId}">Agregar ítem</button>
        <span class="badge text-bg-secondary align-self-center">${statusStr}</span>
      </div>
    </div>
    <div class="card-body" data-ordercard="${orderId}">
      <div class="table-responsive">
        <table class="table align-middle mb-0">
          <thead>
            <tr>
              <th>Plato</th>
              <th style="width:140px">Cantidad</th>
              <th>Notas</th>
              <th class="text-end" style="width:140px">Subtotal</th>
              <th style="width:110px"></th>
            </tr>
          </thead>
          <tbody></tbody>
        </table>
      </div>
      <hr>
      <div class="d-flex align-items-center">
        <div class="ms-auto d-flex align-items-center gap-3">
          <strong>Total: <span data-ordertotal>${money(totalFromApi)}</span></strong>
          <button class="btn btn-success" data-save>Guardar cambios</button>
        </div>
      </div>
    </div>
  `;

  return {
    card,
    tbody: card.querySelector('tbody'),
    saveBtn: card.querySelector('[data-save]'),
    orderId,
    statusStr
  };
}

export function disableOrderEdition(cardEl) {
  cardEl.querySelectorAll('[data-row] button, [data-row] input').forEach(el => { el.disabled = true; });
  cardEl.querySelector('[data-additem]')?.setAttribute('disabled','true');
}
