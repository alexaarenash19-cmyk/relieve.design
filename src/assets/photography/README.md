# Fotografía — placeholders reemplazables

Estas son fotos de stock (Unsplash, uso libre) usadas como placeholder mientras
no hay fotografía real de las piezas. Tratamiento cálido/tostado (Fase 0 de
`docs/ui-ux.md`) se aplica en CSS vía la clase `.warm-photo` (`src/index.css`),
no editado en el archivo — así cualquier foto que se ponga aquí, real o
placeholder, sale con el mismo tratamiento consistente.

## Para reemplazar con fotos reales

Sustituye el archivo manteniendo el mismo nombre y ruta. No requiere cambios
de código — solo rebuild/redeploy.

```
photography/
  hero/aerial-city.jpg       ← etapa 1 del storyboard (ciudad aérea)
  pieces/<slug>/main.jpg     ← foto principal de la pieza (una carpeta por slug)
  pieces/<slug>/detail-1.jpg ← foto de detalle (textura/marco/acabado)
  about/proceso.jpg          ← foto de proceso para /sobre
```

`<slug>` = el mismo slug de la tabla `places` (ej. `monterrey`, `popocatepetl`).
Hoy solo existen `monterrey` y `popocatepetl` (piezas dummy de preview, ver
`src/lib/dummyProducts.js`) — al agregar una pieza real a Supabase, crea su
carpeta con el mismo slug y `src/lib/photography.js` la recoge sola.

## Créditos de los placeholders actuales

- `hero/aerial-city.jpg` — Ciudad de México, Unsplash (carlos aranda)
- `pieces/monterrey/main.jpg` — Monterrey, Unsplash (Steven Fernandez)
- `pieces/popocatepetl/main.jpg` — Popocatépetl, Unsplash (Hanson Lu)
- `pieces/*/detail-1.jpg` — textura de madera, Unsplash
- `about/proceso.jpg` — taller de carpintería, Unsplash
