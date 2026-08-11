// Fase 3 del brief de marca (docs/relieve-brand-brief.md, sección 6 "Ficha
// técnica (formato 'pieza de museo')" + sección 16 decisión 4).
//
// Formato objetivo (plantilla exacta de la sección 6):
//
//   PIEZA N.º 014
//   Colección Ciudades del Mundo — Serie Origen
//   —
//   Ángel de la Independencia
//   Ciudad de México, México
//   —
//   Dimensiones      15 × 15 cm
//   Marco            Parota nacional
//   Color            Blanco mate
//   Empaque          100% material reciclado
//   Procedencia      Diseñado y hecho a mano en México
//   Personalización  Mensaje en la parte trasera del marco
//   —
//   Edición N.º 014
//
// Decisión 4 (sección 16): el catálogo real conserva múltiples tamaños
// (WALL_SIZES/PUZZLE_SIZES), marcos (FRAMES) y colores (COLORS) — este
// componente NUNCA hardcodea un tamaño/marco/color fijo. Recibe la
// selección actual como props (sizeCode/frameCode/colorCode) y busca la
// etiqueta/medida legible en los exports ya existentes de
// `src/lib/catalog.js` (SIZES/FRAMES/COLORS) — no duplica esos datos aquí.
//
// Campos eliminados a propósito (sección 6): SKU, Coordenadas, Orientación.
// "Personalización" es una línea fija de texto ("Mensaje en la parte
// trasera del marco"), no una prop que varía — Cúpula de vidrio y placa
// grabada se descontinúan (decisión 5), así que esta fila solo aparece
// cuando la pieza tiene marco (frameCode presente): el puzzle (Nevado de
// Toluca) no se enmarca, por lo que no tiene "parte trasera del marco"
// donde escribir un mensaje.
//
// Numeración de pieza/edición (pieceNumber/editionNumber): NO existe hoy
// ningún contador secuencial persistido en la base de datos (revisado
// `orders`/`order_items` y sus migraciones — no hay columna ni secuencia
// para esto). Este componente NO inventa un esquema de numeración:
// pieceNumber/editionNumber son opcionales — cuando faltan (null/undefined,
// que es lo que Product.jsx pasa hoy, ver Fase 4 más abajo), la línea
// "Pieza N.º ###"/"Edición N.º ###" se omite en vez de mostrar "undefined".
// Cablear esto a un contador real (ej. una sequence de Postgres o un
// ROW_NUMBER() sobre order_items) queda pendiente — ver nota en
// docs/relieve-brand-brief.md sección 18.
//
// Fase 4 — integrado en Product.jsx (reemplaza el bloque "Especificaciones"
// existente), pasando pieceNumber/editionNumber en null hasta que exista un
// contador real. (Nota museográfico, 11 ago 2026: order_items.piece_number
// SÍ existe ya — ver OrderStatus.jsx, que pasa el valor real ahí. Product.jsx
// sigue pasando null a propósito: no hay número de pieza antes de pagar.)
//
// Museográfico pass (11 ago 2026): hairlines normalizados a `border-line`
// (antes `border-graphite/20`) para que esta ficha use el mismo token de
// divisor que el resto del sistema, en vez de un valor de opacidad propio.
// Sin cambio estructural — el patrón label/value ya coincidía con el
// principio de "ficha de catálogo, no formulario". Se agrega la fila
// "Garantía" (hallazgo: el hecho "Garantía de fabricación — 7 días" solo
// vivía en el ticker de TrustBar.jsx, en ningún lugar de la página de
// producto misma — copiado verbatim de ahí, no una paráfrasis nueva).
//
// --- Ejemplo de uso (representativo, no se ejecuta desde aquí) ---
//
// <FichaTecnica
//   pieceNumber={14}
//   editionNumber={14}
//   collectionName="Ciudades del Mundo"
//   series="origen"
//   placeName="Ciudad de México"
//   country="México"
//   sizeCode="chico"
//   frameCode="parota"
//   colorCode="blanco"
// />
//
// // Puzzle (sin marco/color -> la fila Marco/Color y Personalización se
// // omiten automáticamente):
// <FichaTecnica
//   pieceNumber={7}
//   editionNumber={7}
//   collectionName="Juego"
//   series="cumbre"
//   placeName="Nevado de Toluca"
//   country="México"
//   sizeCode="puzzle"
// />

import { SIZES, FRAMES, COLORS, formatDims } from '../lib/catalog.js';

const SERIES_LABELS = {
  origen: 'Serie Origen',
  travesia: 'Serie Travesía',
  cumbre: 'Serie Cumbre',
};

// Museum-label spec rows share this row shape everywhere else in the
// codebase (see Product.jsx's `fullSpecs`/`specs` <dl> blocks) — same
// grid-cols-2 + border-b + font-label uppercase tracking-wide treatment,
// reused here instead of inventing a new visual language for the same kind
// of label/value row.
function SpecRow({ label, value }) {
  return (
    <div className="grid grid-cols-2 gap-4 border-b border-line py-2 font-label uppercase tracking-wide text-xs">
      <dt className="text-graphite/60">{label}</dt>
      <dd className="break-words normal-case">{value}</dd>
    </div>
  );
}

// Fase 4 (Product.jsx integration) — pieceNumber/editionNumber are still
// genuinely unresolved (no counter exists yet, see file header + brand-
// brief.md §18): Product.jsx passes null/undefined for both today rather
// than inventing a number. pad() must not turn that into the literal
// string "undefined" — it renders nothing (the figcaption/closing line
// below skip themselves entirely) until a real value exists.
function pad(n) {
  return n == null ? null : String(n).padStart(3, '0');
}

export default function FichaTecnica({
  pieceNumber,
  editionNumber,
  collectionName,
  series,
  placeName,
  country,
  sizeCode,
  frameCode,
  colorCode,
  packagingLine = '100% material reciclado',
  provenanceLine = 'Diseñado y hecho a mano en México',
  warrantyLine = 'Garantía de fabricación — 7 días',
  className = '',
}) {
  const size = SIZES.find((s) => s.code === sizeCode);
  const frame = frameCode ? FRAMES.find((f) => f.code === frameCode) : null;
  const color = colorCode ? COLORS.find((c) => c.code === colorCode) : null;
  const seriesLabel = SERIES_LABELS[series] ?? series;
  const pieceNo = pad(pieceNumber);
  const editionNo = pad(editionNumber);

  return (
    <figure className={`font-label text-xs ${className}`}>
      <figcaption className="uppercase tracking-wide mb-1">
        {pieceNo ? `Pieza N.º ${pieceNo}` : 'Pieza'}
      </figcaption>
      <p className="uppercase tracking-wide text-graphite/60 mb-3">
        Colección {collectionName} — {seriesLabel}
      </p>

      <hr className="border-line mb-3" />

      <p className="normal-case text-sm font-medium mb-0.5">{placeName}</p>
      <p className="uppercase tracking-wide text-graphite/60 mb-3">
        {placeName}, {country}
      </p>

      <hr className="border-line mb-1" />

      <dl>
        {size && <SpecRow label="Dimensiones" value={formatDims(size.dims)} />}
        {frame && <SpecRow label="Marco" value={frame.label} />}
        {color && <SpecRow label="Color" value={color.label} />}
        <SpecRow label="Empaque" value={packagingLine} />
        <SpecRow label="Procedencia" value={provenanceLine} />
        <SpecRow label="Garantía" value={warrantyLine} />
        {frame && (
          <SpecRow label="Personalización" value="Mensaje en la parte trasera del marco" />
        )}
      </dl>

      {editionNo && (
        <>
          <hr className="border-line mt-3 mb-1" />
          <p className="uppercase tracking-wide text-graphite/60 mt-2">
            Edición N.º {editionNo}
          </p>
        </>
      )}
    </figure>
  );
}
