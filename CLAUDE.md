# CLAUDE.md — Celestina Cocina (Menú Digital + Pedidos)

Este archivo le da contexto a Claude Code sobre el proyecto. Mantenerlo actualizado a medida que se tomen decisiones nuevas.

## Contexto del negocio

- Negocio de delivery de comida casera (foco inicial: pastas, no se descarta ampliar a otros rubros).
- Ubicado en **Caaguazú, Paraguay**.
- Nombre/marca: **Celestina Cocina**.
- Identidad visual: estilo "azulejo" (azul `#1d5e8c` / azul claro `#5b96bf` / amarillo acento `#f2c14e`, fondo crema `#fdfbf6`), tipografías Fraunces (títulos) + DM Sans (texto).
- Hay un mock HTML responsive ya validado (`celestina-mock.html`) que sirve como referencia visual de la UI del menú.
- Operación unipersonal/familiar: la dueña gestiona pedidos, cocina y reparto. El celular sigue siendo el canal de notificación real (WhatsApp).
- El menú real del negocio (`menu_celestina_cocina.md`) ya fue provisto por la dueña y es la fuente de verdad para el seed inicial de `categories` / `menu_items` / `modifier_groups` / `modifiers`. Es más rico que el mock visual: 7 categorías, ~30 productos, y dos grupos de modificadores (ver sección "Modificadores").

## Objetivo del proyecto

1. **Menú digital público** (sin login): el cliente ve categorías y platos, arma un carrito, completa datos de entrega y confirma. Al confirmar:
   - Se guarda el pedido en Supabase.
   - Se abre WhatsApp (`wa.me`) con el detalle del pedido pre-armado para enviar al número del negocio.
2. **Back office** (con login, solo para la dueña/staff): gestión de pedidos (cambio de estado), edición de menú (categorías, platos, precios, fotos, disponibilidad), configuración general (nombre, WhatsApp, etc).

## Stack tecnológico

- **Frontend**: React puro + Vite (NO Next.js). SPA.
- **Backend/datos**: Supabase (Postgres + Auth + Storage + Realtime).
- **Deploy**: Vercel.
- **Auth**:
  - Cliente final: **sin login obligatorio** (checkout como invitado, identificado por teléfono).
  - Back office: **Supabase Auth con Google OAuth**, solo para la dueña (y eventualmente un segundo usuario de confianza).
- **Imágenes de platos**: Supabase Storage (subida desde el back office, no URLs externas).

## Modelo de datos (borrador)

```sql
-- Categorías del menú
create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz default now()
);

-- Platos / items del menú
create table menu_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references categories(id) on delete cascade,
  name text not null,
  description text,
  price numeric(12,0) not null, -- precio BASE en guaraníes, sin decimales
  image_url text,
  notes text, -- info adicional: presentación (500gr), incluye (tostadas+parmesano), tiempo de espera, etc.
  available boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz default now()
);

-- Grupos de modificadores (ej: "Variación", "Salsa")
create table modifier_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null, -- ej: "Variación", "Elegí tu salsa"
  selection_type text not null default 'single' check (selection_type in ('single','multiple')),
  required boolean not null default false,
  sort_order int not null default 0
);

-- Opciones dentro de cada grupo (ej: "Napolitana", "Boloñesa")
create table modifiers (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references modifier_groups(id) on delete cascade,
  name text not null,
  extra_price numeric(12,0) not null default 0, -- 0 = incluido sin costo extra
  sort_order int not null default 0
);

-- Relación N:N: qué grupos de modificadores aplican a qué plato
create table menu_item_modifier_groups (
  menu_item_id uuid references menu_items(id) on delete cascade,
  modifier_group_id uuid references modifier_groups(id) on delete cascade,
  primary key (menu_item_id, modifier_group_id)
);

-- Pedidos
create table orders (
  id uuid primary key default gen_random_uuid(),
  order_number serial,
  customer_name text not null,
  customer_phone text not null,
  delivery_address text not null,
  delivery_lat double precision,
  delivery_lng double precision,
  notes text,
  total numeric(12,0) not null,
  status text not null default 'pendiente'
    check (status in ('pendiente','preparando','enviado','entregado','cancelado')),
  created_at timestamptz default now()
);

-- Items dentro de cada pedido (snapshot de nombre/precio BASE al momento del pedido)
create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  menu_item_id uuid references menu_items(id),
  item_name text not null,   -- snapshot
  item_price numeric(12,0) not null, -- snapshot, precio base (sin modificadores)
  quantity int not null check (quantity > 0)
);

-- Modificadores elegidos para cada item del pedido (snapshot)
create table order_item_modifiers (
  id uuid primary key default gen_random_uuid(),
  order_item_id uuid references order_items(id) on delete cascade,
  modifier_name text not null, -- snapshot, ej: "Fugazzeta"
  extra_price numeric(12,0) not null default 0 -- snapshot
);

-- Índices recomendados
create index idx_menu_items_category on menu_items(category_id);
create index idx_modifiers_group on modifiers(group_id);
create index idx_menu_item_modifier_groups_item on menu_item_modifier_groups(menu_item_id);
create index idx_order_items_order on order_items(order_id);
create index idx_order_item_modifiers_item on order_item_modifiers(order_item_id);
create index idx_orders_status on orders(status);
create index idx_orders_created_at on orders(created_at desc);
```

**Decisión importante**: `order_items` y `order_item_modifiers` guardan *snapshot* de nombre y precio (base + extras). Si la dueña cambia el precio de un plato o de un modificador después, los pedidos históricos no deben verse afectados.

## Row Level Security (RLS) — lineamientos

- `categories` / `menu_items` / `modifier_groups` / `modifiers` / `menu_item_modifier_groups`:
  - `select`: público (rol `anon`).
  - `insert` / `update` / `delete`: solo usuarios autenticados (back office).
- `orders` / `order_items` / `order_item_modifiers`:
  - `insert`: público (cualquiera puede crear un pedido sin login).
  - `select` / `update` / `delete`: **solo usuarios autenticados**. Esto es crítico: sin esta restricción, cualquiera con la `anon key` podría leer nombres, teléfonos y direcciones de todos los clientes.
- Definir explícitamente las políticas para cada operación (no dejar tablas con RLS habilitado pero sin políticas, eso bloquea todo por defecto — o peor, deshabilitado, que expone todo).

## Flujo de WhatsApp

- Al confirmar el pedido, se guarda en Supabase y se abre:
  `https://wa.me/<numero>?text=<mensaje codificado>`
- El mensaje incluye: número de pedido, items con cantidades y subtotales, total, datos del cliente (nombre, teléfono, dirección/referencia), notas.
- No se usa WhatsApp Business API / Twilio por ahora (costo y aprobación de Meta no se justifican para el volumen actual). El pedido queda guardado en Supabase aunque el cliente no llegue a enviar el WhatsApp.

## Categorías del menú real

Reemplazan al ejemplo genérico (Pastas/Salsas/Bebidas/Postres) del mock visual:

1. **Pastas Congeladas** — Tagliatelles/Pappardelles, Ñoquis de papa y semolín, Ravioles (carne, jamón y queso, pollo). Sin modificadores. `notes`: "500 gr".
2. **Salsas Congeladas** — Boloñesa, Bechamel, Rosa. Sin modificadores. `notes`: "500 gr".
3. **Focaccias para Hornear** — Tradicional, Caprese, La llorona, Pesto y mozzarella. Sin modificadores. `notes`: "15 × 20".
4. **Milanesas** — Carne, Pollo, Berenjena, Zucchini. Grupo de modificador **"Variación"** (opcional, single-select).
5. **Guarniciones** — Papas fritas, Arroz con queso cremoso, Ensalada fresca Celestina, Pasta artesanal a la crema. Categoría propia, items normales (no modificador).
6. **Pastas Artesanales** — Tagliatelles, Ñoquis de papa, Ravioles (carne, jamón y queso, pollo, ricota). Grupo de modificador **"Salsa"** (obligatorio, single-select). `notes` en items: "preparadas al momento, ~30 min" (también aplica a Milanesas).
7. **Especiales** — Lasaña, Canelones (carne, jamón y queso, choclo). `notes`: "Incluye tostadas a la provenzal y queso parmesano rallado".

## Modificadores (variaciones de precio)

Dos grupos cubren todas las combinaciones del menú real:

- **Grupo "Variación"** (selection_type = `single`, required = `false`) — aplica a los 4 items de **Milanesas**. Opciones, todas `extra_price = 10000`: Napolitana, Fugazzeta, Cuatro quesos, Gringa, A caballo. Si el cliente no elige ninguna, la milanesa se pide "sola" al precio base.
- **Grupo "Salsa"** (selection_type = `single`, required = `true`) — aplica a los 6 items de **Pastas Artesanales**. Opciones: Boloñesa (`extra_price = 0`), Bechamel o Alfredo (`0`), Rosa (`0`), 4 quesos (`10000`), Carbonara (`10000`). Como es `required`, la UI debe forzar una selección antes de permitir agregar el plato al carrito.

El resto de las categorías (Pastas Congeladas, Salsas Congeladas, Focaccias, Guarniciones, Especiales) no tienen `menu_item_modifier_groups` asociados.

## Implicancias en la UI

- Para items **sin** modificadores: el flujo actual (botón `+`/`-` directo en la card) se mantiene igual.
- Para items **con** modificadores (Milanesas, Pastas Artesanales): al tocar "+", abrir un selector (radio buttons) con las opciones del grupo correspondiente y su `extra_price`. El precio mostrado en el carrito debe ser `item_price + extra_price` de la opción elegida.
- Si el grupo es `required` (caso "Salsa"), no permitir confirmar el agregado sin seleccionar una opción.
- El mensaje de WhatsApp y el back office deben mostrar la opción elegida junto al item, ej: `1x Milanesa de pollo (Fugazzeta) — Gs 30.000`.
- Dos items distintos del carrito con el mismo `menu_item_id` pero diferente modificador elegido deben tratarse como líneas separadas (no se pueden sumar cantidades entre "Milanesa de pollo (Napolitana)" y "Milanesa de pollo (sola)").



- Botón opcional "Usar mi ubicación actual" → Geolocation API del navegador (requiere acción explícita del usuario, no automático).
- Reverse geocoding con **Nominatim (OpenStreetMap)**, gratuito, para convertir lat/lng en una referencia legible ("Cerca de Av. X y Y, Caaguazú").
- El campo de dirección siempre queda como texto editable — el cliente puede corregir/agregar referencias.
- Se guarda `delivery_lat` / `delivery_lng` además del texto, para que el back office pueda abrir un link directo a Google Maps (`https://www.google.com/maps?q=lat,lng`).

## Back office — notificaciones

- Supabase Realtime para ver pedidos nuevos en vivo mientras la pestaña/tablet está abierta (sonido/badge).
- No se implementa Web Push / PWA push por ahora — el `wa.me` ya cubre la notificación "real" al celular de la dueña. Evaluar a futuro si crece el volumen.

## Open Graph / SPA en Vercel

- Es una SPA sin SSR: los meta tags de Open Graph son **estáticos** en `index.html` (una sola imagen/título/descripción para todo el sitio).
- No se planea por ahora generar OG dinámico por plato (requeriría una function de Vercel renderizando HTML por query param). Si se necesita en el futuro, evaluar `@vercel/og` o similar.

## Consideraciones específicas de Paraguay

- Moneda: Guaraníes, formato `Gs 38.000` (sin decimales, separador de miles con punto).
- Métodos de pago: mostrar como texto simple en checkout (efectivo, Tigo Money, Ueno, transferencia) — no requiere tabla propia inicialmente.
- Zona/costo de delivery: campo simple configurable (monto fijo o por zona), pendiente de definir si se modela en tabla propia o como config simple.
- Horario de atención: posible campo de config para mostrar "cerrado" fuera de horario — pendiente de definir.

## Pendientes / decisiones abiertas

- [ ] Definir si habrá costo de envío y cómo se calcula (fijo / por zona / gratis).
- [ ] Definir horarios de atención y comportamiento del menú fuera de horario.
- [ ] Confirmar número de WhatsApp del negocio.
- [ ] Subir fotos reales de los platos a Supabase Storage.
- [ ] Definir si habrá un segundo usuario admin (ej: empleada) y permisos diferenciados.
- [ ] Confirmar con la dueña si "Guarniciones" puede pedirse sola o solo como acompañamiento (afecta si se muestra como categoría visible siempre o solo sugerida junto a Milanesas).
- [ ] Revisar si "Pasta artesanal a la crema" (que aparece como guarnición) duplica o se relaciona con los items de "Pastas Artesanales" — por ahora se trata como item independiente en Guarniciones.
- [ ] Generar `supabase/schema.sql` con este esquema + seed completo de las ~7 categorías, ~30 productos y los 2 grupos de modificadores del menú real.
