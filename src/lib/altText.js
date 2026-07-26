// Issue #64 — descriptive alt text per place image (ui-ux.md Accesibilidad:
// "alt descriptivo por lugar, bueno para SEO").
export function placeAlt(place) {
  return `Mapa en relieve de ${place.name}, enmarcado en parota`;
}
