// ui/shared/navbar.js
import { ensureAnyRole, isStaff, logout } from './auth.js';

function isActive(path) {
  const here = location.pathname.split('/').pop().toLowerCase();
  return here === path.toLowerCase();
}

export function renderNavbar(mountId = 'appNav') {
  ensureAnyRole(); // si usás roles, mantiene la sesión válida

  const el = document.getElementById(mountId);
  if (!el) return;

  const btnClass = (hrefName) =>
    'btn ' + (isActive(hrefName) ? 'btn-primary' : 'btn-outline-secondary');

  el.innerHTML = `
    <nav class="navbar navbar-expand-lg bg-body-tertiary border-bottom">
      <div class="container">
        <a class="navbar-brand fw-bold" href="./index.html">Mi Restaurante</a>
        <div class="ms-auto d-flex gap-2 align-items-center">
          <a class="${btnClass('panel.html')}" href="./panel.html" data-role="staff">Panel Órdenes</a>
          <a class="${btnClass('admin.html')}" href="./admin.html" data-role="staff">Nuevo plato</a>
          <a class="${btnClass('orders.html')}" href="./orders.html">Mis pedidos</a>
          <a class="${btnClass('index.html')}" href="./index.html">Menú</a>
          <button id="navLogout" class="btn btn-outline-danger">Salir</button>
        </div>
      </div>
    </nav>
  `;

  if (!isStaff()) {
    el.querySelectorAll('[data-role="staff"]').forEach(n => n.classList.add('d-none'));
  }

  el.querySelector('#navLogout')?.addEventListener('click', logout);
}
