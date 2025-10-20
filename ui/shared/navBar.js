// ui/shared/navbar.js
import { ensureAnyRole, isStaff, logout } from './auth.js';

function isActive(path) {
  const here = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  return here === path.toLowerCase();
}

export function renderNavbar(mountId = 'appNav') {
  ensureAnyRole();

  const mount = document.getElementById(mountId);
  if (!mount) return;

  const here = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const onMenuPage = here === 'index.html' || !!document.getElementById('cartModal');

  const btnClass = (hrefName) =>
    'btn ' + (isActive(hrefName) ? 'btn-primary' : 'btn-outline-secondary');

  mount.innerHTML = `
    <nav class="navbar fixed-top bg-body-tertiary border-bottom shadow-sm">
      <div class="container">
        <a class="navbar-brand fw-bold" href="./index.html">Mi Restaurante</a>
        <div class="ms-auto d-flex gap-2 align-items-center">
          <a class="${btnClass('panel.html')}" href="./panel.html" data-role="staff">Panel Órdenes</a>
          <a class="${btnClass('admin.html')}" href="./admin.html" data-role="staff" title="Crear nuevo plato">Nuevo plato</a>
          <a class="${btnClass('orders.html')}" href="./orders.html" data-role="guest">Mis pedidos</a>
          ${!isActive('index.html') ? `<a class="${btnClass('index.html')}" href="./index.html">Menú</a>` : ''}
          ${onMenuPage ? `<button id="btnCart" class="btn btn-primary">Carrito (<span id="cartCount">0</span>)</button>` : ''}
          <button id="navLogout" class="btn btn-outline-danger">Salir</button>
        </div>
      </div>
    </nav>
  `;

  if (!isStaff()) {
    mount.querySelectorAll('[data-role="staff"]').forEach(n => n.classList.add('d-none'));
  } else {
    mount.querySelectorAll('[data-role="guest"]').forEach(n => n.classList.add('d-none'));
  }

  mount.querySelector('#navLogout')?.addEventListener('click', logout);

  const navEl = mount.querySelector('.navbar');
  if (navEl) document.body.style.paddingTop = `${navEl.offsetHeight}px`;
}
