// Museográfico pass (11 ago 2026) — single source of truth for real
// top-level nav destinations, shared by MenuOverlay.jsx ("Índice") and
// Footer.jsx's navigation column, so the two can't drift out of sync.
// Pulled directly from App.jsx's live route table — excludes
// /admin/envios (no nav link by design, server-side protected) and the
// order/success/legal routes (already reachable from the footer's own
// legal column / post-checkout flow, not primary nav).
export const NAV_ITEMS = [
  { label: 'Inicio', path: '/' },
  { label: 'Colecciones', path: '/colecciones' },
  { label: 'Método', path: '/metodo-relieve' },
  { label: 'Personaliza', path: '/personaliza' },
  { label: 'Buscar', path: '/buscar' },
  { label: 'Envíos', path: '/envios' },
  { label: 'FAQ', path: '/faq' },
];
