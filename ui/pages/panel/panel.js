import { OrderApi } from '../../../services/OrderApi.js';

const $ = (s, r = document) => r.querySelector(s);

async function loadOrders() {
  const date = $("#dateInput").value || new Date().toISOString().slice(0,10);
  const status = $("#statusFilter").value;
  const orders = await OrderApi.search({ date, status });
  renderOrders(orders);
}

function renderOrders(orders) {
  const grid = $("#ordersGrid");
  grid.innerHTML = "";
  if (!orders.length) { grid.innerHTML = `<div class="text-muted">Sin órdenes.</div>`; return; }

  orders.forEach(o => {
    const col = document.createElement("div"); col.className = "col-12 col-lg-6";
    col.innerHTML = `
      <div class="card h-100">
        <div class="card-body">
          <div class="d-flex justify-content-between">
            <div class="fw-bold">Orden #${o.id}</div>
            <span class="badge text-bg-secondary">${o.status}</span>
          </div>
          <div class="small text-muted mb-2">${o.deliveryType} • ${o.identifier ?? ""}</div>
          <ul class="small mb-3">
            ${o.items.map(i => `<li>${i.name} × ${i.quantity} ${i.notes?`<em>(${i.notes})</em>`:""}</li>`).join("")}
          </ul>
          <div class="d-flex gap-2">
            ${["Pending","InProgress","Ready","Delivered"].map(s =>
              `<button class="btn btn-sm ${o.status===s?"btn-primary":"btn-outline-primary"}" data-set="${s}" data-id="${o.id}">${s}</button>`
            ).join("")}
          </div>
        </div>
      </div>
    `;
    grid.appendChild(col);
    col.querySelectorAll("[data-set]").forEach(btn => {
      btn.onclick = async () => {
        try {
          await OrderApi.setStatus(btn.dataset.id, btn.dataset.set);
          loadOrders();
        } catch { alert("No se pudo actualizar el estado"); }
      };
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  $("#btnLoad").onclick = loadOrders;
  loadOrders();
});
