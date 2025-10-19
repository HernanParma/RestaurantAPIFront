export function showToast(message = '¡Agregado a su pedido!', variant = 'success', delay = 2000) {
  const el = document.getElementById('appToast');
  const body = document.getElementById('appToastBody');
  if (!el || !body) return;

  el.className = `toast align-items-center text-bg-${variant} border-0`;
  body.textContent = message;

  const t = bootstrap.Toast.getOrCreateInstance(el, { delay });
  t.show();
}
