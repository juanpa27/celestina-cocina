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

## Acceso de Claude Code a Supabase

- Configurado servidor MCP de Supabase (`.mcp.json`, solo-lectura, scopeado al proyecto) para que Claude Code pueda consultar la base directamente (schema, datos, logs) sin pasar por el dashboard. Token guardado en `.env` (gitignored) — no está en este archivo ni en el repo.

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
8. **Bebidas** — Gaseosas, jugos, aguas. Items simples sin modificadores (mismo flujo `+`/`-` que Pastas Congeladas). Ver sección "Bebidas".

## Bebidas

Categoría agregada después del menú inicial. Decisiones de modelo:

- **Una sola categoría "Bebidas"** (no categorías separadas por tipo). Esto deja el hook de checkout ("agregá una bebida") como un simple filtro `where category = 'Bebidas'`.
- **Subtipo** (Gaseosa / Jugo / Agua) va en una columna nueva `menu_items.subcategory text` (nullable, null para todos los items de comida). Es genérica y reutilizable a futuro. Se ejecuta una vez: `alter table menu_items add column if not exists subcategory text;`
- **El volumen va DENTRO del `name`**, ej. `"Coca-Cola 500 ml"`, NO en `notes`. Razón crítica: el snapshot del pedido (`order_items`) solo guarda `item_name` e `item_price` — no guarda `notes` ni `subcategory`. Si el volumen no estuviera en el nombre, el pedido en WhatsApp diría "1x Coca-Cola" y se perdería el tamaño (y son SKUs distintos con precios distintos: 500 ml vs 1.5 L).
- Bebidas **no** tienen `menu_item_modifier_groups` asociados.

### Hook "agregá una bebida" en checkout

- Al confirmar el pedido, si el carrito **no contiene ningún item de categoría "Bebidas"**, mostrar un paso intermedio ("¿Querés agregar una bebida? 🥤") con las bebidas disponibles, antes de seguir al `wa.me`.
- Si el carrito ya tiene una bebida, saltar el paso y continuar directo.

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
- **Web Push implementado** (sesión 2026-06-24): notificaciones nativas al celular incluso con el navegador cerrado. Ver sección "Implementado (sesión 2026-06-24)" para detalles.

## Open Graph / SPA en Vercel

- Es una SPA sin SSR: los meta tags de Open Graph son **estáticos** en `index.html` (una sola imagen/título/descripción para todo el sitio).
- No se planea por ahora generar OG dinámico por plato (requeriría una function de Vercel renderizando HTML por query param). Si se necesita en el futuro, evaluar `@vercel/og` o similar.

## Consideraciones específicas de Paraguay

- Moneda: Guaraníes, formato `Gs 38.000` (sin decimales, separador de miles con punto).
- Métodos de pago: mostrar como texto simple en checkout (efectivo, Tigo Money, Ueno, transferencia) — no requiere tabla propia inicialmente.
- Zona/costo de delivery: campo simple configurable (monto fijo o por zona), pendiente de definir si se modela en tabla propia o como config simple.
- Horario de atención: posible campo de config para mostrar "cerrado" fuera de horario — pendiente de definir.

## Implementado (sesión 2026-06-24)

- **Configuración de método de pago** (`ConfigPage` → sección "Método de pago"): titular, alias (CI/teléfono), entidad bancaria, logo del banco (subida a Supabase Storage bucket `logos`). SQL migration: `payment_config_migration.sql` (correr una vez en Supabase, también crea el bucket). `ConfigPage` lazy-loaded para mantener `html-to-image` fuera del bundle público.
- **PaymentBanner** (`src/components/admin/flyers/PaymentBanner.jsx`): imagen 1080×1920 con preview en vivo mientras se tipean los campos. Jerarquía: Alias (chip azul full-width, 72px mono) → Titular (64px) → Entidad (52px). Sin footer. Botón "Compartir" (Web Share API → abre WhatsApp nativo en mobile) con fallback a descarga en desktop. Botón "Descargar" (JPG via html-to-image). Botón "Copiar datos para WhatsApp": genera texto formateado con emojis (🏦👤🔢), muestra checkmark verde 3s. `flyer.js` refactorizado: `renderToBlob()` compartido entre `exportFlyer` y el nuevo `shareFlyer`.
- **Flyers rediseñados** (full-bleed, dark layout): `DishFlyer` — foto ocupa 72% del canvas con gradient overlay transparente→`#1c2b36`, texto encima del gradient, badge de marca (logo + nombre) top-right semitransparente, precio en amarillo 110px debajo. `CategoryFlyer` — grilla 2×2 con fotos full-bleed + gradient + nombre/precio por celda, header oscuro con nombre de categoría + badge inline. Se eliminaron el header bar y el footer CTA de ambas plantillas.
- **Carga manual de pedidos** (`/admin/nuevo-pedido`, `src/pages/admin/NewOrderPage.jsx`): botón "Cargar pedido" en header de `/pedidos`. Campos: nombre/teléfono del cliente, selector de producto (categoría → item → radio de modificadores → stepper qty → "Agregar"), carrito con +/- y remove por línea, ubicación (pegar URL de WhatsApp/Google Maps o coordenadas crudas → auto-parse + reverse geocode, O elegir en mapa con `LocationPicker`), notas. Saltea el check de `is_open` (el admin puede cargar pedidos aunque esté "cerrado"). Al confirmar: inserta en `orders` + `order_items` + `order_item_modifiers`, redirige a `/pedidos`. `parseLocationUrl()` agregado a `utils.js` (maneja `?q=`, `?ll=`, `@lat,lng` y coordenadas crudas). Lazy-loaded.
- **Dashboard mejorado** (`DashboardPage.jsx`): animaciones con framer-motion (cards con stagger 70ms, número "Facturado" cuenta desde 0 con ease-out cúbico, barras de top productos animan su ancho). Nuevo filtro "Mes": grilla 4×3 de meses + selector de año (2026/2027), meses futuros en gris, mes actual con punto indicador. Medallas 🥇🥈🥉 en top productos. Label del período activo bajo el título "Resumen". Skeleton loader mientras carga. Estado vacío en top productos.
- **Fix toggle abrir/cerrar** (`useIsOpen.js` + `ConfigPage`): el override manual ahora gana siempre sobre el check de horario (`'false'` cierra, `'true'` abre, `undefined` → revisa horario). `setQueryData` en ConfigPage actualiza la UI instantáneamente sin esperar `invalidateQueries`.
- **PWA instalable en `/admin`** (`vite-plugin-pwa`, Workbox, `manifest.json`):
  - SW con Workbox: pre-cachea bundle, runtime StaleWhileRevalidate (Storage 7d) / NetworkFirst (API 8s timeout) / CacheFirst (Fonts 1 año) / navigateFallback → index.html.
  - `manifest.json`: `start_url`/`id` = `/admin/dashboard`, `background_color` oscuro `#1c2b36`, shortcuts "Ver pedidos" y "Cargar pedido".
  - Íconos maskable 512×512 + 13 splash screens iOS (iPhone SE → iPad Pro 12.9") generados con `scripts/gen-pwa-assets.mjs` (sharp). Regenerar con `npm run gen:pwa`.
  - `scope` fijado a `/admin` — clientes en el menú público NO ven el prompt de instalación.
- **Web Push — notificaciones con celular bloqueado**:
  - `src/sw.js`: SW propio (modo `injectManifest`). Handler `push`: muestra notificación con título `#N` (número de pedido), body con nombre del cliente y total en Gs, vibración. Handler `notificationclick`: reutiliza ventana admin abierta o abre nueva.
  - `src/hooks/usePushNotifications.js`: pide permiso Notification, suscribe al browser con VAPID, guarda endpoint en Supabase (tabla `push_subscriptions`, evita duplicados por endpoint). `unsubscribe` limpia browser + BD.
  - `ConfigPage` → sección "Notificaciones": botón Activar/Desactivar con estados (no soportado / bloqueado / activo / inactivo).
  - Edge Function `supabase/functions/notify-new-order/index.ts` (Deno): recibe webhook POST de Supabase, lee todas las suscripciones, envía push con `web-push` (npm:), limpia automáticamente suscripciones con 410 Gone.
  - SQL trigger `supabase/migrations/20260624_push_webhook_trigger.sql`: `AFTER INSERT ON orders` → llama a la Edge Function via `net.http_post`. Desplegada en el proyecto Supabase con VAPID keys en secrets.
- **SEO**: título de la página pública cambiado a "Pedí acá" (antes "Menú Digital").

## Implementado (sesión 2026-06-20)

- **"Más Pedido" badge**: columna `menu_items.is_popular boolean DEFAULT false` (nullable). Cuando es `true`, la card del menú muestra un borde dorado 2px (`#f2c14e`) + pill "🔥 Más pedido" en la esquina inferior-izquierda de la imagen. Administrable desde `MenuItemEditor` (checkbox). Los badges en mobile son 1-2px más grandes vía responsive classes (`text-[12px] sm:text-[11px]` / `text-[13px] sm:text-[12px]`).
- **Descuentos**: columna `menu_items.discount_pct smallint DEFAULT 0` (nullable, 0–100). La función `calcDiscountedPrice(price, pct)` en `src/lib/utils.js` calcula el precio efectivo redondeado al múltiplo de 500 Gs más cercano (`Math.round(raw/500)*500`). Si hay descuento, la card muestra el precio original tachado + precio efectivo en bold + badge azul "X% OFF" (top-left de imagen). El precio que entra al carrito y al mensaje de WhatsApp es siempre el efectivo — `ModifierModal` también lo usa como `basePrice`. El admin (`MenuItemEditor`) tiene campo numérico 0–100 con preview live del precio resultante. **Clave**: `useMenu.js` debe incluir `is_popular, discount_pct` en el SELECT explícito — si no, los campos se guardan en la BD pero nunca llegan a la card (bug ya corregido).
- **Generador de flyers** (`/admin/flyers`): genera imágenes 1080×1920 px listas para estados de Instagram y WhatsApp. Dos plantillas: "Por plato" (spotlight: foto hero + nombre + precio + badges) y "Por categoría" (lista de hasta 4 platos, priorizando `is_popular` y `discount_pct > 0` automáticamente). Usa `html-to-image` (canvas → toBlob) con doble pasada para resolver fuentes e imágenes. Exporta en WebP (más liviano, calidad 0.9) o JPG (más compatible, calidad 0.92). El módulo `src/lib/flyer.js` centraliza la exportación. Las plantillas están en `src/components/admin/flyers/` (`flyerChrome.jsx` = chrome de marca reutilizable, `DishFlyer.jsx`, `CategoryFlyer.jsx`). `FlyersPage` está lazy-loaded para que `html-to-image` no pese en el bundle del menú público. Nav del admin actualizado con ícono "Images". **Punto a vigilar**: fotos de Supabase Storage necesitan CORS habilitado para que aparezcan correctamente en la imagen exportada.

## Implementado (sesión 2026-06-15)

- **Open Graph**: `public/og-image.jpg` estático 1200×630. Meta tags OG/Twitter en `index.html` con URL absoluta `https://celestina-cocina.vercel.app/` (los scrapers de WhatsApp/Facebook exigen URL absoluta, no relativa). Twitter card = `summary_large_image`.
- **Bebidas**: ver sección "Bebidas". Columna `menu_items.subcategory` ya creada en Supabase. Volumen en el `name` (no en notes) porque el snapshot del pedido solo guarda `item_name`/`item_price`. Hook "agregá una bebida" en el checkout (`CartSidebar`, paso `drinks`) con cards animadas (`DrinkCard`). Detección por categoría, NO depende de `subcategory`.
- **Ubicación de entrega — solo GPS/mapa, sin carga manual** (decisión crítica). `LocationPicker` no arranca con pin default (era el bug de "ubicación random en Caaguazú"); pide GPS al abrir; si falla, el cliente toca/arrastra el pin (nunca texto libre); el texto es solo lectura (referencias van en Notas). El checkout exige `lat/lng` reales para confirmar. Se eliminó el textarea de dirección manual y el `useGeolocation` del checkout.
- **Admin — crear platos**: botón "Agregar plato" por categoría en `MenuAdminPage`. `MenuItemEditor` ahora hace crear Y editar (genera UUID propio para que la foto se pueda subir antes de existir la fila). El botón queda fuera del wrapper deshabilitado → se puede cargar a categorías inactivas. **Falta**: borrar plato, crear/borrar categoría (borrar categoría es peligroso por `on delete cascade` → borra sus platos).
- **/pedidos rediseñado**: franja lateral de color por estado, reloj de urgencia (verde/ámbar/rojo por antigüedad en pendientes), stepper de progreso, badge con ícono, conteos en chips, total con jerarquía, "Cancelar" como botón fantasma, estado vacío con identidad, animaciones (framer-motion). Módulo compartido nuevo: `src/lib/orderStatus.js` (`STATUS_META`, `STATUS_FLOW`, `urgencyColor`) — única fuente de verdad de colores/íconos/flujo.
- **Dashboard** (`/admin/dashboard`, ahora es el landing de `/admin`): facturado (excluye cancelados), pedidos, ticket promedio, pendientes (con acceso rápido grande a /pedidos), desglose por estado y top productos. Toggle Hoy/Semana/Mes/Todo. Reusa `useOrders` (sin queries nuevas).
- **Realtime**: la suscripción ya estaba en `useOrders.js`. Se activó la replicación: `alter publication supabase_realtime add table orders;` (hecho). El sonido de pedido nuevo (`playBeep` en `OrdersPage`) depende de eso + de una interacción previa del usuario (autoplay del navegador).

## Implementado (sesión 2026-06-30)

- **CRUD de Complementos** (`/admin/complementos`, `src/pages/admin/ComplementosPage.jsx`, `src/hooks/useModifiers.js`): gestión completa de grupos de modificadores y sus opciones desde el back office. `GroupFormModal` (crear/editar grupo: nombre, tipo single/multiple, requerido), `ModifierFormModal` (crear/editar opción con extra_price), `DeleteGroupModal` (confirmación en 2 pasos cuando el grupo tiene platos vinculados). Borrar grupo hace cascade en Supabase (borra `modifiers` y `menu_item_modifier_groups`). `MenuItemEditor` actualizado con checkboxes para vincular grupos a platos (carga grupos existentes al editar, sincroniza con DELETE+INSERT en submit).
- **Hamburger drawer en mobile** (`AdminLayout.jsx`): reemplazó el sticky bottom nav de 6 ítems por hamburger en la topbar → drawer deslizable desde la izquierda. Overlay semitransparente cierra el drawer al tocar fuera. Transición CSS 0.28s cubic-bezier. Desktop: sidebar sin cambios.
- **Carta PDF** (`/admin/carta`, `src/pages/admin/CartaMenuPage.jsx`): genera PDF del menú activo con `@react-pdf/renderer` v4.5.1. Header azul con logo circular (PNG 1024px, `borderRadius` en el `Image` directamente — `overflow:hidden` en View padre no clipea en react-pdf), franja de azulejos (filas de Views coloreados simulando el `repeating-linear-gradient`), categorías con header en Titan One, items con precio/descuento/notas/modificadores. `Font.register()` con Titan One (TTF de Google Fonts). `Font.registerHyphenationCallback` evita que los nombres se corten. Descarga directa vía `pdf().toBlob()` → `URL.createObjectURL`. Preview en `<iframe>` con `BlobProvider`. Lazy-loaded.
  - `logo-source.png` (1024×1024) copiado a `public/` para que sea accesible como URL estática en el PDF.
  - Titan One agregado al `<link>` de Google Fonts en `index.html` para disponibilidad en html-to-image también.
- **Flyer "Texto Hero"** (`src/components/admin/flyers/TextHeroFlyer.jsx`): tercera plantilla en `/admin/flyers`. Foto del plato como fondo full-bleed → overlay azul de marca semitransparente → patrón SVG de rombos → texto gigante Titan One blanco centrado → degradados top/bottom → logo medallón → precio en amarillo. `autoSplitHeroName()` divide palabras largas en chunks de ~4 chars (ej: TAGLIATELLES → TAG/LIA/TEL/LES → font 380px en vez de 126px). `calcFontSize()` adapta el tamaño a la línea más larga. Campo `<textarea>` en FlyersPage: cada línea = una línea gigante, editable manualmente.
- **@vercel/analytics**: instalado. `<Analytics />` de `@vercel/analytics/react` (no `/next` — este es Vite SPA) montado en `App.jsx` dentro del `BrowserRouter` para capturar navegaciones SPA automáticamente.
- **README.md**: reemplazado el default de Vite con documentación real del proyecto (stack, funcionalidades, modelo de datos, variables de entorno, scripts, estructura de directorios).

## Implementado (sesión 2026-07-01)

- **Fix: el sticky bottom nav era para el admin, no para el menú público.** La sesión anterior había creado `MenuBottomNav.jsx` y lo puso en el menú público por error — el bottom nav de 5 íconos siempre fue pensado para el back office (existía ahí antes, se había sacado al pasar a hamburger-only). Corregido:
  - **Menú público**: se eliminó `MenuBottomNav.jsx` y se restauró el botón flotante "¿Cómo pedir?" (ícono Truck, esquina inferior izquierda) y el `CartFloating` con `bottom: 1rem` (estado previo a la sesión 2026-06-30).
  - **Admin** (`AdminLayout.jsx`): recupera el bottom nav mobile, pero sin repetir el problema original de 6-7 destinos apretados. 3 tabs directos de uso diario — Resumen / Pedidos / Menú (`NAV_PRIMARY`) — + un 4º tab "Más" (ícono `MoreHorizontal`) que abre el drawer ya existente con el resto (Complementos / Flyers / Carta PDF / Config + logout, `NAV_MORE`). El hamburger del topbar mobile se sacó (redundante con "Más"). Mismos colores que el resto del admin: navy `#1c2b36`, activo amarillo `#f2c14e` con pill `rgba(242,193,78,0.12)`, inactivo `#94a3b8`. Padding-bottom del contenido con `env(safe-area-inset-bottom)` vía clase Tailwind arbitraria (no inline style, para que `md:pb-0` pueda pisarlo en desktop).
- **Fix: flyer "Texto Hero" no exportaba con Titan One → fuente autohospedada** (`public/fonts/titan-one.{woff2,ttf}`, `src/index.css`, `index.html`, `CartaMenuPage.jsx`). Causa raíz: `html-to-image` necesita leer las reglas `@font-face` del stylesheet para embeber la fuente como base64 en la imagen exportada; al venir de Google Fonts (cross-origin), el navegador bloqueaba esa lectura (`SecurityError` en `cssRules`) y el export caía a system serif — no se notaba en Chrome desktop (comparte el font cache con la imagen exportada) pero sí en mobile/Safari, el uso real del admin dado el trabajo de PWA/splash screens para iPhone. Un primer intento con `crossorigin="anonymous"` en el `<link>` sacó el error de consola en desktop pero seguía sin andar en mobile. Solución definitiva: la fuente vive en el propio proyecto (`public/fonts/titan-one.woff2` para la web vía `@font-face` en `index.css`, `titan-one.ttf` para `Font.register()` en el PDF de `CartaMenuPage.jsx`), sin depender de red externa ni de CORS en absoluto. `index.html` ya no pide Titan One a Google Fonts (solo Fraunces/DM Sans, que sí mantienen `crossorigin="anonymous"` por si acaso). Verificado con un harness Playwright que llama al `toCanvas` real de `flyer.js`: cero errores de consola y el export mantiene el font correctamente.
- **Flyer "Texto + foto"** (`src/components/admin/flyers/TextPhotoFlyer.jsx`): cuarta plantilla en `/admin/flyers`, a pedido explícito con una referencia visual (tagliatelles + tenedor atravesando el texto "TAGLIATELLES" gigante, foto sin fondo flotando libre entre las letras). A diferencia de "Texto Hero" (foto de fondo full-bleed detrás de todo el texto), acá el fondo es azul sólido + patrón geométrico (reusa `DiamondPattern`), el texto gigante va detrás (reusa `autoSplitHeroName`/`calcFontSize`, ambos ahora exportados desde `TextHeroFlyer.jsx`), y la foto flota **por encima** del texto del medio, sin marco.
  - **Iteración de diseño** (2 intentos rechazados antes de llegar a esto — documentado porque los tres approaches parecen razonables a priori):
    1. Fundido (`mask-image`, lineal top/bottom y después ovalado en las 4 direcciones) para simular un recorte transparente sin tocar la foto. Se veía mal con fotos reales de fondo blanco/estudio (el caso típico): la zona semitransparente no funde con el azul oscuro, deja un halo claro con forma de caja.
    2. Tarjeta con borde amarillo + sombra (sin zona semitransparente, para eliminar el halo). El usuario la rechazó igual: seguía leyéndose como "una foto pegada encima del texto", no como la referencia (que no tiene ningún rectángulo visible).
    3. **Solución real**: sacarle el fondo a la foto de verdad. `@imgly/background-removal` (segmentación por IA, corre 100% en el navegador vía onnxruntime-web/WASM, nada se sube a un servidor) se importa dinámicamente en `FlyersPage` al subir la foto en modo `phototext` — unos segundos de proceso con spinner "Recortando fondo…". El resultado se guarda como `data:` URL, **no `blob:`** — importante: `html-to-image` con `cacheBust: true` le agrega un query string a toda URL de imagen antes de re-fetchearla para el export, y eso invalida una `blob:` URL (es un ID exacto, no tolera sufijos) → `net::ERR_FILE_NOT_FOUND` solo al exportar, no en preview. Con la foto ya transparente, `TextPhotoFlyer` la apoya directo con `object-fit:contain` + `filter: drop-shadow(...)` (sigue el contorno real del recorte, no un rectángulo) — no hay tarjeta, borde, ni máscara.
  - No se persiste en Supabase Storage ni se asocia a ningún plato del catálogo — la foto (subida y ya recortada) es de un solo uso para ese flyer.
  - `onnxruntime-web` (que arrastra `@imgly/background-removal`) pesa ~800KB — aislado en su propio chunk (`bg-removal`) vía `manualChunks` en `vite.config.js` y excluido del precache del service worker (`globIgnores`) para no inflar la descarga inicial de la PWA del admin en sesiones que no usan este modo.
- **Rediseño de la Carta PDF** (`CartaMenuPage.jsx`): refresh completo a pedido de la dueña.
  - **Fotos + grilla**: de filas de texto densas (nombre … precio, con descripción/notas/modificadores) a grilla de tarjetas 2 columnas con foto del plato (`Image src={item.image_url}`) + nombre + precio. Se sacaron descripción, notas y modificadores para un look más limpio/vistoso. Placeholder con la inicial del plato (Fraunces) para ítems sin foto. Card width fijo `(595 - 44 - gap)/2` (A4 menos padding), `wrap={false}` por tarjeta, categoría con `wrap` (permite cortar entre páginas sin partir una card).
  - **Tipografía del front**: reemplaza TitanOne + Helvetica por Fraunces (display) + DM Sans (body), las mismas del menú. react-pdf NO soporta variable fonts → se bajaron instancias estáticas por peso a `public/fonts/`: `fraunces-600.ttf`, `fraunces-700.ttf`, `dmsans-400/500/700.ttf` (bajadas de Google Fonts con user-agent legacy que fuerza TTF en vez de woff2). Registradas con `Font.register({ family, fonts: [{ src, fontWeight }] })`.
  - **Sin amarillo**: el acento amarillo (títulos/precios) pasa a crema-sobre-azul en header y categorías, azul en precios, badge de descuento azul. Constante `AMARILLO` eliminada del archivo.
- **Flyer "Menú (estado)"** (`src/components/admin/flyers/MenuStatusFlyer.jsx`, modo `status` en `FlyersPage`): 5ª plantilla en `/admin/flyers`, para postear **el menú completo** como estado de WhatsApp/IG. Muestra **todos los platos activos de todas las categorías** (excluye Bebidas), agrupados por categoría, sin selector — no hay recorte a "hasta 6 platos" ni elección de categoría. Lienzo **fijo 1080×1920** (9:16, para entrar exacto en un estado sin barras negras); el cuerpo se **auto-escala** (`transform: scale()`, medido en `useLayoutEffect` comparando `scrollHeight` del contenido contra el alto disponible) para que quepan todos los platos, en vez de que el lienzo crezca con el contenido. Header con logo a la **izquierda** + eyebrow "Nuestro menú" + "Celestina Cocina" (Fraunces) + subtítulo, sobre azul, banda azulejo debajo. Por categoría: título Fraunces + línea azulejo, grilla 2 columnas de cards (foto 250px fija o placeholder con inicial, nombre, precio, badge "X% OFF", borde dorado + pill "🔥 Más pedido" si `is_popular`). **Sin footer** (el CTA de WhatsApp se sacó, junto con las Bebidas, en una iteración posterior).
  - **Iteración**: la primera versión (`MenuBoardFlyer.jsx`, ya no existe) era por-categoría-elegida con tope de 6 platos y footer CTA WhatsApp, calcada de `CategoryFlyer`. Se descartó rápido a favor del menú completo (más útil como pieza única para compartir) — dos commits de rediseño el mismo día: se sacó el footer/Bebidas y se pasó a lienzo fijo con auto-escala del contenido.
  - **Nota de verificación (dev harness)**: para chequear estos flyers con Playwright + `toCanvas`, el nodo capturado debe estar dentro de un contenedor del ancho real (1080px) — si el `ref` cuelga directo del viewport (más angosto), `html-to-image` captura al ancho del viewport y sale un canvas de 500px, no 1080. En `FlyersPage` real esto ya está bien porque el `flyerRef` vive dentro del `<div style={{ width: FLYER_W }}>` del preview.

## Implementado (sesión 2026-07-03)

- **Filtro "Por día" en el Dashboard**: junto a Hoy/Semana/Mes/Todo/Por mes, ahora hay un selector de día (`<input type="date">` + atajos Hoy/Ayer). El período se muestra con fecha completa en español ("Viernes 3 de julio de 2026 · Hoy", vía `date-fns/locale/es`). **Bug encontrado y corregido**: el `<input type="date">` nativo dispara `onChange` en cada click de las flechas de mes/día/año del picker del navegador — aplicar el filtro directamente en el `onChange` cerraba el panel y filtraba con fechas intermedias antes de que el usuario terminara de elegir. Solución: el input solo actualiza un borrador local (`dayDraft`); el filtro se aplica recién al tocar "Ver" (los atajos Hoy/Ayer siguen aplicando directo, al ser un solo click ya son una fecha completa). Mismo patrón aplicado al picker de Rango (ver abajo).
- **Reporte de pedidos exportable a PDF/PNG**:
  - Botón "Ver reporte del día" en el Dashboard, visible solo con el filtro Por día activo. Abre `OrdersSummaryModal` (`src/components/admin/reports/`): KPIs del período (facturado/pedidos/ticket) + lista de cada pedido con items, modificadores, cliente, hora, estado y nota.
  - Desde el modal: **PDF** (`ReportDocument.jsx`, `@react-pdf/renderer`, mismo header de marca azul+logo+franja azulejo que la Carta PDF) y **PNG/JPG** (`ReportImage.jsx`, `html-to-image`, reusa `FlyerHeader`/`AzulejoBand` de `flyerChrome.jsx` tal como pidió la dueña — "usar el header de los flyers"). También "Compartir" (Web Share API, solo aparece si el navegador la soporta) que manda la imagen directo a WhatsApp en mobile, reusando `shareFlyer` de `lib/flyer.js` sin modificarlo (el módulo ya no asume dimensiones fijas de flyer, solo captura el nodo tal cual está renderizado).
  - **Nueva página `/admin/reportes`** (ítem "Reportes" en el nav, entre Complementos y Flyers): mismo botón/modal pero con **todos** los filtros de período replicados, más un filtro nuevo de **Rango de fechas** (desde–hasta) que solo tiene sentido acá — pensado para exportar tramos arbitrarios (quincena, últimos 10 días) que no cubre ningún filtro rápido existente.
  - **Refactor de soporte**: la lógica de los filtros de período (antes solo en `DashboardPage.jsx`) se extrajo a `lib/period.js` (funciones puras: `applyPeriodFilter`, `periodLabelFor`, `periodFilterKey`, `dayLabel`, `rangeLabel`) + `hooks/usePeriodFilter.js` (estado) + `components/admin/PeriodFilterBar.jsx` (UI), para que Dashboard y Reportes no diverjan. `lib/reportStats.js` centraliza el cálculo de KPIs/top-productos (antes inline en Dashboard). `lib/pdfFonts.js` centraliza el `Font.register` de Fraunces/DM Sans para react-pdf (antes duplicado solo en `CartaMenuPage.jsx`, ahora también lo usa `ReportDocument.jsx`).
  - **Punto a vigilar (bundle)**: `DashboardPage` se importa **eager** en `App.jsx` (es el landing del admin, no está en `lazy()`). Importar `OrdersSummaryModal` ahí directo arrastraba `react-pdf` + `html-to-image` al bundle público — el precache de la PWA (límite 2 MB/archivo) rompía el build. Se resolvió con `React.lazy(() => import('.../OrdersSummaryModal'))` + `<Suspense>` dentro de `DashboardPage`, así el modal (y sus deps pesadas) solo se cargan cuando se abre. `ReportsPage.jsx` no necesita este tratamiento porque ya está lazy-loaded a nivel de ruta en `App.jsx`.
- **Rediseño de Reportes — foco en montos, look "recibo/comanda"** (a pedido explícito tras una primera vuelta genérica que mezclaba plata con cantidades de platos):
  - **Contenido reordenado**: se sacó "Más vendidos" (unidades de plato) de `ReportsPage` — esa métrica de volumen queda solo en el Dashboard. En su lugar, `computeReportStats` (`lib/reportStats.js`) ahora también calcula `montoCancelado` (plata perdida en cancelaciones), `byDay` (facturación por día calendario, útil cuando el período abarca más de un día) y enriquece `statusCounts` con `monto` por estado (antes solo tenía el conteo `n`). `ReportsPage` muestra: Facturado (hero) → ticket resumen (Facturado/Pedidos/Ticket prom./Cancelado) → Facturación por día (solo si `byDay.length > 1`) → Facturación por estado. El modal de detalle (items, modificadores, cliente) no cambió de contenido — sigue siendo "el detalle" que se abre desde el Dashboard.
  - **Botón del Dashboard renombrado**: "Ver reporte del día" → "Ver pedidos {3 de julio}" (dinámico, `shortDayLabel()` nuevo en `lib/period.js`), más claro sobre qué hace.
  - **Vocabulario visual "recibo impreso"** (`src/components/admin/reports/ticketUI.jsx`, nuevo): perforación de papel (`PerfEdge`, radial-gradient repetido — el color del "agujero" debe matchear el fondo real detrás del ticket), líneas de puntos "etiqueta ..... valor" (`DotLeaderRow`, con radial-gradient de puntos, NO usar `linear-gradient` con `background-size` alto — eso dibuja rayas verticales, no puntos), agujero de espiche (`PunchHole`), y el wrapper `<Ticket>` que junta todo + sombra suave + rotación opcional (los pedidos individuales del modal/PNG alternan ±0.5deg, como una pila de tickets apilados a mano; las tarjetas de resumen quedan derechas, es "la libreta oficial"). Cifras (montos, cantidades, horas) en **Space Mono** autohospedada (`public/fonts/spacemono-{400,700}.ttf`, mismo motivo que Titan One: evitar el bloqueo CORS de html-to-image) vía clase `.figures` (`index.css`). El monto principal de cada pantalla lleva un resaltador amarillo tipo marcador (`.ticket-highlight` con `::before` para pantalla; en `ReportImage.jsx` es un `<div>` real en vez de pseudo-elemento porque html-to-image no garantiza capturar `::before`/`::after` al clonar el DOM).
  - **Fondo: NO usar tonos cálidos (crema/kraft)** — primer intento usó `#F6F1E4` (papel kraft) para diferenciar Reportes visualmente del resto del admin, pero rompía la consonancia con Dashboard/Pedidos (que usan gris-azulado frío `#f9fafb` / `linear-gradient(#f7f9fc→#eef3f9)`). Corregido: `PAPER = '#eef3f9'` (el extremo del gradient que ya usa el resto del admin) y `TICKET = '#ffffff'` (blanco, como el resto de las cards) en `ticketUI.jsx` — el efecto de "recibo" se sostiene solo con perforación/dot-leaders/monospace, no hace falta un fondo de color distinto.
  - **Bug de exportación encontrado**: el fondo corregido en pantalla NO se reflejaba en el PNG exportado — `lib/flyer.js`'s `renderToBlob()` tenía `backgroundColor: '#fdfbf6'` (crema de marca) **hardcodeado**, que html-to-image usa para rellenar el canvas por debajo del DOM clonado, pisando el `background` real del nodo. Se agregó un parámetro opcional `backgroundColor` a `renderToBlob`/`exportFlyer`/`shareFlyer` (default `'#fdfbf6'` sin cambios para los flyers existentes) y `OrdersSummaryModal` ahora lo pasa explícito (`backgroundColor: PAPER`) en sus llamadas.
  - **Método de verificación**: sin credenciales de Supabase Auth para probar `/admin` real, se armó un harness temporal (`/dev-preview` → componente que sembraba `queryClient` + interceptaba `**/rest/v1/orders*`/`**/rest/v1/app_config*` con `page.route()` de Playwright sirviendo JSON mock) para renderizar `ReportsPage`/`OrdersSummaryModal`/`DashboardPage` reales con datos falsos sin pasar por login, screenshotear, y hasta disparar la descarga real de PDF/PNG para inspeccionar el archivo exportado (no solo el DOM en vivo). Se borró todo (`src/pages/dev/`, rutas en `App.jsx`) al terminar — si hace falta iterar de nuevo sobre Reportes, este patrón es reusable.

## Implementado (sesión 2026-07-09)

- **Visitas al menú público en el Dashboard, vía Vercel Web Analytics** (a pedido: ver las visitas sin entrar al dashboard de Vercel). `@vercel/analytics` ya estaba instalado y montado (sesión 2026-06-30) — lo que faltaba era leer esos datos de vuelta. Vercel expone una API REST oficial (`api.vercel.com/v1/query/web-analytics/visits/aggregate`, ver `/docs/analytics/web-analytics-api`) que funciona en plan Hobby (reporting window de 1 mes, 50k eventos/mes incluidos).
  - **Por qué una función serverless y no fetch directo desde el admin**: la API de Vercel requiere un Access Token de cuenta — es un secreto que nunca puede llegar al bundle del cliente. Se agregó `api/analytics.js` (Vercel Serverless Function, Node — Vercel la detecta automáticamente por convivir en `/api` junto al catch-all de `vercel.json`, sin que haga falta tocar ese archivo). La función guarda `VERCEL_TOKEN`/`VERCEL_PROJECT_ID`/`VERCEL_TEAM_ID` (este último solo si el proyecto vive bajo un team) como env vars server-side en el dashboard de Vercel — **nunca en `.env`/`VITE_*`**, eso sí quedaría expuesto en el bundle.
  - **Auth**: el endpoint exige `Authorization: Bearer <supabase_access_token>` (el mismo token de sesión del admin) y lo valida contra Supabase (`auth.getUser`) antes de pegarle a la API de Vercel — sin esto, cualquiera podría pegarle al endpoint y quemar cuota/exponer el volumen de tráfico.
  - **Filtro clave**: `requestPath eq '/'` — el menú público vive entero en la ruta raíz (SPA, todo el árbol de categorías/carrito es interacción client-side sin cambiar de URL), mientras que el admin vive bajo `/admin/*`. Este filtro es lo que separa "visitas de clientes" de "visitas del staff usando el admin" sin necesitar un segundo proyecto de analytics.
  - `src/hooks/useVercelAnalytics.js` (react-query, `staleTime` 5 min) → `src/lib/analyticsStats.js` (`sliceLastNDays`/`sumRange`) → `src/components/admin/VisitasCard.jsx` + `VisitasChart.jsx`. Si la función devuelve error (token no configurado todavía, o falla la API de Vercel) la card se oculta sola (`isError` → `return null`) en vez de romper el Dashboard.
  - **Nota de precisión**: los buckets diarios de Vercel son por día UTC; contra el huso horario de Paraguay (UTC-4) puede haber un desfasaje de horas cerca de la medianoche. Aceptable para un widget informativo — no se usa para nada financiero.
  - **Configuración manual ya hecha por la dueña**: `VERCEL_TOKEN` y `VERCEL_PROJECT_ID` cargados como Environment Variables del proyecto en Vercel (cuenta personal, sin team → no hace falta `VERCEL_TEAM_ID`).
  - **Gráfico dinámico con `recharts`** (sesión siguiente, a pedido explícito — el widget original era un mini sparkline de barras estático de 7 días, no mostraba la evolución día a día): `VisitasChart.jsx` — line chart de 2 series (Vistas/Pageviews en azul `#0f6fb0`, Visitantes en verde `#2f8f6e`; paleta validada con `scripts/validate_palette.js` del skill `dataviz` — el azul de marca `#1d5e8c` solo no pasaba el piso de croma, se subió la saturación apenas para uso como trazo de gráfico sin tocar el azul de marca en el resto de la UI), grid horizontal hairline sólido (nunca punteado), tooltip con crosshair + line-keys + valor en negrita, punto final visible solo en el día de hoy (ancla visual, como el "Today" del dashboard nativo de Vercel que la dueña mandó de referencia). `VisitasCard.jsx` — selector de rango 7D/14D/30D (reemplaza los tabs Hoy/Semana/Mes) que controla a la vez los totales del encabezado y el rango del gráfico, leyenda con line-keys, toggle "Ver tabla" (vista accesible de los mismos datos, requisito del skill `dataviz`).
  - **Verificación visual**: sin credenciales reales de Vercel para probar contra datos en vivo, se armó un harness temporal (`src/pages/dev/DevChartPreview.jsx` + ruta en `App.jsx`, sembraba la cache de react-query — `queryClient.setQueryData(['vercel-analytics'], mock)` — sin pasar por Supabase Auth) para renderizar `VisitasCard` real con datos falsos, capturar con Playwright, y confirmar visualmente el tooltip/crosshair/rangos/tabla. Se borró todo al terminar (mismo patrón que el harness de Reportes, sesión 2026-07-03).

## Implementado (sesión 2026-07-17)

- **Rediseño del flyer "Menú (estado)"** (`MenuStatusFlyer.jsx`), a pedido explícito con specs concretas de la dueña, para que entren más platos con menos necesidad de auto-escalado:
  - **Grilla de 3 columnas** (antes 2): `CARD_W` se recalcula para 3 columnas con `GAP=24`. Foto con alto **fijo en px** (`PHOTO_H = Math.round(CARD_W * 0.75)`, ~4:3), calculado una sola vez a partir de `CARD_W` — no con CSS `aspect-ratio`, ver bug corregido más abajo. Nombre del plato pasa de Fraunces 28px a **DM Sans 700 16px** (serif no aguanta legible a ese tamaño chico; Fraunces queda reservado para los títulos de categoría). Padding interno de tarjeta 16px→10px. Badge de descuento ("X% OFF") reducido a juego con el resto; el de destacado mantiene el texto completo "🔥 Más pedido" (ver bug corregido más abajo), solo con fuente más chica.
  - **Alineación de precio entre tarjetas de una fila**: la grilla pasó de `flex-wrap` a **CSS Grid** (`display:grid`, `gridTemplateColumns: repeat(3,1fr)`), que por default estira todas las cards de una fila a la misma altura. Cada `Card` es `flex column` con el precio en `marginTop:'auto'`, así queda pegado al borde inferior de la tarjeta pase lo que pase con el nombre (1 línea o 3) — el precio siempre alinea con el de las tarjetas vecinas de la misma fila.
  - **Quick win de texto**: `stripTrailingCategoryWord(itemName, categoryName)` (`lib/utils.js`) saca la última palabra del nombre del plato si ya está en el título de la categoría — ej. bajo "Pastas Artesanales", "Ravioles de jamón y queso artesanales" se muestra como "Ravioles de jamón y queso". Solo afecta el texto renderizado en el flyer, no el nombre real en la base. Es genérico (compara última palabra del nombre contra las palabras del nombre de categoría) pero en la práctica hoy solo dispara en Pastas Artesanales (los 6 ítems que terminan en "artesanales") — el resto de categorías no comparte palabras con sus nombres de plato, así que no hay riesgo de falsos positivos.
  - **Contacto automático en la cabecera** (pedido evolucionó en 2 pasos): la primera versión lo puso como una franja azul al **pie** del flyer, pero en un ajuste posterior la dueña pidió sacar ese footer por completo (el flyer cierra mejor con la última tarjeta de "Especiales") y mover el teléfono a la **cabecera**: un pill a la derecha del bloque de texto, a la altura del subtítulo, texto + ícono en amarillo de marca (`#f2c14e`) sobre el azul de la cabecera, con fondo blanco semi-transparente + borde amarillo sutil. **`position:absolute`** dentro del header (que se marcó `position:relative`) a propósito — si el pill vivía en el flujo del flex comprimía el bloque de texto y partía el título "Celestina Cocina" en dos líneas; sacándolo del flujo, el título y el subtítulo quedan intactos. El dato en sí sigue viniendo de `formatLocalPhone(phone)` (`lib/utils.js`): convierte el valor guardado en `app_config.whatsapp_negocio` (código de país sin `+`, ej. `595986818441`, mismo formato que usa `CartSidebar` para el link de `wa.me`) al formato local con `0` que la gente reconoce (`0986 818 441`). **A propósito no incluye la URL de Vercel** — es fiel a lo que Ajaka venía agregando a mano (solo teléfono). Motivo de fondo: que el dato de contacto sea parte de la imagen generada y no dependa de que alguien lo escriba bien cada vez.
  - **Bugs encontrados en la primera vuelta (reportados por la dueña sobre un export real) y corregidos**:
    1. **Primera fila del grid con fotos rotas/desbordadas en el archivo exportado**, aunque el DOM en vivo se veía perfecto. Causa: la foto usaba `aspect-ratio: 4/3` (CSS), que necesita una pasada de layout del navegador para resolverse a un alto real; `html-to-image` serializa el nodo a SVG/`foreignObject` y rasteriza contra el layout en el instante exacto de la captura (dos pasadas, ver `renderToBlob` en `lib/flyer.js`) — esa resolución quedaba inconsistente justo para la primera fila. Fix: alto de foto **fijo en px** (`PHOTO_H`), resuelto de entrada sin depender de layout.
    2. Badge "🔥 Más pedido" lo había acortado a "🔥 Top" sin que lo pidieran, asumiendo que no entraba en la tarjeta angosta — no hacía falta, alcanzaba con bajar la fuente (13px) manteniendo el texto completo.
    - **Lección de proceso**: la primera verificación de esta sesión solo hizo `page.screenshot()` sobre el DOM en vivo (React renderizado normal), **no** sobre el archivo realmente exportado — por eso no detectó el bug #1, que es específico del pipeline de `html-to-image`/`toCanvas`. Reconfirmado con un harness que invoca `toCanvas` directamente (mismas opciones que `renderToBlob`: `pixelRatio:1, cacheBust:true`, doble pasada) y renderiza el canvas resultante en un `<img>` para capturarlo — el mismo patrón que ya recomendaban las notas de sesiones anteriores ("no solo el DOM en vivo", sesión 2026-07-03) y que se pasó por alto la primera vez. A tener en cuenta para cualquier verificación futura de flyers/reportes: siempre inspeccionar el archivo exportado, no el DOM.
  - **Verificación**: mismo patrón de harness temporal que sesiones anteriores (`src/pages/dev/DevFlyerPreview.jsx` + ruta en `App.jsx`, sembrando `queryClient.setQueryData(['config'], {...})` para que `useConfig` resuelva sin Supabase Auth) — se probó primero con un mock chico y después con los ~27 platos reales de las 7 categorías (seed.sql) para confirmar que el auto-escalado no corta contenido ni dejaba texto ilegible con el menú completo. Se borró todo al terminar.
- **Rediseño de flyers "Por plato" y "Por categoría" al design system claro** (`DishFlyer.jsx`, `CategoryFlyer.jsx`), a pedido de la dueña ("mejorar con el design system que tenemos, agregar logo, usar la paleta y las fuentes"). Venían del layout **oscuro full-bleed** de la sesión 2026-06-24 (fondo `#1c2b36`, foto a sangre con degradado); se pasan al **estilo de marca claro/azulejo** ya usado por el "Menú (estado)" y la Carta PDF (header azul con logo circular + banda de azulejos, fondo crema, Fraunces/DM Sans, precios azules, badges amarillos). Elegido explícitamente por la dueña vía `AskUserQuestion` (la otra opción era mantener el look dark reforzando marca). **Nota**: el pedido decía "agregar logo / usar paleta / usar fuentes" pero técnicamente los flyers dark ya tenían las tres cosas — lo que en realidad se leía como "no de marca" era el layout oscuro, no la ausencia de esos elementos.
  - **`DishFlyer`**: header de marca + banda azulejo arriba; cuerpo sobre crema con categoría (eyebrow azul) + nombre del plato (Fraunces tinta 82px) + pill de notas + foto grande en card redondeada con sombra (badges de descuento/más pedido encima) + precio azul gigante (Fraunces 104px) con tachado si hay descuento.
  - **`CategoryFlyer`**: header de marca + banda azulejo; título de categoría (Fraunces azul + línea azulejo, igual que las secciones del "Menú estado") + grilla **2×2** de hasta 4 platos (misma priorización destacados/descuento de antes) en cards claras grandes (foto + nombre Fraunces + precio azul). Se quitó el pie "celestina-cocina.vercel.app" (el contacto ahora vive en el header).
  - **Refactor `flyerChrome.jsx`**: se extrajeron `BrandHeader({ phone, eyebrow })` (cabecera azul clara con logo + eyebrow + `BUSINESS_NAME` + subtítulo + pill de contacto opcional con `formatLocalPhone`, el pill en `position:absolute` para no partir el título) y `AzulejoStripe({ height })` (banda bicolor de firma) como componentes compartidos, y `MenuStatusFlyer` se actualizó para usarlos en vez de tener ese markup inline — así los 3 flyers claros comparten exactamente la misma cabecera/banda y no pueden divergir. Los helpers viejos del layout dark (`FlyerHeader`, `FlyerFooter`, `AzulejoBand`, `AZULEJO_BG`) se mantienen porque los siguen usando `PaymentBanner` y los reportes PNG.
  - Verificado contra el **archivo realmente exportado** (`toCanvas`, misma config que `renderToBlob`) para ambos flyers — fuentes Fraunces/DM Sans embebidas OK, badges y precios correctos. Harness temporal borrado al terminar.
- **Modo "Retirar en el local" (sin delivery)**: toggle configurable para los días sin delivery (domingos, lluvia). Cuando está activo, el cliente pide **sin cargar ubicación** y pasa a retirar por el local. Decisiones de la dueña (vía preguntas): término "Retirar en el local"; mensaje **editable + dirección del local con link a maps**; aplica **también a la carga manual del admin**.
  - **Migración `pickup_mode_migration.sql`** (correr 1 vez en Supabase, como `payment_config_migration.sql`): 3 keys nuevas en `app_config` (`pickup_only` `'true'`/`'false'`, `pickup_message`, `pickup_address`, con `on conflict do nothing`) + `alter table orders add column if not exists is_pickup boolean not null default false`. `schema.sql` y `config.sql` ya reflejan estos cambios en el esquema versionado. **Nota**: sin correr esta migración, el modo no funciona (la columna `is_pickup` no existe y el insert falla).
  - **Modelo**: `orders.is_pickup` marca el pedido como retiro (más robusto que inferir por `delivery_lat is null`). `delivery_address` se mantiene `NOT NULL` — en retiro se le escribe un texto (`"Retiro en el local"` o `"Retiro en el local — <pickup_address>"`) y `delivery_lat/lng` quedan `null`. `useOrders.js` tuvo que sumar `is_pickup` a su SELECT explícito (mismo patrón de bug que `is_popular`/`discount_pct`: si no está en el select, no llega a la card).
  - **Hook `usePickupOnly.js`**: clon de `useIsOpen` (string `'true'`/`'false'` en `app_config`, `staleTime 0` + `refetchInterval 30s`, fail-safe a `false`). El booleano fresco sale de acá; los textos (`pickup_message`/`pickup_address`) del `useConfig` normal. `pickup_only` es **independiente** de `is_open` (abierto + retiro es válido).
  - **`ConfigPage`**: 2º toggle "Solo retiro (sin delivery)" (ámbar, ícono `Store`) al lado del de abrir/cerrar, con su `togglePickup()` (mismo patrón optimista que `toggleOpen`). Sección card "Retiro en el local" con `pickup_message` (textarea) y `pickup_address` (input) sumados al schema zod / defaults / reset / `Promise.all` del submit.
  - **`CartSidebar` (checkout)**: guard de ubicación solo si `!pickupOnly`; el guard server-side lee `pickup_only`/`pickup_address` frescos y decide el insert (address de retiro, lat/lng null, `is_pickup:true`). El bloque "Dirección de entrega" se reemplaza por una card ámbar de retiro (ícono `Store`, `pickup_message`, `pickup_address` + link "Ver en el mapa" a `maps.google.com/?q=<address>`).
  - **`buildWhatsAppMessage` (utils.js)**: si `customer.pickup`, reemplaza la línea `📍 *Dirección:*` + link por `🏪 *Retiro en el local*` (+ `📍 pickupAddress` y link maps si hay dirección); encabezado "Datos del pedido" en vez de "Datos de entrega". Delivery normal intacto.
  - **`NewOrderPage` (carga admin)**: en modo retiro la ubicación es opcional (aviso ámbar); si el admin no carga ubicación → pedido de retiro (`is_pickup:true`, lat/lng null); si igual carga una, se respeta como delivery.
  - **`OrderCard` (back office)**: si `is_pickup`, muestra un chip "🏪 Retiro en el local" (ícono `Store`) en vez del bloque de dirección + "Ver mapa", y oculta el botón "Notificar Ajaka" (no hay reparto).
  - **Verificación**: harness temporal (sembrando `['pickup_only']`/`['config']`, e interceptando la REST de `app_config` con `page.route` para forzar el modo de forma determinística — `usePickupOnly` con `staleTime 0` refetchea y pisa el seed) → checkout en modo retiro (card correcta, submit sin ubicación) y en delivery normal (bloque de mapa intacto), + `ConfigPage` (toggle + campos). `buildWhatsAppMessage` verificado por separado en los 3 casos (retiro con/sin dirección, delivery). Harness borrado al terminar.

## Pendientes / decisiones abiertas

- [ ] Definir si habrá costo de envío y cómo se calcula (fijo / por zona / gratis).
- [ ] Definir horarios de atención y comportamiento del menú fuera de horario.
- [ ] Confirmar número de WhatsApp del negocio.
- [ ] Subir fotos reales de los platos a Supabase Storage.
- [ ] Definir si habrá un segundo usuario admin (ej: empleada) y permisos diferenciados.
- [ ] Confirmar con la dueña si "Guarniciones" puede pedirse sola o solo como acompañamiento (afecta si se muestra como categoría visible siempre o solo sugerida junto a Milanesas).
- [ ] Revisar si "Pasta artesanal a la crema" (que aparece como guarnición) duplica o se relaciona con los items de "Pastas Artesanales" — por ahora se trata como item independiente en Guarniciones.
- [x] Generar `schema.sql` + `seed.sql` con el esquema, las 7 categorías, ~30 productos y los 2 grupos de modificadores.
- [ ] CRUD admin faltante: borrar plato, crear/borrar categoría (definir confirmación fuerte para borrar categoría por el `on delete cascade`).
- [ ] Desbloqueo de audio en el primer click del back office (para que el `playBeep` del primer pedido no lo bloquee el navegador). Nota: Web Push cubre la notificación con celular bloqueado — este ítem refiere solo al beep dentro de la pestaña abierta.
