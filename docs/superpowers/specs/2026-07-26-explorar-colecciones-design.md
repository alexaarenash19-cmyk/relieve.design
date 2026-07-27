# Ventana Explorar (/colecciones) — design reconciliation

Source spec: "DOC PARA CLAUDE CODE" (2026-07-26 v3, pasted in chat). This doc
reconciles that spec against the actual repo state and records the decisions
made where they conflicted. It supersedes the old "Galería infinita" block in
`docs/ui-ux.md` for `/colecciones` only — everything else in `ui-ux.md` and
`decisions.md` stands.

## What already existed (reused, not rebuilt)

- **`src/components/Gallery.jsx`** already implements ~80% of this spec, but
  mounted on `Home.jsx`, not `/colecciones`: scattered infinite canvas
  (drag-to-pan, tile-pattern repeat-tiling, only-fully-visible-tiles render),
  zoom +/- into the same wrapper `scale()`, a bottom control bar with
  ghost/dark pill menu+filter clusters, `ExperienceToggle` (scattered ↔ grid),
  ProductPanel integration on tile click, `data-cursor-label` wiring for the
  existing global `CustomCursor.jsx` pill.
- **Decision: extract, don't duplicate.** The drag/pan/zoom/tile-repeat engine
  in `ScatteredCanvas` (Gallery.jsx) is generalized into a shared
  hook/component both Home's teaser and the new `/colecciones` page use.
  `/colecciones` becomes the full "Explorar" destination with every feature
  in this spec; Home keeps a lighter teaser on the same engine.
- **`CustomCursor.jsx`** (global, pill-on-hover via `data-cursor-label`,
  fine-pointer only) — reused as-is for spec §6.1. §6.2's touch equivalent
  (fixed label near the pressed element) is new, scoped to this page.
- **`PageWipeContext`/`pageWipe.js`** — an existing full-screen wipe
  (idle→covering→covered→uncovering, single continuous upward sweep) already
  runs on route change. Spec §9 wants a *vertical-columns* variant
  specifically for product-focus → `/pieza/:slug` and between collection
  views. Implemented as a second phase-sequence module (`pageWipeColumns.js`)
  alongside the existing one — the existing single-sweep wipe is untouched
  everywhere else it's used.
- **`ProductPanel.jsx`/`ProductPanelContext`** (global left-drawer preview) —
  left completely alone. Spec §7's split-screen product-focus overlay is a
  **new, separate** component scoped to `/colecciones`'s scattered view only;
  clicking a tile there opens the new overlay instead of calling
  `openProduct()`. Every other entry point (Home's teaser, `/buscar`, grid
  cards elsewhere) keeps using the existing drawer unchanged.
- **`src/lib/categories.js`** (`CATEGORIES`, single source of truth for
  `/buscar`, `/colecciones`, the experience-view filter) — extended with the
  spec's 5 labels (Relieve/Montaña, Ciudad, Mexico, Pistas F1, Puzzle) as
  **UI-level options**. See taxonomy decision below for the DB side.
- **`src/lib/photography.js`** pattern (local Vite-bundled assets via
  `import.meta.glob`, not Supabase Storage) — followed for cutouts instead of
  spec §2.2's literal "upload to Supabase Storage" instruction, because (a)
  this is the repo's actual existing convention for piece imagery and (b) I
  have no Supabase Storage credentials in this environment. New folder:
  `src/assets/photography/explorar-cutouts/<slug>.png`, resolved by a new
  `explorerCutout(slug)` helper mirroring `pieceMainPhoto(slug)`.

## Conflicts found and how they were resolved

1. **Taxonomy vs. a same-week deliberate migration.** Spec wants CDMX
   reclassified `"mexico"` plus placeholder `"montana"`/`"f1"` categories.
   `supabase/migrations/20260727010001_catalog_cleanup_and_puzzle.sql`
   *deliberately* did the opposite days earlier (locked `places.type` to only
   `ciudad`/`juego`, moved CDMX back out of `mexico`) with an explicit
   comment explaining why. Resolution: a new migration
   (`add_mexico_type_and_reclassify_cdmx.sql`) re-opens the constraint and
   reclassifies CDMX, but per [[feedback-no-repo-clones]] and the "no
   Supabase credentials" execution note, **I cannot apply it** — Ale runs it
   manually in the Supabase SQL editor, same as the last one. The frontend
   filter UI is written to work correctly either way: it always groups
   whatever `type` value each place actually has, so CDMX shows under
   "Ciudad" until the migration runs, then under "Mexico" automatically,
   with no further frontend change needed.
2. **Puzzle price.** Spec/memory said $2,499 MXN; the actual live data
   (migration + `lib/dummyCatalog.js` + `DUMMY_SIZES.puzzle`) all agree on
   $1,299 MXN, same as the wall pieces. Using $1,299 MXN (the real, live
   value) for grid-view cards and the collection page. The earlier "$2,499"
   note was corrected in memory — it was likely confused with the wall
   pieces' "especial" (120×80cm) tier, which genuinely is $2,499 MXN.
3. **No real photo for the puzzle piece exists anywhere in the repo.** Spec
   §2.2 assumes cutouts come from "fotos reales existentes" — there is no
   `nevado-de-toluca` folder under `src/assets/photography/pieces/`.
   Resolution: the puzzle's canvas tile and collection-page image use the
   same placeholder idiom already established elsewhere in this codebase
   (`TopoLines` overlay, e.g. `HowItArrives.jsx`) instead of a fabricated
   product photo, clearly commented as PLACEHOLDER pending Ale's real photo
   — consistent with how every other "Ale hasn't sent this yet" gap in this
   repo is handled.
4. **Higgsfield background-removal credits ran out mid-task.** The 5 wall
   pieces' cutouts were already generated successfully (via
   `remove_background`) earlier in this session before credits ran out —
   confirmed as genuine RGBA cutouts and committed to
   `src/assets/photography/explorar-cutouts/`. Nothing blocked there; only
   the puzzle placeholder (point 3) needs a real photo later.
5. **Testing without a local clone.** Per [[feedback-no-repo-clones]], build
   happens via the GitHub Contents/git-data API on branch
   `explorar-colecciones-canvas`, no local working copy. Verification happens
   against the Vercel preview deployment Vercel builds automatically for the
   PR, checked visually via the Chrome browser tool — not `npm run dev`
   locally.

## Scope carried into implementation (per spec sections)

- §1 load sequence, §3 scalable canvas + zoom, §5 menu/filter, §6 cursor +
  touch equivalent, §7 product-focus split view, §8 collection color page,
  §9 columns wipe, §10 timing table, §11 production notes (splitting.js-style
  reveal, no SplitText, `prefers-reduced-motion` fallback) — implemented as
  written, reusing the building blocks above wherever one already exists.
