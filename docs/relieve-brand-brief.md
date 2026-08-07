# RELIEVE — Brand Storytelling & Landing/Product Page Brief
### Documento de referencia para implementación en Claude Code

---

## 0. Tesis central

Relieve no vende relieves topográficos. Vende **la prueba física de un lugar que te formó** — un ancla contra el olvido, y una identidad de quien viaja / quien pertenece.

Dos pilares psicológicos, todo el contenido (web + redes) debe caer en uno de los dos:

1. **Ancla de memoria contra el olvido** — nostalgia, regalo con historia compartida, logro/reinvención.
2. **Identidad de quien viaja** — libertad creativa, orgullo de pertenencia, colección.

Nunca se vende el objeto. Se vende lo que el objeto resuelve.

**Público objetivo:** ~40 años. Nada de lenguaje o referencias de etapa universitaria/juvenil.

---

## 1. Historia de marca (About Us)

> Hay una versión de mí que nunca volvió de Madrid.
>
> No hablo de la ciudad — hablo de quién fui mientras la habité. De las tardes sin prisa que ya no tengo, de las calles que aprendí a reconocer de memoria, de la persona en la que me fui convirtiendo sin darme cuenta, solo por vivir ahí un tiempo.
>
> Cuando volví, me costó explicar qué había cambiado. No tenía cómo mostrarlo. Una foto se queda guardada en el teléfono y ahí se olvida. Un recuerdo, con los años, se empieza a desdibujar. Necesitaba algo que pudiera tocar — algo que estuviera en mi casa todos los días, recordándome quién fui en ese lugar, aunque ya viviera una vida completamente distinta.
>
> Así nació Relieve.
>
> Empecé a crear piezas de las ciudades que me formaron — no souvenirs, sino algo que se pudiera sostener, con el peso y la textura de un lugar real.
>
> Relieve existe para quien también tiene una ciudad así. La que te formó, la que amaste, la que sigues cargando contigo aunque hayan pasado los años y ya no vivas ahí. Esa ciudad merece un lugar en tu casa.

**Nota de tono:** sin mención de proceso, materiales, técnica o "no se puede automatizar" — eso vive únicamente en Método Relieve (sección 5).

---

## 2. Nomenclatura de marca (aplicar en todo el sitio)

- Nunca "producto" → siempre **"pieza"**
- Nunca "Agregar al carrito" → siempre **"Encargar mi pieza"**
- Nunca "Comprar" en ningún CTA
- Nunca "Suscribirse" → ver sección 8 (Curva de Nivel)

---

## 3. Colecciones (Series)

| Serie | Contenido | Pregunta de navegación/IG |
|---|---|---|
| **Serie Origen** | Ciudades dentro de la República Mexicana | ¿Cuál es tu Origen? |
| **Serie Travesía** | Ciudades fuera de México | ¿Cuál fue tu Travesía? |
| **Serie Cumbre** | Relieves de montañas/picos (ej. Nevado de Toluca) | ¿Cuál es tu Cumbre? |

---

## 4. Ediciones

- **Edición Numerada** (default en todo el catálogo): numeración abierta y continua por pieza fabricada, sin tope fijo — como un drop normal de sneakers.
- **Edición Limitada** (solo para colaboraciones/piezas especiales, a futuro): tope real declarado y respetado sin excepción (ej. "Edición Limitada de 100"). No usar hasta tener el proceso de conteo/operación probado.

**Certificado físico (confirmado — se produce en Canva):** tarjeta impresa tipo certificado de autenticidad de galería dentro de cada caja, con el número real de la pieza — y el mismo número grabado discretamente en el canto del marco de parota nacional. Refuerza la identidad única de cada pieza física. **Plantilla completa del certificado (frente y reverso) guardada en archivo separado:** `relieve-certificado-template.md`.

---

## 5. Método Relieve

**Nombre del proceso:** Método Relieve (el proceso comparte nombre con la marca).

**Los 4 pasos (lenguaje final, sin mención de software ni comparación directa con "fábrica"):**

1. **Captura** — No partimos de un mapa genérico. Partimos de datos topográficos reales del lugar, el terreno tal como es.
2. **Curaduría a mano** — Cada calle, cada edificio, se revisa y se modela a mano, con criterio de arquitecto — para que no se pierda ni un detalle, para que cada pieza se sienta curada, no generada.
3. **Modelado y relieve** — La geometría curada se convierte en relieve físico, capa por capa, con el mismo cuidado que un modelo de estudio.
4. **Ensamble en parota** — Cada pieza se enmarca a mano en madera de parota nacional, se revisa, se numera y se firma.

**Dónde vive:**
- Ítem propio de navegación principal: **Colecciones · Método · Reseñas** (reemplaza "Sobre nosotros" genérico)
- Página dedicada `/metodo-relieve`
- Enlace de texto dentro del panel de producto, debajo de "Personalizar mi pieza": **"Cómo se hizo esta pieza"** — no es contenido colapsable/inline, es un link directo que navega a `/metodo-relieve`. Es el único punto de entrada a esa página desde la ficha de producto.

---

## 6. Ficha técnica (formato "pieza de museo")

```
PIEZA N.º 014
Colección Ciudades del Mundo — Serie Origen
—
Ángel de la Independencia
Ciudad de México, México
—
Dimensiones      15 × 15 cm (relieve) · 19 × 19 cm (con marco)
Marco            Parota nacional
Color            Blanco mate o Negro mate
Empaque          100% material reciclado
Procedencia      Diseñado y hecho a mano en México
Personalización  Mensaje en la parte trasera del marco
—
Edición N.º 014
```

Aplicar esta plantilla exacta a cada pieza del catálogo, cambiando solo los datos variables (ciudad, serie, número de edición).

**Campos eliminados por no ser reales — no deben aparecer en ninguna ficha:** SKU, Coordenadas (como campo de personalización), Orientación, Cúpula de vidrio, Placa grabada (se reemplaza por "Mensaje en la parte trasera del marco").

> **Nota de implementación (ver §16):** el ejemplo de arriba (un solo tamaño/color) describe la configuración de referencia "chico". El catálogo real conserva múltiples tamaños, marcos y colores — la ficha técnica debe mostrar los datos de la selección real de cada pieza, no un valor fijo. Capelo de vidrio y placa grabada sí eran opciones reales y con precio en el catálogo — se descontinúan como parte de este trabajo, no porque nunca hayan existido.

---

## 7. Historias de lugar (aprobadas — formato: gancho arriba → origen → ícono → cierre emocional)

### Ángel de la Independencia — CDMX — Serie Origen
> El Ángel no ha dejado de ver pasar historia desde 1910. Ahora también puede ver la tuya, en tu pared.

Se erigió para celebrar el centenario de la Independencia, pensado desde el principio no solo como monumento, sino como punto de encuentro — el lugar donde generación tras generación se ha parado a esperar algo: una noticia, una persona, una razón para celebrar. En esta pieza, la columna y el Ángel dorado se levantan exactamente como los reconoces, con el trazo del Paseo de la Reforma que los rodea.

No es solo un monumento de la ciudad. Es el lugar donde tú también esperaste algo alguna vez. Esa espera también tiene un lugar aquí.

### Paris — Torre Eiffel — Serie Travesía
> Iba a ser temporal. Se quedó para siempre. Como esa tarde ahí que tampoco se te olvida.

Construida en 1889 para una feria mundial, la Torre Eiffel debía desmontarse apenas terminara el evento. Pero París se acostumbró a mirarla en el horizonte, y lo que iba a ser pasajero se volvió el símbolo permanente de toda una ciudad. En esta pieza, la torre se levanta junto al trazo del Sena, el río que cruzaste sin contar cuántas veces, sin saber que lo ibas a extrañar.

A veces lo que iba a durar un momento es justo lo que se queda para siempre.

**Nota:** esta ciudad usa el gancho romántico específico como variante para campañas de regalo/pareja — *"La ciudad donde dijiste que sí. O donde quisieras haberlo dicho."* Usar según canal/campaña.

### Shanghai — Serie Travesía
> Shanghai no tuvo miedo de reinventarse por completo. Tú tampoco lo tuviste, la vez que empezaste ahí de cero.

Hace apenas unas décadas, el perfil de Shanghai era otro por completo. Hoy el Bund y su skyline sobre el río Huangpu son la prueba de una ciudad que se atrevió a construirse de nuevo, más rápido que casi cualquier otra en el mundo. En esta pieza, ese mismo perfil se levanta con el detalle de cada torre que cambió el horizonte para siempre.

Reinventarse no es fácil en ninguna ciudad. Shanghai lo hizo a la vista de todos. Tú también, aunque nadie más lo haya notado.

### Barcelona — Serie Travesía
> Donde aprendiste que las reglas se pueden doblar. Como Gaudí.

Gaudí pasó gran parte de su vida rompiendo la idea de que una línea recta era la única forma correcta de construir. Barcelona todavía se organiza alrededor de esa idea — una ciudad que decidió que la belleza no tenía que seguir reglas. En esta pieza, el trazo del Eixample y la Sagrada Familia se levantan con el mismo espíritu: algo inacabado, pero exactamente como debía ser.

Quizás ahí aprendiste lo mismo — que las reglas se pueden doblar sin que se rompa nada.

### Londres — Serie Travesía
> La temporada que te cambió. La ciudad que te vio hacerlo.

Reconstruido tras un incendio en 1834, el Parlamento y su torre del reloj se volvieron el símbolo de una ciudad que sabe reconstruirse sin dejar de ser ella misma. En esta pieza, la aguja del Big Ben se levanta junto al trazo del Támesis, la misma vista que cruzaste sin saber que la ibas a extrañar tanto.

Londres no te dejó igual. Ninguna ciudad que realmente vives lo hace.

### Nevado de Toluca — Serie Cumbre
> Hay vistas que no se regalan. Se ganan, paso a paso, hasta el borde.

El Nevado de Toluca — Xinantécatl, "el señor desnudo" — es uno de los volcanes más altos de México, con dos lagunas que solo se alcanzan subiendo. No es un lugar de paso: exige algo a cambio antes de dejarte ver lo que guarda. En esta pieza, el relieve real de sus curvas de nivel se levanta tal como se siente estar ahí arriba, sin aire, sin ruido, solo el peso de haber llegado.

Algunas cumbres no se recuerdan por la vista. Se recuerdan por todo lo que costó llegar a ella.

**Plantilla para escribir nuevas ciudades:** gancho emocional (1 línea) → origen/fundación (1-2 líneas) → ícono presente en la pieza (1 línea) → cierre emocional que conecta con quien mira ahora, no con el pasado (1-2 líneas). 80-120 palabras total.

---

## 8. Comunidad — Curva de Nivel

> **Sé parte de la Curva de Nivel**
> Antes de que una ciudad nueva llegue a todos, llega primero a la Curva de Nivel.
> — Acceso anticipado a nuevas ciudades
> — Ediciones especiales antes que nadie
> — Descuento en tu segunda pieza
> **[Quiero ser parte]**

Nunca usar "Suscribirse" en ningún botón relacionado con esto.

---

## 9. Matriz de ganchos emocionales por nicho (usar para TODO contenido — web, IG, Pinterest, stories)

Antes de publicar cualquier pieza de contenido, debe poder ubicarse en una fila de esta tabla:

| Nicho | Pilar | Frase ancla | Dirección visual | Tipo de contenido |
|---|---|---|---|---|
| Nostalgia de quien fuiste | Ancla de memoria | *"La versión de ti que se quedó en [ciudad]. Tráela a casa."* | Luz cálida, tarde, pieza sola en escritorio/librero, tono íntimo | Reel "la ciudad que te formó" + UGC de clientes |
| Regalo con historia compartida | Ancla de memoria | Paris: *"La ciudad donde dijiste que sí. O donde quisieras haberlo dicho."* | Dos personas, mesa, la pieza como centro de un momento | Reels de parejas, stories "cuéntanos dónde fue" |
| Logro / reinvención | Identidad de quien viaja | Shanghai/Londres (ver sección 7) | Escritorio de trabajo, tono aspiracional pero serio | Carrusel de historias reales |
| Libertad creativa | Identidad de quien viaja | Barcelona: *"Donde aprendiste que las reglas se pueden doblar. Como Gaudí."* | Espacios creativos, estudio, luz natural | Reels de proceso creativo de clientes |
| Orgullo de pertenencia | Identidad de quien viaja (local) | CDMX: *"No necesitas explicarle a nadie por qué amas esta ciudad. Aquí, tampoco hace falta."* | Casa mexicana, terraza, generacional | Contenido evergreen, top del feed, fechas patrias |

**Frase madre (usar en cada página de producto, IG, Pinterest, pins):** *"La versión de ti que se quedó en [ciudad]. Tráela a casa."* — adaptar [ciudad] en cada pieza.

**Frase de pertenencia (hero rotativo del sitio + contenido ancla de IG):** *"No necesitas explicarle a nadie por qué amas esta ciudad. Aquí, tampoco hace falta."*

---

## 10. Arquitectura de página de producto

**Reemplaza por completo el layout actual (foto izquierda / bloque de texto desactualizado a la derecha).**

**Flujo de entrada:** vista de cuadrícula o de pieza → clic → se abre panel lateral que ocupa media pantalla.

> **Nota de implementación (ver §16):** esta sección se implementa sobre `/pieza/:slug` (la página completa), no sobre el panel lateral medio-pantalla existente (`ProductPanel.jsx`), que se mantiene como preview ligero, sin cambios de arquitectura.

### Regla de layout — prioridad horizontal
El problema actual es un menú de texto enorme y fotos chiquitas arriba. Corrección obligatoria: el panel debe pensarse en proporción horizontal, no vertical — las fotos/video dominan el espacio visual, el texto no compite en tamaño con la imagen. Si hay que elegir entre ampliar la imagen o el bloque de texto, siempre gana la imagen.

### Carrusel (orden final — grande, prioridad visual)
1. 2-3 fotos de producto (hero shots limpios)
2. 1 foto de contexto (la pieza en un espacio real)
3. Video de unboxing (loop, mudo, opción de sonido) — 8-12 seg, textura del relieve de cerca

### Panel lateral — contenido y orden final

1. **Carrusel** (ver arriba)
2. **Nombre de la pieza**
3. **Gancho emocional** — la pregunta/frase de la sección 7, en grande, como elemento visual propio (no como texto de cuerpo)
4. **"¿Para quién es esta pieza? ¿Para ti o para presumirla?"** — pregunta fija, aparece en toda ficha de producto
5. **Historia del lugar** — los textos ya trabajados (formato sección 7)
6. **Ficha técnica estilo colección** (formato sección 6, con datos reales):
   - Medidas: 15×15 cm (relieve) / 19×19 cm (con marco)
   - Serie: Origen / Travesía / Cumbre según corresponda
   - Marco: Parota nacional (dato fijo, no es una opción a elegir — solo existe este material)
   - Color del relieve: Blanco mate o Negro mate
   - ~~Coordenadas~~ — eliminado, no existe
   - ~~SKU~~ — eliminado, no existe
   - ~~Orientación~~ — eliminado, no existe
7. **"En una frase, ¿por qué este lugar?"** — campo opcional, personal. Un solo input: este mismo texto es el que se imprime en cursiva en el reverso del certificado (ver `relieve-certificado-template.md`) — no se captura dos veces.
8. **Personalización** — un mensaje que se puede escribir en la parte trasera del marco. ~~Cúpula de vidrio~~ y ~~placa grabada~~ eliminadas, no se ofrecen.
9. **Enlace "Cómo se hizo esta pieza"** — justo debajo de Personalización (punto 8). Navega directo a `/metodo-relieve`. Es el único lugar de la ficha de producto donde aparece esta entrada — no hay contenido adicional inline, solo el link.
10. **Precio + CTA** ("Encargar mi pieza") — $1,200 MXN por pieza / $1,600 MXN versión rompecabezas
11. **Tiempos:** se fabrica en 10-15 días hábiles, llega aproximadamente 5 días después del envío
12. ~~Especificaciones (bloque repetido/emergente)~~ — **eliminado.** Es redundante con la ficha técnica del punto 6, no se implementa como modal ni como sección aparte.
13. **Cómo llega:** video de unboxing (ya cubierto en el carrusel, se puede repetir aquí como cierre), mención de que el empaque sale del estudio listo para viajar, fácil de colgar, 100% material reciclado, instrucciones simples de limpieza
14. **Micro-línea de trust** (envío/devolución, corta, no repetir todo el ticker superior)

---

## 11. Estructura de Home

**Hero → Canvas infinito (limpio, sin storytelling encima) → Curva de Nivel (comunidad) → Footer**

Nada más apilado en scroll. Método Relieve, historia de marca, y colecciones viven en sus propias páginas de navegación, no en el home — esto evita el problema de sobrecarga visual identificado en referencias de competencia (Piedra Studios).

### Navegación principal
**Colecciones · Método · Reseñas**

---

## 12. Trust bar

Formato ticker/loop en la parte superior del sitio, inspirado en Nude Project y Walled Maps. Contenido confirmado:

- Envío gratis
- Envíos a toda la República
- Devolución gratuita — 30 días
- **Hecho a mano en México** ← sugerencia añadida: refuerza directamente el pilar de curaduría/autenticidad (mismo rol que "Handcrafted in New York" en Piedra o "Hecho a mano en España" en Walled Maps), y es un dato 100% real, no necesita validación adicional.

Loop sugerido: *Envío gratis · Envíos a toda la República · Devolución gratuita 30 días · Hecho a mano en México ·* (repetir)

---

## 13. Precios y tiempos de producción (datos reales confirmados)

| Concepto | Valor |
|---|---|
| Pieza estándar | $1,200 MXN |
| Versión rompecabezas | $1,600 MXN |
| Dimensiones | 15 × 15 cm (relieve) / 19 × 19 cm (con marco) |
| Marco | Parota nacional (único material disponible) |
| Color del relieve | Blanco mate o Negro mate |
| Fabricación | 10-15 días hábiles |
| Envío | ~5 días adicionales tras fabricación |

**Nota:** hasta ahora todas las piezas del catálogo comparten estas mismas dimensiones y opciones de material/color — no hay variación por ciudad en estos campos, solo cambia la geometría del relieve, la serie y la historia.

> **Nota de implementación (ver §16):** esta tabla describe la configuración de referencia "chico". El catálogo real conserva tamaños (chico/mediano/grande/especial + puzzle), marcos (Parota/Roble/Negro) y colores (Blanco/Arena/Grafito/Negro mate) adicionales, cada uno con su propio precio — no se elimina esa variedad.

---

## 14. Pendientes / checklist antes de implementación

- [x] Auditoría de datos reales por pieza — completada en esta sesión (dimensiones, material, precio, tiempos).
- [x] Redactar copy final del trust bar.
- [x] Confirmar producción del certificado físico numerado — se hace en Canva. Ver `relieve-certificado-template.md`.
- [x] Guardar receta de ganchos emocionales por ciudad — ver `relieve-ganchos-emocionales-receta.md`.
- [x] Definir mecánica de "Cómo se hizo esta pieza" — es un link, no un colapsable, y navega a `/metodo-relieve`.
- [x] **CONFIRMADO:** segundo color de relieve = Negro mate (junto con Blanco mate).
- [x] **CONFIRMADO:** "En una frase, ¿por qué este lugar?" es un único input — mismo texto en el panel de producto y en el reverso del certificado.
- [ ] Escribir historias de lugar para ciudades adicionales usando la plantilla de la sección 7 / receta separada.
- [ ] Definir diseño visual exacto del panel en proporción horizontal (fotos grandes, texto no compite en tamaño).

---

## 15. Rebranding tipográfico — relieve-web (React/Vite + Tailwind)

**Alcance exclusivo de esta tarea:** tipografía y color de títulos (h1-h6) y botones/CTAs únicamente. No toca cuerpo de texto, layout, estructura, ni ningún otro color del sitio.

**Especificación:**
- Fuente nueva: **Agrandir**, en **negritas (bold/700)**
- Aplica a: todos los headings (h1, h2, h3, etc.) **y** todos los botones del sitio (CTAs, "Personalizar", nav, etc.)
- Color: **#355974** (color oscuro de marca) — solo en títulos y botones
- No cambia: fuente del cuerpo de texto (párrafos, descripciones) — se decide en otra sesión
- No cambia: color de cuerpo de texto ni de cualquier otro elemento que no sea título/botón
- Implementación: centralizada vía tokens de Tailwind / variables de diseño — nunca hardcodeada componente por componente

**Instrucción de ejecución para Claude Code:** Este trabajo está dividido en tareas discretas. Al cerrar cada tarea, actualiza este documento marcando la casilla `[x]` correspondiente y agrega debajo una nota breve de qué se hizo y qué archivos se tocaron, antes de pasar a la siguiente tarea. Una tarea, un update — no agrupar varias tareas en un solo reporte.

### Fase 1 — Auditoría y confirmación (no tocar código todavía)

- [x] **1.1** Verificar si Agrandir ya está disponible en el proyecto (paquete instalado, import existente, o referencia en algún CSS/config).
- [x] **1.2** Si no está disponible: determinar método de carga — Google Fonts (si Agrandir está ahí) vs. `@font-face` con archivos locales. **Si se necesitan archivos `.woff`/`.woff2`, preguntar directamente a Ale — no asumir que existen ni buscarlos por cuenta propia.**
- [x] **1.3** Hacer inventario completo de componentes que contienen headings (h1-h6) y botones/CTAs en todo el sitio (incluir nav, footer, panel de producto, home, y cualquier página secundaria).
- [x] **1.4** Presentar a Ale la lista de componentes identificados en 1.3 — esperar su confirmación explícita de que nada debe quedar fuera antes de tocar código.

**Nota (Fase 1, cerrada 2026-08-05):** Auditoría hecha vía tres pases de investigación de solo lectura sobre el repo real (`gh api`, sin clonar). Confirmado: Agrandir no existía en el proyecto (cero referencias en `package.json`, `src/index.css`, `index.html` ni docs). No hay `tailwind.config.js` — Tailwind v4 usa `@theme` CSS-first en `src/index.css`. Inventario completo: 40 headings (h1-h6) en 20 archivos, más los botones/controles de `Button.jsx`, `WaitlistDialog.jsx`, `Gallery.jsx` y los controles funcionales listados en la Fase 3. La lista se presentó a Ale en conversación, quien confirmó el alcance completo (ver §16, decisión 3: aplica a *todo* botón/control, no solo CTAs principales) antes de tocar código.

### Fase 2 — Tokens centralizados (setup, sin aplicar todavía a componentes)

- [x] **2.1** Agregar Agrandir como token de fuente en `tailwind.config` (ej. `fontFamily.heading`), no como clase suelta.
- [x] **2.2** Agregar `#355974` como token de color en `tailwind.config` (ej. `colors.brand-dark` o nombre equivalente ya usado en el sistema de diseño existente).
- [x] **2.3** Cargar la fuente físicamente en el proyecto: `@font-face` en CSS global si son archivos locales, o `<link>`/import si es Google Fonts. — **font-face pendiente — token agregado, `@font-face` diferido hasta que Ale entregue el .woff2.**

**Nota (Fase 2, cerrada 2026-08-05):** No hay `tailwind.config.js` en este repo — Tailwind v4 usa config CSS-first vía `@theme`. Se agregaron `--font-heading: "Agrandir", sans-serif;` y `--color-brand-dark: #355974;` al bloque `@theme` existente en `src/index.css`, de forma aditiva (los 10 colores y 4 fuentes existentes no se tocaron). `--color-brand-dark` es un token nuevo y distinto de `--color-passport-ink` (#355A75), sin alias entre ellos, por decisión 1 de §16. No se agregó `@font-face` todavía — bloqueado por la entrega pendiente del archivo `.woff2` de Agrandir (Ale); el token cae de vuelta a `sans-serif` mientras tanto, como se esperaba. Archivo tocado: `src/index.css`.

### Fase 3 — Aplicación

- [x] **3.1** Aplicar el token de fuente Agrandir bold + token de color `#355974` a todos los headings (h1-h6) usando los tokens de la Fase 2 — sin hardcodear en ningún componente.
- [x] **3.2** Aplicar el mismo token de fuente + color a todos los botones/CTAs del sitio (incluyendo "Personalizar", nav, y cualquier botón identificado en 1.3).
- [x] **3.3** Confirmar que el cuerpo de texto (párrafos, descripciones) no fue tocado — ni fuente ni color.
- [x] **3.4** Confirmar que no se modificó estructura, layout, ni ningún otro color del sitio fuera del alcance de esta tarea.

**Nota (Fase 3, cerrada 2026-08-05):** Se aplicó `font-heading font-bold text-brand-dark` a los 40 headings (h1-h6) encontrados en los 20 archivos de alcance, y el mismo tratamiento de fuente/color a todo botón/control identificado (decisión 3, §16): `Button.jsx` (CTA compartido, retinte de `sello-navy`→`brand-dark`), los 2 botones hand-rolled de `WaitlistDialog.jsx`, las constantes `GHOST_PILL`/`DARK_PILL` de `Gallery.jsx`, los selectores de tamaño/marco/color/orientación de `Product.jsx`, qty +/- y "Quitar" de `CartDrawer.jsx`, el close de `Lightbox.jsx`, los 2 close de `ProductPanel.jsx`, los filter tabs de `Collections.jsx`, y el disclosure trigger (`<button>` dentro del `<h3>`) de `Accordion.jsx`. Cuerpo de texto, layout y cualquier color fuera de títulos/botones quedaron sin tocar. Archivos tocados (24): `src/index.css`, `src/components/Button.jsx`, `src/components/Accordion.jsx`, `src/components/CartDrawer.jsx`, `src/components/Gallery.jsx`, `src/components/HeroReducedMotion.jsx`, `src/components/HeroSection.jsx`, `src/components/Lightbox.jsx`, `src/components/ProductPanel.jsx`, `src/components/Reviews.jsx`, `src/components/WaitlistDialog.jsx`, `src/pages/About.jsx`, `src/pages/Collection.jsx`, `src/pages/Collections.jsx`, `src/pages/Faq.jsx`, `src/pages/Gift.jsx`, `src/pages/NotFound.jsx`, `src/pages/OrderStatus.jsx`, `src/pages/Personalize.jsx`, `src/pages/PrivacyNotice.jsx`, `src/pages/Product.jsx`, `src/pages/Search.jsx`, `src/pages/Shipping.jsx`, `src/pages/Terms.jsx`. Nota de seguimiento (ver PR #147): un primer pase dejó fuera, pese a la decisión 3 ("todo botón/control"), los botones ‹ Anterior/Siguiente › del flipbook en `About.jsx` y el botón × de cierre de `CartDrawer.jsx` — cerrados en un segundo commit sobre la misma rama. También se corrigió un conflicto preexistente en `CartDrawer.jsx`: el botón "Pagar" pasaba `font-label` como override hacia el componente `Button`, lo que peleaba con el nuevo `font-heading` de la base — se quitó ese override.

### Fase 4 — Verificación final

- [ ] **4.1** Revisión visual — resumen o preview de los cambios aplicados, por sección del sitio.
- [ ] **4.2** Checklist final de que nada fuera de alcance (cuerpo de texto, layout, otros colores) fue modificado.

---

## 16. Decisiones de implementación (resueltas con Ale, 5 ago 2026)

Esta sección registra las resoluciones acordadas con Ale durante la sesión de planeación en Claude Code, donde el brief de arriba entraba en conflicto con el estado real del código de `relieve-web` o con documentación previa (`docs/ui-ux.md`, `docs/decisions.md`). Estas decisiones son vinculantes y tienen prioridad sobre el texto original del brief donde haya contradicción.

1. **Tipografía/color de marca supera a `docs/ui-ux.md`.** Ese documento dice "Fraunces nunca bold" y trata `#355A75` ("passport-ink") como color de marca cerrado. Decisión: se ignora esa restricción para esta decisión puntual y se reescribe `docs/ui-ux.md` para que registre la nueva regla como superseding — Agrandir bold/700 + `#355974` aplican solo a títulos (h1-h6) y botones/controles; el cuerpo de texto conserva Fraunces/Inter y los colores existentes. `#355974` es un **token nuevo y distinto** (ej. `--color-brand-dark`), no un alias de `--color-passport-ink` (`#355A75`) — se mantienen separados aunque sean visualmente cercanos.
2. **Carga de Agrandir**: self-hosted `@font-face` (`.woff2`) es la opción por defecto — no depende de una suscripción de Adobe Fonts, y es justo lo que el propio brief anticipó ("si se necesitan archivos .woff/.woff2, preguntar directamente a Ale"). Esto es una dependencia real y bloqueante: Ale debe proporcionar los archivos `.woff2` antes de que la fuente se vea aplicada de verdad. El resto de la Fase 2/3 (tokens, reescritura de doc, aplicar la clase en el markup) puede avanzar sin ellos.
3. **Alcance de "botones"**: aplica literalmente a todo botón/control cliqueable del sitio — no solo CTAs principales. Incluye `Button.jsx`, los botones ad-hoc de `WaitlistDialog.jsx` y los pills de `Gallery.jsx`, y controles funcionales (chips de talla/marco/color, +/- de cantidad, cerrar, filtros, disclosure de acordeón).
4. **Tamaños y precios se mantienen reales y múltiples.** La tabla "un tamaño / dos precios" del brief describe únicamente la configuración de referencia "chico" (15×15cm) — no reemplaza el catálogo real. `WALL_SIZES` (chico/mediano/grande/especial) y `PUZZLE_SIZES` en `src/lib/catalog.js`, más el cálculo por tamaño/marco/addon de `lib/pricing.js`, se mantienen sin cambios. Lo mismo aplica a marco (Parota/Roble/Negro) y color (Blanco/Arena/Grafito/Negro mate) — el lenguaje "único material/color" de la ficha técnica es ilustrativo de una configuración, no una eliminación de opciones reales. Cualquier componente de "ficha técnica" nuevo debe mostrar el tamaño/marco/color/precio **seleccionado**, nunca un valor fijo hardcodeado.
5. **Capelo de vidrio y placa grabada se descontinúan de verdad** — no se "renombran", se eliminan como opciones para el cliente. Se quitan de la UI de personalización de `Product.jsx` (checkbox, input de texto de placa, lógica de addon asociada) y de la sección "Personalización" del panel rediseñado. Las filas de `addons` en la base de datos y las columnas de `order_items` no se tocan — los pedidos pasados siguen necesitando renderizarse bien; es una eliminación solo de UI.
6. **`ProductPanel.jsx` (panel medio-pantalla) y `Product.jsx` (página completa) se mantienen separados — no se fusionan.** La "arquitectura de página de producto" de la sección 10 (carrusel de prioridad horizontal, reordenamiento de contenido, ficha técnica, personalización, link "Cómo se hizo esta pieza", etc.) se implementa sobre **`Product.jsx`** (la ruta completa `/pieza/:slug`), no dentro del panel medio-pantalla. `ProductPanel.jsx` conserva su alcance actual (preview ligero desde el canvas, CTA "Ver pieza completa →" hacia el `Product.jsx` rediseñado) — sin cambios de arquitectura, solo el paso de tipografía/color de la sección 15.
7. **El nav queda exactamente "Colecciones · Método · Reseñas."** `Buscar` y `Regalar` se quitan del `Nav.jsx` por ahora (las rutas `/buscar` y `/regalar` siguen funcionando, solo dejan de estar enlazadas desde el nav superior — se revisita su ubicación en otra sesión si hace falta). "Reseñas" apunta al ancla existente `/colecciones#resenas` (ya usada por el menú interno de `Gallery.jsx`) — no se crea una página de reseñas dedicada nueva en este trabajo.
8. **Serie es una columna de datos nueva y real.** "Serie Origen / Travesía / Cumbre" no se puede derivar de forma confiable de las columnas existentes `type` (`ciudad`/`juego`) + `country` (ej. un relieve de montaña vendido como pieza de pared tendría forma de `type='ciudad'` pero conceptualmente sería "Cumbre"). Se agrega una columna `places.series` (migración + backfill: ciudades de México → `origen`, ciudades fuera de México → `travesia`, montañas/picos → `cumbre`) desacoplada de `type`.
9. **Curva de Nivel** necesita una tabla nueva en Supabase (email + timestamp, sin lugar/tamaño porque es a nivel sitio, no por pieza) y un endpoint nuevo `POST /api/curva-de-nivel`, siguiendo las convenciones de validación/rate-limit ya usadas en `api/reviews.js`/`api/checkout.js`. Copy: encabezado "Sé parte de la Curva de Nivel", CTA "Quiero ser parte" — nunca "Suscribirse".
10. **Video en el carrusel** (clip de unboxing) se implementa como soporte de código con fallback elegante sin video — se extiende el glob de `src/lib/photography.js` para incluir también extensiones de video, y `piecePhotos()` cambia su forma de retorno a `{url, type}` para que `PhotoCarousel`/`Lightbox` puedan distinguir `<video>` de `<img>`. Los archivos de video reales por pieza son una dependencia de contenido para después (misma categoría que los archivos `.woff2` de Agrandir) — nada bloquea hoy por su ausencia.
11. El `Footer` del Home está hoy suprimido a propósito en `/` (`if (location.pathname === '/') return null;` en `App.jsx`, por una petición explícita anterior). La nueva estructura de Home (`Hero → Canvas → Curva de Nivel → Footer`) requiere que el footer vuelva a aparecer en `/`, solo debajo de la nueva sección Curva de Nivel — se marca como una reversión explícita de esa decisión anterior, no como un descuido.

---

## 17. Fase 2 — Copy & nomenclatura (registro de ejecución)

- [x] **Terms.jsx — renombrar "Producto" a "Pieza".** `src/pages/Terms.jsx`: el `<h2>` de la primera sección del documento pasa de "Producto" a "Pieza", por la regla de nomenclatura de la sección 2.
- [x] **Product.jsx — CTA "Encargar mi pieza".** `src/pages/Product.jsx`: el botón de agregar al carrito (rama de pieza en stock, junto a `WaitlistDialog` para la rama de soldout) pasa de "Agregar al carrito" a "Encargar mi pieza" — solo el texto visible, el handler `handleAddToCart` no cambia.
- [x] **About.jsx / passportContent.js — historia de marca.** El copy de "Sobre Relieve" vive en `ABOUT_COPY` dentro de `src/lib/passportContent.js` (no inline en `About.jsx`) y se reemplaza por completo con la historia de la sección 1 ("Hay una versión de mí que nunca volvió de Madrid..."). Estructura, markup y estilos del flipbook (7 páginas, `react-pageflip`) sin cambios — solo el contenido de esta página.
- [x] **Migración de historias de lugar.** Nueva migración `supabase/migrations/20260806010001_update_place_stories.sql` con `UPDATE places SET story = '...'` para los 6 slugs reales del catálogo (`ciudad-de-mexico`, `paris`, `shanghai`, `barcelona`, `londres`, `nevado-de-toluca`), copy verbatim de la sección 7. Nota: `ciudad-de-mexico` ya tenía un `story` de una migración anterior (dev-phase, `20260716140001_place_stories.sql`) — esta migración lo reemplaza intencionalmente por la copy final aprobada aquí. Esta migración solo agrega el archivo `.sql` al repo; aplicarla contra la base de datos real de Supabase es un paso de deploy/ops aparte.

---

---

## 18. Fase 3 — Serie + ficha técnica (registro de ejecución)

- [x] **Migración `places.series`.** Nueva migración `supabase/migrations/20260806020001_add_places_series.sql`: `ALTER TABLE places ADD COLUMN series text CHECK (series IN ('origen', 'travesia', 'cumbre'))` + backfill de las 6 piezas reales del catálogo — `ciudad-de-mexico` → `origen`; `paris`, `londres`, `shanghai`, `barcelona` → `travesia`; `nevado-de-toluca` → `cumbre`. La migración documenta en un comentario por qué `series` es una columna nueva y no se deriva de `type`/`country` (sección 16, decisión 8): un relieve de montaña vendido como pieza de pared tendría `type='ciudad'` en la forma pero seguiría siendo conceptualmente "Cumbre". Nota: este archivo solo agrega el `.sql` al repo — aplicarlo contra la base de datos real de Supabase es un paso de deploy/ops aparte (mismo patrón de caveat que la migración de historias de lugar de la Fase 2).
- [x] **`series` expuesto en `api/catalog.js`.** Se agregó `series` a la proyección de columnas tanto de `GET /api/places` (listado) como de `GET /api/places/:slug` (detalle), junto a los campos existentes (`slug`, `name`, `type`, `thumb_url`/`story`, `base_price_cents`, `status`, etc.). El fallback a `lib/dummyCatalog.js` (cuando Supabase no responde) no se tocó — esos objetos no tienen `series` todavía, así que el modo degradado simplemente no incluye el campo hasta que alguien lo agregue ahí también.
- [x] **Componente `FichaTecnica`.** Nuevo `src/components/FichaTecnica.jsx` implementando el formato exacto de la sección 6 ("pieza de museo"). No hardcodea tamaño/marco/color: recibe `sizeCode`/`frameCode`/`colorCode` como props y busca la etiqueta/medida real en `SIZES`/`FRAMES`/`COLORS` (`src/lib/catalog.js`), reutilizando esos datos en vez de duplicarlos. `series` se mapea a su etiqueta ("Serie Origen"/"Serie Travesía"/"Serie Cumbre"). No incluye SKU, Coordenadas ni Orientación (eliminados por la sección 6). La fila "Personalización" es una línea fija ("Mensaje en la parte trasera del marco") y solo aparece cuando la pieza tiene marco (`frameCode` presente) — el puzzle no se enmarca, así que no la muestra. Componente creado y exportado únicamente — **no** se integra en `Product.jsx` todavía (eso es trabajo de la Fase 4, a propósito, sección 16 decisión 6).
- [ ] **Numeración de pieza/edición — sin resolver.** No existe hoy ningún contador secuencial persistido para `pieceNumber`/`editionNumber` (se revisaron `supabase/migrations/20260716120003_orders.sql`, `20260726120001_order_items_memory_note.sql` y el resto de migraciones de `order_items` — ninguna tiene una columna o secuencia de este tipo). `FichaTecnica` recibe `pieceNumber`/`editionNumber` como props obligatorias y solo las formatea (con ceros a la izquierda, ej. "N.º 014") — no inventa un esquema de numeración. Queda pendiente una decisión de Ale + una migración futura (ej. una `sequence` de Postgres incrementada en el webhook de pago, o un `ROW_NUMBER() OVER (...)` calculado sobre `order_items`) antes de poder cablear esto a un número real en `Product.jsx` (Fase 4).

---

*Documento compilado a partir de sesión de brand storytelling — referencias analizadas: Nude Project, Piedra Studios, Walled Maps, Model-Arq, Cityframes.*