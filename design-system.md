# Design System — Celestina Cocina

## Colores

| Token | Valor | Uso |
|---|---|---|
| `celestina-azul` | `#1d5e8c` | Color primario. Botones, links, encabezados, íconos activos |
| `celestina-azul-claro` | `#5b96bf` | Secundario. Fondos de hover, íconos pasivos, detalles |
| `celestina-amarillo` | `#f2c14e` | Acento/dorado. Banda azulejo, badges, highlights |
| `celestina-crema` | `#fdfbf6` | Fondo global de la app |
| `celestina-tinta` | `#1c2b36` | Texto principal (títulos, precios, nombres) |
| `celestina-azulejo` | `#eaf3f8` | Fondos de chips, steppers, info boxes |
| `celestina-gris` | `#7c8a93` | Texto secundario (descripciones, labels, hints) |

### Colores de estado
| Uso | Valor |
|---|---|
| Error / destructivo | `#ef4444` |
| Éxito | `#16a34a` / `#bbf7d0` (fondo) |
| WhatsApp | `#25D366` |
| Borde estándar | `#e3edf2` |
| Borde sutil | `#f0f5f8` |

### Gradiente del header
```
linear-gradient(180deg, #091c2e 0%, #1a5480 50%, #1d5e8c 80%)
```

---

## Tipografía

| Rol | Font | Clase Tailwind |
|---|---|---|
| Títulos / display | Fraunces (serif) | `font-display` |
| Cuerpo / UI | DM Sans (sans-serif) | *(default)* |

### Escala de texto
| Uso | Tamaño |
|---|---|
| Título de sección (header) | `clamp(26px, 6vw, 38px)` |
| Nombre de plato | `17px` |
| Precio | `16px font-bold` |
| Botón CTA | `15px font-bold` |
| Descripción / secondary | `12px` (xs) |
| Labels / chips | `11px font-semibold` |

---

## Border Radius

Regla: **un solo radio por categoría**, sin mezclar arbitrariamente.

| Elemento | Clase | px |
|---|---|---|
| Botones CTA (texto, ≥40px) | `rounded-2xl` | 16px |
| Stepper ± (32px, icon-only) | `rounded-xl` | 12px |
| Contenedor stepper | `rounded-2xl` | 16px |
| Inputs / textareas / info boxes | `rounded-xl` | 12px |
| Cards de menú | `rounded-2xl` | 16px |
| Bottom sheets / modales (arriba) | `rounded-t-3xl` | 24px |
| Modal centrado | `rounded-3xl` | 24px |
| Sidebar desktop | `rounded-2xl` | 16px |
| Tabs de categoría | `rounded-full` | pill (intencional) |
| Chips / badges / tags | `rounded-full` | pill (intencional) |
| Botón "Pedir +" | `rounded-2xl` | 16px (outer) |
| Botón flotante circular | `rounded-full` | círculo (intencional) |

---

## Espaciado

| Uso | Valor |
|---|---|
| Padding de cards | `p-3.5` (14px) |
| Padding de paneles / modales | `p-5` (20px) |
| Padding horizontal global (mobile) | `px-5` (20px) |
| Gap entre cards en grid | `gap-4` (16px) |
| Gap entre items del carrito | `py-3` (12px vertical) |

---

## Sombras

| Elemento | Sombra |
|---|---|
| Card de menú | `0 2px 10px rgba(29,94,140,0.04)` |
| Drink card activa | `0 5px 16px rgba(22,163,74,0.12)` |
| Bottom sheet carrito | `0 -4px 30px rgba(29,94,140,0.12)` |
| Botón flotante carrito | `0 8px 24px rgba(29,94,140,0.35)` |
| Botón flotante delivery | `0 4px 16px rgba(29,94,140,0.35)` |

---

## Banda Azulejo

Patrón unificado, usado en header y footer:

```css
background: repeating-linear-gradient(
  90deg,
  #1d5e8c 0 28px,
  #f2c14e 28px 32px,
  #5b96bf 32px 60px,
  #f2c14e 60px 64px
);
height: 14px;
```

Componente reutilizable: `<AzulejoStrip height={14} />`

---

## Iconografía

Librería: **Lucide React**. `strokeWidth` estándar: `2` (UI general), `2.5` (énfasis), `3` (botones pequeños ±).

| Ícono | Uso |
|---|---|
| `ShoppingBag` | Carrito vacío, paso 2 del how-to |
| `Truck` | Botón flotante "¿Cómo pedir?" |
| `CupSoda` | Paso de bebidas en checkout |
| `MapPin` | Ubicación de entrega |
| `MessageCircle` | Paso WhatsApp en how-to |
| `Search` | Paso 1 en how-to |
| `ChevronLeft` | Volver al paso anterior |
| `Plus` / `Minus` | Controles de cantidad |
| `X` | Cerrar modal / panel |
| `Check` | Ubicación confirmada |
| `Send` | Confirmar pedido |

---

## Estados de botón

El botón primario `#1d5e8c` usa estas transiciones de opacidad (sin cambio de color):

```
hover:opacity-90   active:opacity-75   disabled:opacity-40
```

`whileTap={{ scale: 0.92 }}` en botones CTA via Framer Motion.
`whileTap={{ scale: 0.82 }}` en botones ± pequeños.

---

## Animaciones

Librería: **Framer Motion**.

| Patrón | Config |
|---|---|
| Entrada de cards | `spring { stiffness: 400, damping: 20 }` |
| Modales / sheets | `spring { stiffness: 320, damping: 32 }` |
| Flash de confirmación (add to cart) | `boxShadow` animated, 450ms |
| Fade backdrop | `duration: 0.22` |
