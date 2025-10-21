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
  const onMenuPage   = here === 'index.html' || !!document.getElementById('cartModal');
  const onAdminPage  = here === 'admin.html';
  const onPanelPage  = here === 'panel.html';
  const onOrdersPage = here === 'orders.html';
  const currentRole  = localStorage.getItem('role');
  const isStaffUser  = currentRole === 'staff';

  mount.innerHTML = `
    <nav class="navbar navbar-expand-lg navbar-elegant shadow-sm">
      <div class="container-fluid"><!-- <- importante: container-fluid -->
        <a class="navbar-brand d-flex align-items-center" href="./index.html">
          <span class="brand-logo">HP</span>
          <span class="brand-text">Restaurante</span>
        </a>
        <div class="ms-auto d-flex align-items-center ${ (onAdminPage||onPanelPage||onOrdersPage) ? 'gap-1':'gap-2' }">
          ${!onPanelPage  ? `<a class="btn btn-elegant-outline" href="./panel.html"  data-role="staff">Panel Órdenes</a>` : ''}
          ${!onAdminPage  ? `<a class="btn btn-elegant"          href="./admin.html"  data-role="staff">Nuevo plato</a>` : ''}
          ${!onOrdersPage ? `<a class="btn btn-elegant-outline" href="./orders.html" data-role="guest">Mis pedidos</a>` : ''}
          ${!isActive('index.html') ? `<a class="btn btn-elegant-outline" href="./index.html">Menú</a>` : ''}
          ${(onMenuPage || isStaffUser) ? `<button id="btnCart" class="btn btn-elegant">Carrito (<span id="cartCount">0</span>)</button>` : ''}
          <button id="navLogout" class="btn btn-elegant-outline">Salir</button>
        </div>
      </div>
    </nav>
  `;

  // Roles
  const staffEls = mount.querySelectorAll('[data-role="staff"]');
  const guestEls = mount.querySelectorAll('[data-role="guest"]');
  if (currentRole === 'guest') staffEls.forEach(el => el.remove());
  if (currentRole === 'staff') guestEls.forEach(el => el.remove());
  mount.querySelector('#navLogout')?.addEventListener('click', logout);

  // Padding-top del body para que no tape títulos
  const nav = mount.querySelector('nav');
  const setPadding = () => {
    if (!nav) return;
    const h = nav.offsetHeight || 64;
    document.documentElement.style.setProperty('--nav-h', `${h}px`);
    document.body.style.paddingTop = `${h}px`; // inline => gana a cualquier !important externo
  };
  setPadding();
  window.addEventListener('load', setPadding, { passive:true });
  window.addEventListener('resize', setPadding, { passive:true });
  if (document.fonts?.ready) document.fonts.ready.then(setPadding);
}