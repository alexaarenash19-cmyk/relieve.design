---
doc: database.md
proyecto: Relieve — sitio web
motor: PostgreSQL
version: 0.1
---

# Base de datos

## Principios
- **Made-to-order:** no se controla stock por unidad; cada pieza se produce al pedido. (Se puede limitar capacidad por mes, no inventario.)
- **Guest checkout:** no hay tabla de usuarios/clientes con login; el pedido se identifica por correo + token (magic link).
- **Coordenadas reales** por lugar (nunca random). Si no se tienen, se dejan nulas.
- Las opciones (tamaño, marco, color, add-ons) son **catálogos** + reglas de precio, no un SKU por combinación.

## Tablas

### collections
```sql
CREATE TABLE collections (
  id           SERIAL PRIMARY KEY,
  slug         TEXT UNIQUE NOT NULL,        -- 'ciudades-mexico'
  name         TEXT NOT NULL,               -- 'Ciudades de México'
  photo_url    TEXT,
  sort         INT DEFAULT 0,
  active       BOOLEAN DEFAULT TRUE
);
```

### places (el lugar: ciudad o montaña)
```sql
CREATE TABLE places (
  id            SERIAL PRIMARY KEY,
  collection_id INT REFERENCES collections(id),
  slug          TEXT UNIQUE NOT NULL,       -- 'monterrey'
  name          TEXT NOT NULL,              -- 'Monterrey'
  type          TEXT CHECK (type IN ('ciudad','montana')) NOT NULL,
  country       TEXT DEFAULT 'MX',
  lat           NUMERIC(9,6),               -- coordenadas reales o NULL
  lng           NUMERIC(9,6),
  elevation_m   INT,                        -- msnm (montañas)
  story         TEXT,                       -- historia editorial del lugar
  aerial_url    TEXT,                       -- imagen aérea (hero/etapa 0)
  model_url     TEXT,                       -- GLB (Draco) del relieve
  thumb_url     TEXT,                       -- foto vista superior con marco (galería)
  base_price    INT NOT NULL,               -- precio base MXN (tamaño Mediano ref)
  status        TEXT CHECK (status IN ('active','soldout','preorder','draft')) DEFAULT 'active',
  created_at    TIMESTAMPTZ DEFAULT now()
);
```

### Catálogos de personalización (precio en MXN; delta suma sobre base)
```sql
CREATE TABLE sizes (
  code TEXT PRIMARY KEY,   -- 'chico','mediano','grande','especial'
  label TEXT, price INT,   -- precio absoluto del tamaño
  dims TEXT, sort INT
);
CREATE TABLE frames (
  code TEXT PRIMARY KEY,   -- 'nogal','roble','negro'
  label TEXT, price_delta INT DEFAULT 0, sort INT
);
CREATE TABLE colors (
  code TEXT PRIMARY KEY,   -- 'blanco','arena','grafito','terracota'
  label TEXT, hex TEXT, sort INT
);
CREATE TABLE addons (
  code TEXT PRIMARY KEY,   -- 'capelo','placa'
  label TEXT, price_delta INT DEFAULT 0
);
```
> Precio de una pieza = `sizes.price` + `frames.price_delta` + `addons` seleccionados. `colors` no altera precio. `orientation` ('horizontal'/'vertical') no altera precio.

### orders
```sql
CREATE TABLE orders (
  id                SERIAL PRIMARY KEY,
  number            TEXT UNIQUE NOT NULL,     -- 'RLV-2026-000123'
  email             TEXT NOT NULL,
  status            TEXT CHECK (status IN ('paid','in_production','shipped','delivered','cancelled')) DEFAULT 'paid',
  currency          TEXT DEFAULT 'MXN',
  subtotal          INT NOT NULL,
  shipping          INT DEFAULT 0,
  total             INT NOT NULL,
  is_gift           BOOLEAN DEFAULT FALSE,
  gift_message      TEXT,
  shipping_address  JSONB,                    -- {nombre, calle, ciudad, estado, cp, tel}
  stripe_session_id TEXT,
  cfdi_uuid         TEXT,                     -- folio fiscal (n8n lo llena)
  tracking_number   TEXT,
  status_token      TEXT UNIQUE,              -- magic link /pedido/:token
  created_at        TIMESTAMPTZ DEFAULT now()
);
```

### order_items
```sql
CREATE TABLE order_items (
  id            SERIAL PRIMARY KEY,
  order_id      INT REFERENCES orders(id) ON DELETE CASCADE,
  place_id      INT REFERENCES places(id),
  custom_place  TEXT,                 -- ubicación personalizada (si no está en catálogo)
  size_code     TEXT REFERENCES sizes(code),
  frame_code    TEXT REFERENCES frames(code),
  color_code    TEXT REFERENCES colors(code),
  orientation   TEXT DEFAULT 'horizontal',
  plate_text    TEXT,                 -- grabado opcional
  capelo        BOOLEAN DEFAULT FALSE,
  unit_price    INT NOT NULL,
  qty           INT DEFAULT 1
);
```

### reviews
```sql
CREATE TABLE reviews (
  id           SERIAL PRIMARY KEY,
  place_id     INT REFERENCES places(id),
  customer     TEXT,                  -- nombre para mostrar
  city         TEXT,
  rating       INT CHECK (rating BETWEEN 1 AND 5),
  photo_url    TEXT,                  -- foto de la pieza instalada
  comment      TEXT,
  approved     BOOLEAN DEFAULT FALSE, -- moderación
  created_at   TIMESTAMPTZ DEFAULT now()
);
```

### waitlist (piezas agotadas)
```sql
CREATE TABLE waitlist (
  id         SERIAL PRIMARY KEY,
  place_id   INT REFERENCES places(id),
  size_code  TEXT,
  email      TEXT NOT NULL,
  notified   BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### capacity (opcional — límite de producción por mes)
```sql
CREATE TABLE capacity (
  month     DATE PRIMARY KEY,   -- '2026-08-01'
  max_units INT,
  used      INT DEFAULT 0
);
```

## Notas
- El **número de pedido** y el `status_token` se generan al crear la orden (webhook de Stripe).
- Estados del pedido reflejan el flujo de `architecture.md`: `paid → in_production → shipped → delivered`. n8n los actualiza.
- Para el lanzamiento, `places`, `collections` y catálogos pueden vivir como **seed JSON** y migrarse a estas tablas después.
