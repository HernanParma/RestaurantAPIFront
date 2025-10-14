// ui/shared/auth.js

export const ROLES = {
  STAFF: 'staff',
  GUEST: 'guest',
};

// --- Interno: normaliza cualquier string de rol a 'staff' o 'guest'
function normalizeRole(input) {
  const r = String(input || '').trim().toLowerCase();
  if (r === 'staff' || r === 'personal') return ROLES.STAFF;
  if (r === 'guest' || r === 'comensal') return ROLES.GUEST;
  return ''; // desconocido / no seteado
}

// --- Persistencia
export function getRole() {
  try { return localStorage.getItem('role'); } catch { return null; }
}

export function setRole(role) {
  const norm = normalizeRole(role);
  try {
    if (norm) localStorage.setItem('role', norm);
    else localStorage.removeItem('role');
  } catch {}
}

// Rol efectivo (si no hay nada guardado, tratá como guest)
export function getEffectiveRole() {
  const saved = getRole();
  const norm = normalizeRole(saved);
  return norm || ROLES.GUEST;
}

// --- Helpers de lectura
export function isStaff() {
  return getEffectiveRole() === ROLES.STAFF;
}

export function isGuest() {
  return getEffectiveRole() === ROLES.GUEST;
}

// --- Navegación / guardias
export function logout() {
  try { localStorage.removeItem('role'); } catch {}
  location.href = './login.html';
}

/**
 * Redirige a login si NO hay rol guardado.
 * Útil si querés forzar pasar por login.
 * (No la llames en páginas públicas como index si querés permitir guest sin login.)
 */
export function ensureAnyRole() {
  if (!getRole()) location.href = './login.html';
}

/** Exigir ser personal para ver una página (admin, panel, etc.) */
export function requireStaff() {
  if (!isStaff()) location.href = './index.html';
}
