-- Phase 2 of docs/relieve-brand-brief.md ("copy & nomenclature pass"):
-- updates `places.story` with the final, approved place-story copy from
-- brief §7 (gancho -> origen -> icono -> cierre emocional) for the 6 real
-- catalog pieces (see relieve_project_overview memory / Product.jsx's
-- ACCENT_BY_SLUG for the authoritative slug list). This overwrites
-- whatever placeholder/dev-phase story text those slugs may already carry
-- (e.g. ciudad-de-mexico's story from 20260716140001_place_stories.sql) —
-- that is intentional: this is the final, Ale-approved copy replacing
-- earlier draft copy, not additive content.

update places set story =
  'El Ángel no ha dejado de ver pasar historia desde 1910. Ahora también puede ver la tuya, en tu pared.

Se erigió para celebrar el centenario de la Independencia, pensado desde el principio no solo como monumento, sino como punto de encuentro — el lugar donde generación tras generación se ha parado a esperar algo: una noticia, una persona, una razón para celebrar. En esta pieza, la columna y el Ángel dorado se levantan exactamente como los reconoces, con el trazo del Paseo de la Reforma que los rodea.

No es solo un monumento de la ciudad. Es el lugar donde tú también esperaste algo alguna vez. Esa espera también tiene un lugar aquí.'
  where slug = 'ciudad-de-mexico';

update places set story =
  'Iba a ser temporal. Se quedó para siempre. Como esa tarde ahí que tampoco se te olvida.

Construida en 1889 para una feria mundial, la Torre Eiffel debía desmontarse apenas terminara el evento. Pero París se acostumbró a mirarla en el horizonte, y lo que iba a ser pasajero se volvió el símbolo permanente de toda una ciudad. En esta pieza, la torre se levanta junto al trazo del Sena, el río que cruzaste sin contar cuántas veces, sin saber que lo ibas a extrañar.

A veces lo que iba a durar un momento es justo lo que se queda para siempre.'
  where slug = 'paris';

update places set story =
  'Shanghai no tuvo miedo de reinventarse por completo. Tú tampoco lo tuviste, la vez que empezaste ahí de cero.

Hace apenas unas décadas, el perfil de Shanghai era otro por completo. Hoy el Bund y su skyline sobre el río Huangpu son la prueba de una ciudad que se atrevió a construirse de nuevo, más rápido que casi cualquier otra en el mundo. En esta pieza, ese mismo perfil se levanta con el detalle de cada torre que cambió el horizonte para siempre.

Reinventarse no es fácil en ninguna ciudad. Shanghai lo hizo a la vista de todos. Tú también, aunque nadie más lo haya notado.'
  where slug = 'shanghai';

update places set story =
  'Donde aprendiste que las reglas se pueden doblar. Como Gaudí.

Gaudí pasó gran parte de su vida rompiendo la idea de que una línea recta era la única forma correcta de construir. Barcelona todavía se organiza alrededor de esa idea — una ciudad que decidió que la belleza no tenía que seguir reglas. En esta pieza, el trazo del Eixample y la Sagrada Familia se levantan con el mismo espíritu: algo inacabado, pero exactamente como debía ser.

Quizás ahí aprendiste lo mismo — que las reglas se pueden doblar sin que se rompa nada.'
  where slug = 'barcelona';

update places set story =
  'La temporada que te cambió. La ciudad que te vio hacerlo.

Reconstruido tras un incendio en 1834, el Parlamento y su torre del reloj se volvieron el símbolo de una ciudad que sabe reconstruirse sin dejar de ser ella misma. En esta pieza, la aguja del Big Ben se levanta junto al trazo del Támesis, la misma vista que cruzaste sin saber que la ibas a extrañar tanto.

Londres no te dejó igual. Ninguna ciudad que realmente vives lo hace.'
  where slug = 'londres';

update places set story =
  'Hay vistas que no se regalan. Se ganan, paso a paso, hasta el borde.

El Nevado de Toluca — Xinantécatl, "el señor desnudo" — es uno de los volcanes más altos de México, con dos lagunas que solo se alcanzan subiendo. No es un lugar de paso: exige algo a cambio antes de dejarte ver lo que guarda. En esta pieza, el relieve real de sus curvas de nivel se levanta tal como se siente estar ahí arriba, sin aire, sin ruido, solo el peso de haber llegado.

Algunas cumbres no se recuerdan por la vista. Se recuerdan por todo lo que costó llegar a ella.'
  where slug = 'nevado-de-toluca';