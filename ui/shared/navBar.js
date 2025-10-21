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
  const onMenuPage  = here === 'index.html' || !!document.getElementById('cartModal');
  const onAdminPage  = here === 'admin.html';
  const onPanelPage  = here === 'panel.html';
  const onOrdersPage = here === 'orders.html';
  const currentRole = localStorage.getItem('role');
  const isStaffUser = currentRole === 'staff';

  const btnClass = (hrefName) =>
    'btn ' + (isActive(hrefName) ? 'btn-primary' : 'btn-outline-secondary');

  mount.innerHTML = `
    <nav class="navbar navbar-elegant fixed-top border-bottom shadow-sm">
      <div class="container">
        <a class="navbar-brand d-flex align-items-center" href="./index.html">
          <span class="brand-logo">HP</span>
          <span class="brand-text">Restaurante</span>
        </a>
        <div class="ms-auto d-flex align-items-center ${(onAdminPage || onPanelPage || onOrdersPage) ? 'gap-1' : 'gap-2'}">
          ${!onPanelPage ? `<a class=\"btn btn-elegant-outline\" href=\"./panel.html\" data-role=\"staff\">Panel Órdenes</a>` : ''}
          ${!onAdminPage ? `<a class="btn btn-elegant" href="./admin.html" data-role="staff" title="Crear nuevo plato">Nuevo plato</a>` : ''}
          ${!onOrdersPage ? `<a class=\"btn btn-elegant-outline\" href=\"./orders.html\" data-role=\"guest\">Mis pedidos</a>` : ''}
          ${!isActive('index.html') ? `<a class="btn btn-elegant-outline" href="./index.html">Menú</a>` : ''}
          ${(onMenuPage || isStaffUser) ? `<button id="btnCart" class="btn btn-elegant">Carrito (<span id="cartCount">0</span>)</button>` : ''}
          <button id="navLogout" class="btn btn-elegant-outline">Salir</button>
        </div>
      </div>
    </nav>
  `;

  // Aplicar lógica de roles inmediatamente (sin retraso) para evitar huecos visuales
  const staffElements = mount.querySelectorAll('[data-role="staff"]');
  const guestElements = mount.querySelectorAll('[data-role="guest"]');
  if (currentRole === 'guest') {
    staffElements.forEach(el => el.remove());
  } else if (currentRole === 'staff') {
    guestElements.forEach(el => el.remove());
  }

  mount.querySelector('#navLogout')?.addEventListener('click', logout);

  const navEl = mount.querySelector('.navbar');
  if (navEl) document.body.style.paddingTop = `${navEl.offsetHeight}px`;
}
