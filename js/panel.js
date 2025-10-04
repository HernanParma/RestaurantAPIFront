const API_BASE = "https://localhost:5156/api/v1"; // AJUSTAR
const $ = (s, r=document)=> r.querySelector(s);

async function apiGet(path, params = {}) {
  const url = new URL(API_BASE + path);
  Object.entries(params).forEach(([k,v]) => v && url.searchParams.set(k, v));
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}
async function apiPatch(path, body) {
  const res = await fetch(API_BASE + path, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

async function loadOrders() {
  const date = $("#dateInput").value || new Date().toISOString().slice(0,10);
  const status = $("#statusFilter").value;
  // Ejemplo: GET /Order?date=YYYY-MM-DD&status=Pending|InProgress|Ready|Delivered
  const orders = await apiGet("/Order", { date, status });
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
    $("#ordersGrid").appendChild(col);
    col.querySelectorAll("[data-set]").forEach(btn => {
      btn.onclick = async () => {
        try {
          // Ejemplo: PATCH /Order/{id}/status  body: { status: "Ready" }
          await apiPatch(`/Order/${btn.dataset.id}/status`, { status: btn.dataset.set });
          loadOrders();
        } catch (e) { alert("No se pudo actualizar el estado"); }
      };
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  $("#btnLoad").onclick = loadOrders;
  loadOrders();
});
