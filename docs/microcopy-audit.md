# Auditoría de micro-copy de sistema — Sección 9 (brief Rayo X, jul 2026)

Auditoría, no reescritura: este documento solo señala qué micro-copy de sistema (errores de formulario, estados vacíos, tooltips/aria-labels, confirmaciones menores) rompe el tono de marca, para que Ale las reescriba una por una. No se cambió ningún texto como parte de este documento.

**Regla de voz evaluada:** nunca "souvenir", "adorno", "impresión 3D", "oferta", "descuento". Sí "encargo", "pieza", "lugar", "memoria", "territorio". Debe leerse como revista de arquitectura editorial, no anuncio de Amazon.

## Hallazgos principales

1. **Todos los mensajes de error de `api/*.js` (incluido `api/admin/[...path].js`) están en inglés puro.** Nunca fueron traducidos ni editorializados — validaciones 400/404/405 en todos los endpoints. Es la falla más extendida de esta auditoría.
2. **`lib/errors.js` sobrescribe cualquier mensaje ≥500 con un texto genérico fijo en inglés** ("An unexpected error occurred. Please try again."), incluso cuando el código sí escribió un mensaje cuidado en español (ej. el 502 de Stripe en `api/checkout.js:149`, que nunca llega a mostrarse). Este es el hallazgo más sistémico: arreglar `lib/errors.js` en un solo lugar corrige el fallback para todos los endpoints a la vez.
3. **"Pre-order"** (badge en `Product.jsx:246`) es la única palabra en inglés visible directamente en una página, fuera de mensajes de error de red.
4. **Inconsistencia de CTA para la misma acción:** `ProductPanel.jsx` usa "Encargar" (vocabulario de marca correcto) pero `Product.jsx:363` usa "Agregar al carrito" (traducción literal de "add to cart") para el mismo botón conceptual.
5. El estado vacío por defecto de `DeparturesBoard` ("Sin resultados.") es genérico de plantilla y se filtra a `Search.jsx` cuando el filtro de categoría no tiene coincidencias — a diferencia del caso de búsqueda por texto, que sí tiene copy editorial con CTA.
6. Carrito y 404 están en buen tono editorial en general, salvo el estado vacío del carrito ("Tu carrito está vacío.") — plano/genérico frente al resto del drawer.

## Tabla completa

| Archivo:línea | Texto actual | Cumple tono de marca | Nota |
|---|---|---|---|
| CartDrawer.jsx:82 | `aria-label="Carrito"` | Sí | — |
| CartDrawer.jsx:91 | `aria-label="Cerrar carrito"` | Sí | — |
| CartDrawer.jsx:90 | "Tu carrito" | Sí | — |
| CartDrawer.jsx:97 | "Tu carrito está vacío." | **No** | Plantilla de ecommerce estándar, sin vocabulario de marca. |
| CartDrawer.jsx:107 | `aria-label="Reducir cantidad"` | Sí | — |
| CartDrawer.jsx:115 | `aria-label="Aumentar cantidad"` | Sí | — |
| CartDrawer.jsx:128 | "Quitar" | Sí | — |
| CartDrawer.jsx:137 | "Subtotal" | Sí | Término funcional neutro. |
| CartDrawer.jsx:160 | placeholder "Mensaje de regalo" | Sí | — |
| CartDrawer.jsx:165 | "¿Se envía directo al destinatario?..." | Sí | — |
| CartDrawer.jsx:177 | placeholder "tu@correo.com" | Sí | — |
| CartDrawer.jsx:186 | "Ingresa tu correo para continuar al pago." | Sí | — |
| CartDrawer.jsx:66/190 | "No pudimos iniciar el pago. Intenta de nuevo." | Sí | — |
| CartDrawer.jsx:194 | "Checkout en configuración — vuelve pronto." | Sí | — |
| CartDrawer.jsx:202 | "Redirigiendo…" / "Pagar" | Sí | — |
| Search.jsx:74 | placeholder "Buscar por nombre… (atajo: /)" | Sí | — |
| Search.jsx:66 | "{n} destinos en catálogo" | Sí | "Destinos" coherente con "lugar/territorio". |
| Search.jsx:96 | "Todas las categorías" | Sí | — |
| Search.jsx:113 | "No disponible" | Sí | — |
| Search.jsx:116 | "No tenemos "{query}" en el catálogo todavía." | Sí | — |
| Search.jsx:122 | "Solicita tu lugar →" | Sí | — |
| DeparturesBoard.jsx:5 | "Sin resultados." | **No** | Estado vacío genérico; el caso de búsqueda por texto sí tiene copy editorial, este fallback no. |
| NotFound.jsx:10 | Stamp "Sin ruta" | Sí | — |
| NotFound.jsx:11 | "Esta página no existe." | Sí | — |
| NotFound.jsx:13 | "Puede que el enlace esté roto o que el lugar ya no esté disponible." | Sí | — |
| NotFound.jsx:16 | "Volver al inicio" | Sí | — |
| Personalize.jsx:33 | "¿No encontraste tu lugar...?" | Sí | — |
| Personalize.jsx:38/47/57/67 | labels "Nombre"/"Correo"/"Ubicación deseada"/"Notas (opcional)" | Sí | — |
| Personalize.jsx:62 | placeholder "Ciudad, montaña o coordenadas" | Sí | — |
| Personalize.jsx:75 | "Enviar solicitud" | Sí | — |
| Personalize.jsx:23 | "¡Gracias!" | **No** | Exclamación genérica; el resto del sitio evita signos de exclamación. |
| Personalize.jsx:24 | "Recibimos tu solicitud para {lugar}..." | Sí | — |
| OrderStatus.jsx:6-9 | "Confirmado"/"En producción"/"Enviado"/"Entregado" | Sí | — |
| OrderStatus.jsx:53 | "No encontramos ese pedido." | Sí | — |
| OrderStatus.jsx:61 | "Cargando…" | Sí | — |
| OrderStatus.jsx:66-69 | "Pedido {number}" / "Este pedido fue cancelado." | Sí | — |
| OrderStatus.jsx:122 | "Guía: {tracking_number}" | Sí | — |
| OrderSuccess.jsx:46 | "Tu pago se confirmó" | Sí | — |
| OrderSuccess.jsx:48-49 | "...enlace de seguimiento." | Sí | — |
| OrderSuccess.jsx:57 | "Confirmando tu pedido…" | Sí | — |
| WaitlistDialog.jsx:28 | "Avisarme cuando vuelva" | Sí | — |
| WaitlistDialog.jsx:42 | "Lista de espera" | Sí | — |
| WaitlistDialog.jsx:59 | placeholder "tu@correo.com" | Sí | — |
| WaitlistDialog.jsx:64 | "Cancelar" | Sí | — |
| WaitlistDialog.jsx:67-68 | "Avisarme" | Sí | — |
| WaitlistDialog.jsx:37 | Stamp "Confirmado" | Sí | — |
| WaitlistDialog.jsx:38 | "Listo, te avisamos por correo en cuanto vuelva." | Sí | — |
| Reviews.jsx:8 | aria-label "{rating} de 5 estrellas" | Sí | — |
| Reviews.jsx:36 | "Ocultar foto ▲" / "Ver foto del cliente ▼" | Sí | — |
| Reviews.jsx:43 | alt "Foto de {customer} con su pieza instalada" | Sí | — |
| Reviews.jsx:74 | "Reseñas ({n})" | Sí | — |
| ProductPanel.jsx:31 | "No pudimos cargar esta pieza." | Sí | — |
| ProductPanel.jsx:117/126 | aria-labels "Detalle de pieza"/"Cerrar" | Sí | — |
| ProductPanel.jsx:169 | "Encargar" | Sí | — |
| Product.jsx:51 | "No pudimos cargar esta pieza." | Sí | — |
| Product.jsx:92 | "Puede que esta pieza no exista..." | Sí | — |
| Product.jsx:95 | "Buscar otro lugar" | Sí | — |
| Product.jsx:103 | "Cargando…" | Sí | — |
| Product.jsx:246 | "Pre-order" (badge) | **No** | Inglés puro, explícitamente prohibido. |
| Product.jsx:334 | "Agregar capelo de vidrio" | Sí | — |
| Product.jsx:345 | placeholder "Texto a grabar" | Sí | — |
| Product.jsx:357 | "Se fabrica en {n} días hábiles..." | Sí | — |
| Product.jsx:363 | "Agregar al carrito" | **No** | Traducción literal de "add to cart"; inconsistente con "Encargar" (ProductPanel.jsx:169) para la misma acción. |
| api/catalog.js (varias líneas) | "Use GET"/"Use POST"/"Place not found"/"Order not found"/etc. | **No** | Inglés puro en todos los `sendError` de este archivo. |
| api/checkout.js:87 | "Use POST" | **No** | Inglés puro. |
| api/checkout.js:91 | "El checkout todavía no está configurado." | Sí (pero ver `lib/errors.js`) | 503 ≥500, en la práctica se sobrescribe. |
| api/checkout.js:98 | "items (non-empty) and email are required" | **No** | Inglés puro. |
| api/checkout.js:46 | "Each item needs place_slug or custom_place" | **No** | Inglés + nombres de campo expuestos. |
| api/checkout.js:68/71 | "Unknown place_slug"/"Unknown color_code" | **No** | Inglés puro. |
| api/checkout.js:149 | "No pudimos iniciar el pago. Intenta de nuevo." | Sí (en código), pero nunca llega al usuario | Ver `lib/errors.js` — se sobrescribe. |
| api/reviews.js (varias líneas) | mensajes de validación | **No** | Inglés puro; línea 85 mezcla inglés+español en el mismo mensaje, peor que inglés puro. |
| api/admin/[...path].js (varias líneas) | mensajes de validación/admin | **No** | Inglés puro en todos. |
| lib/errors.js:12 | "An unexpected error occurred. Please try again." | **No** | Fallback fijo para TODO error ≥500 del sitio completo — inglés puro, plantilla, y pisa cualquier mensaje en español ya escrito (ver api/checkout.js:149). **Hallazgo más sistémico del audit — arreglarlo aquí corrige todos los endpoints a la vez.** |
| lib/adminAuth.js:31 | "Missing or invalid admin token" | **No** | Inglés puro. |
| lib/rateLimit.js:39 | "Demasiadas solicitudes. Intenta de nuevo en un momento." | Sí | Único mensaje 4xx compartido ya en español con tono calmado. |

## Resumen para priorizar

- **1 cambio con máximo apalancamiento:** reescribir el fallback de `lib/errors.js:12` en español, tono editorial — corrige el "no cumple" de más alto impacto en todo el sitio de un solo golpe.
- **~25 mensajes de error de API** en inglés puro, repartidos en `api/catalog.js`, `api/checkout.js`, `api/reviews.js`, `api/admin/[...path].js`, `lib/adminAuth.js` — mismo patrón repetido, se pueden reescribir en lote una vez que Ale defina el tono deseado para mensajes de error técnicos (¿tan editorial como el resto, o más neutro/funcional por ser errores de sistema?).
- **4 textos puntuales en frontend:** "Tu carrito está vacío.", "Sin resultados." (DeparturesBoard), "¡Gracias!" (Personalize), "Pre-order" (badge), "Agregar al carrito" (vs. "Encargar").
