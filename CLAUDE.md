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
