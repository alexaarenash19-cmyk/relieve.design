// Thematic color per real piece, for the Explorar canvas (collage/scattered
// view has no card background — this is purely for the solid-color
// "vista de colección" background on /pieza/:slug and the collection-page
// treatment described in the Explorar spec, §"Catálogo real" + §8).
// Tokens are the existing 10 brand tokens from src/index.css — no new
// colors were introduced. `dark: true` marks a token dark enough that
// heading/label text needs to switch to --color-dark-fg (cream) for
// contrast; `dark: false` keeps the default --color-graphite text.
export const PIECE_PALETTE = {
  shanghai: { token: 'passport-ink', dark: true },
  paris: { token: 'sello-navy', dark: true },
  londres: { token: 'explorer-blue', dark: false },
  barcelona: { token: 'sage', dark: false },
  'ciudad-de-mexico': { token: 'walnut', dark: true },
  // PLACEHOLDER piece with no real photo yet (see photography.js /
  // explorerCutout) — still gets its assigned thematic color regardless.
  'nevado-de-toluca': { token: 'stone', dark: false },
};

export function piecePaletteFor(slug) {
  return PIECE_PALETTE[slug] ?? null;
}
