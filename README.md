# Celestina Cocina — Menú Digital + Pedidos

Aplicación web para delivery de comida casera ubicada en **Caaguazú, Paraguay**. Permite a los clientes ver el menú, armar un carrito y confirmar pedidos por WhatsApp. Incluye un back office completo para la dueña del negocio.

**Deploy:** [celestina-cocina.vercel.app](https://celestina-cocina.vercel.app)

---

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React 19 + Vite (SPA) |
| Backend / datos | Supabase (Postgres + Auth + Storage + Realtime) |
| Deploy | Vercel |
| Estado global | Zustand (carrito) |
| Data fetching | TanStack Query v5 |
| Animaciones | Framer Motion |
| Estilos | Tailwind CSS v4 |
| Fuentes | Fraunces · DM Sans · Titan One (Google Fonts) |
| Analytics | Vercel Analytics |

---

## Funcionalidades

### Menú público (sin login)

- Navegación por categorías con scroll-spy y tabs sticky
- Cards de platos con foto, precio, badge "Más pedido" y descuentos
- **Modificadores**: modal de selección para variaciones (ej: salsa de pastas, tipo de milanesa)
- Carrito persistente con stepper por ítem
- Checkout con nombre, teléfono y **ubicación GPS** (reverse geocoding via Nominatim/OpenStreetMap)
- Hook "¿Agregás una bebida?" al confirmar si el carrito no tiene bebidas
- Confirmación del pedido: guarda en Supabase y abre WhatsApp con el detalle pre-armado
- **Sticky bottom nav** en mobile: Inicio / Menú / Carrito / WhatsApp / Ayuda
- Diseño "azulejo" con identidad visual propia (azul #1d5e8c / amarillo #f2c14e / crema #fdfbf6)
- Fuente Fraunces para títulos, DM Sans para cuerpo

### Back office (`/admin`, con login)

- **Auth**: Google OAuth via Supabase Auth
- **PWA instalable** en mobile (`scope: /admin`), splash screens iOS, ícono maskable
- **Notificaciones push** nativas (Web Push + VAPID): recibe alerta de pedido nuevo aunque el celular esté bloqueado
  - Edge Function `notify-new-order` (Deno) + trigger SQL `AFTER INSERT ON orders`
- **Dashboard**: facturado, ticket promedio, pedidos por estado, top productos. Filtros Hoy / Semana / Mes (grilla de meses) / Todo. Animaciones con framer-motion
- **Pedidos** en tiempo real (Supabase Realtime): stepper de estado, reloj de urgencia, sonido de nuevo pedido
- **Carga manual de pedidos**: formulario completo incluyendo mapa para ubicar al cliente
- **Gestión de menú**: CRUD de categorías y platos (nombre, precio, foto, descripción, disponibilidad, descuento, badge "Más pedido")
- **Complementos**: CRUD de grupos de modificadores y opciones (ej: "Salsa" con Boloñesa, Rosa, 4 quesos)
- **Generador de flyers** (1080×1920 px para Instagram / WhatsApp Stories):
  - Plantilla "Por plato": foto hero + precio + badge
  - Plantilla "Por categoría": grilla 2×2
  - Plantilla "Texto hero": texto gigante Titan One + foto de fondo + overlay de marca
- **Carta PDF**: genera PDF de todo el menú activo con texto seleccionable (vía `@react-pdf/renderer`). Logo, franja azulejo, categorías y precios. Descarga directa
- **Configuración**: WhatsApp, horarios de atención, toggle abrir/cerrar manual, método de pago (con generador de banner compartible)
- **Hamburger drawer** en mobile: navegación sin barra inferior

---

## Modelo de datos (Supabase)

```
categories                  — Categorías del menú
menu_items                  — Platos (precio, foto, notas, descuento, is_popular, subcategory)
modifier_groups             — Grupos de variaciones (ej: "Salsa", "Variación")
modifiers                   — Opciones dentro de cada grupo (con extra_price)
menu_item_modifier_groups   — Relación N:N plato ↔ grupo
orders                      — Pedidos (snapshot de datos del cliente)
order_items                 — Líneas del pedido (snapshot nombre + precio base)
order_item_modifiers        — Modificadores elegidos por línea (snapshot)
push_subscriptions          — Endpoints Web Push por dispositivo
```

RLS activo en todas las tablas. Lectura pública en menú; escritura solo autenticados. Pedidos: inserción pública, lectura/modificación solo autenticados.

---

## Variables de entorno

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_VAPID_PUBLIC_KEY=
```

Secrets de la Edge Function (`notify-new-order`):
```
VAPID_PRIVATE_KEY
VAPID_PUBLIC_KEY
VAPID_EMAIL
```

---

## Scripts

```bash
npm run dev          # servidor de desarrollo
npm run build        # build de producción
npm run preview      # preview del build
npm run gen:pwa      # regenera íconos PWA y splash screens desde logo-source.png
```

---

## Estructura de directorios relevante

```
src/
  components/
    admin/
      flyers/        # DishFlyer, CategoryFlyer, TextHeroFlyer, PaymentBanner
    cart/            # CartSidebar, CartFloating
    menu/            # MenuHeader, CategoryTabs, MenuSection, MenuCard, MenuBottomNav
    ui/              # AzulejoStrip, ClosedBanner
  hooks/             # useMenu, useOrders, useConfig, useAuth, useIsOpen, useModifiers, usePushNotifications
  lib/               # supabase.js, utils.js, flyer.js, config.js, orderStatus.js
  pages/
    MenuPage.jsx     # menú público
    admin/           # AdminLayout, DashboardPage, OrdersPage, MenuAdminPage,
                     # ComplementosPage, FlyersPage, CartaMenuPage, ConfigPage,
                     # NewOrderPage, LoginPage
  store/
    cartStore.js     # zustand
supabase/
  functions/
    notify-new-order/  # Edge Function Web Push
  migrations/          # SQL aplicados en producción
public/
  logo-source.png    # logo original 1024×1024
  logo_v2.jpeg       # logo circular (usado en el menú público)
  manifest.json      # PWA manifest
scripts/
  gen-pwa-assets.mjs # genera íconos y splash screens con sharp
```

---

## Consideraciones Paraguay

- Moneda: Guaraníes — formato `Gs 38.000` (sin decimales, separador de miles con punto)
- Métodos de pago: efectivo, Tigo Money, Ueno, transferencia — mostrado como texto en checkout
- Zona horaria: America/Asuncion (UTC-4 / UTC-3 en verano)
- Delivery solo en Caaguazú; coordenadas guardadas para que el admin abra Google Maps directo
