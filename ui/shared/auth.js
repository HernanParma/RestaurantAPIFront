export const ROLES = {
  STAFF: 'staff',
  GUEST: 'guest',
};

function normalizeRole(input) {
  const r = String(input || '').trim().toLowerCase();
  if (r === 'staff' || r === 'personal') return ROLES.STAFF;
  if (r === 'guest' || r === 'comensal') return ROLES.GUEST;
  return ''; 
}

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

export function getEffectiveRole() {
  const saved = getRole();
  const norm = normalizeRole(saved);
  return norm || ROLES.GUEST;
}

export function isStaff() {
  return getEffectiveRole() === ROLES.STAFF;
}

export function isGuest() {
  return getEffectiveRole() === ROLES.GUEST;
}

export function logout() {
  try { localStorage.removeItem('role'); } catch {}
  location.href = './login.html';
}


export function ensureAnyRole() {
  if (!getRole()) location.href = './login.html';
}

export function requireStaff() {
  if (!isStaff()) location.href = './index.html';
}
