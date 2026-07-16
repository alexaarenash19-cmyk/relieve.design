-- Issue #62: editorial story text for the pilot places seeded in #71.
-- Real coordinates only (database.md principios) — no invented data.

update places set story =
  'Rodeada por la Sierra Madre Oriental, la silueta de Monterrey mezcla el trazo industrial del norte con el filo del Cerro de la Silla al fondo.'
  where slug = 'monterrey';

update places set story =
  'El Zócalo, la traza reticular del centro y el Ángel a lo lejos: la Ciudad de México en relieve es, sobre todo, una cuenca llena de calles.'
  where slug = 'ciudad-de-mexico';

update places set story =
  'Entre el Bosque Colomos y el Centro Histórico, Guadalajara se lee en el relieve como una ciudad plana que crece hacia sus barrancas.'
  where slug = 'guadalajara';

update places set story =
  'Puebla se asienta en un valle a 2,135 msnm, con las cúpulas de sus iglesias como los únicos quiebres verticales del trazo colonial.'
  where slug = 'puebla';

update places set story =
  'Oaxaca de Juárez ocupa un valle rodeado de sierras; el relieve marca la diferencia entre el centro plano y las laderas donde empieza la montaña.'
  where slug = 'oaxaca';

update places set story =
  'Mérida es la ciudad más plana del catálogo: la península de Yucatán apenas tiene desnivel, y eso también es un dato real.'
  where slug = 'merida';

update places set story =
  'San Miguel de Allende sube y baja por calles empedradas sobre un cerro; en relieve se nota por qué caminar ahí cansa más de lo que parece.'
  where slug = 'san-miguel-de-allende';

update places set story =
  'El Ángel de la Independencia sobre su columna de 36 metros, en el cruce de Reforma e Insurgentes — la primera pieza que fotografiamos con luz real.'
  where slug = 'angel-de-la-independencia';

update places set story =
  'Gran Vía atraviesa el centro de Madrid en diagonal; su relieve urbano es de los primeros fuera de México en el catálogo.'
  where slug = 'gran-via';

update places set story =
  'El Popocatépetl se eleva 5,426 msnm sobre el Valle de México y Puebla — un volcán activo, no una montaña cualquiera.'
  where slug = 'popocatepetl';

update places set story =
  'El Pico de Orizaba (Citlaltépetl) llega a 5,636 msnm: el punto más alto de México, y el tercero de Norteamérica.'
  where slug = 'pico-de-orizaba';
