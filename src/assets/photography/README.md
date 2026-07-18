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
  about/proceso.jpg          ← foto de proceso para /sobre (taller/carpintería)
  about/impresion.jpg        ← foto de proceso para /sobre (impresión 3D)
```

Los testimonios (Testimonials.jsx) muestran una foto pequeña de la pieza
comprada, no del cliente — reusan `pieces/<slug>/main.jpg` por el mismo
mecanismo de arriba (`slug` en cada entrada del arreglo `TESTIMONIALS`).

`<slug>` = el mismo slug de la tabla `places`. Al agregar una pieza real a
Supabase, crea su carpeta con el mismo slug y `src/lib/photography.js` la
recoge sola.

Las 5 piezas dummy de preview (`lib/dummyCatalog.js`, servidas por
`api/catalog.js` cuando Supabase no responde) usan URLs de Unsplash
directas en vez de estos archivos — son código de backend, no pasan por el
bundler de Vite, así que no pueden importar de `src/assets/`.

## Créditos de los placeholders actuales

- `hero/aerial-city.jpg` — Ciudad de México, Unsplash (carlos aranda)
- `pieces/monterrey/main.jpg` — Monterrey, Unsplash (Steven Fernandez)
- `pieces/popocatepetl/main.jpg` — Popocatépetl, Unsplash (Hanson Lu)
- `pieces/*/detail-1.jpg` — textura de madera, Unsplash
- `about/proceso.jpg` — taller de carpintería, Unsplash
- `about/impresion.jpg` — impresión 3D en proceso, Unsplash (Jakub Żerdzicki)
