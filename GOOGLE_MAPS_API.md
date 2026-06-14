# Cómo crear la API Key de Google Maps

## Requisitos previos
- Cuenta de Google (Gmail)
- Tarjeta de crédito/débito (para verificar billing — no cobra mientras estés en el free tier)

---

## Paso 1 — Crear el proyecto en Google Cloud

1. Ir a **https://console.cloud.google.com**
2. Si es la primera vez, aceptar los términos
3. Click en el selector de proyecto (arriba a la izquierda, dice "Select a project" o el nombre de un proyecto)
4. Click **"NEW PROJECT"**
5. Nombre: `Celestina Cocina` → **CREATE**
6. Esperar unos segundos → seleccionar el proyecto recién creado en el selector

---

## Paso 2 — Activar el billing (obligatorio para Maps)

> Google da **$200 USD de crédito gratis por mes** — más que suficiente para siempre para este proyecto.

1. Menú hamburguesa (≡) → **Billing**
2. Click **"Link a billing account"** o **"Manage billing account"**
3. Si no tenés cuenta de billing → **"Create billing account"**
4. Completar nombre, país (Paraguay), tarjeta de crédito/débito
5. Confirmar

---

## Paso 3 — Habilitar las APIs necesarias

1. Menú (≡) → **APIs & Services** → **Library**
2. Buscar **"Maps JavaScript API"** → click → **ENABLE**
3. Flecha atrás → buscar **"Geocoding API"** → click → **ENABLE**

---

## Paso 4 — Crear la API Key

1. Menú (≡) → **APIs & Services** → **Credentials**
2. Click **"+ CREATE CREDENTIALS"** → **API key**
3. Se crea la key → copiarla (empieza con `AIzaSy...`)
4. Click **"Edit API key"** (ícono del lápiz)

---

## Paso 5 — Restringir la key (importante para no pagar de más)

En la pantalla de edición de la key:

### Restricción de aplicación
- Seleccionar **"Websites"** (antes se llamaba "HTTP referrers")
- En "Website restrictions" → **ADD AN ITEM** → agregar:
  ```
  http://localhost:5173/*
  http://localhost:5174/*
  https://TU-PROYECTO.vercel.app/*
  ```
  (reemplazar con tu URL real de Vercel)

### Restricción de API
- Seleccionar **"Restrict key"**
- Tildar solo:
  - ✅ Maps JavaScript API
  - ✅ Geocoding API

- Click **SAVE**

---

## Paso 6 — Agregar la key al proyecto

### En local (`.env`)
```
VITE_GOOGLE_MAPS_API_KEY=AIzaSyTU_KEY_AQUI
```

### En Vercel
1. Vercel → tu proyecto → **Settings** → **Environment Variables**
2. Name: `VITE_GOOGLE_MAPS_API_KEY`
3. Value: `AIzaSyTU_KEY_AQUI`
4. Environment: Production + Preview + Development
5. **Save** → hacer un nuevo deploy (o esperar el próximo push)

---

## Paso 7 — Verificar que funciona

Reiniciá el dev server:
```bash
npm run dev
```

Ir al menú → agregar algo al carrito → checkout → debe aparecer el botón **"Elegir en el mapa"** con el mapa de Google cargado.

---

## Límites del free tier

| API | Precio | Free tier mensual |
|---|---|---|
| Maps JavaScript API | $7 por 1.000 cargas | 28.000 cargas gratis |
| Geocoding API | $5 por 1.000 requests | 40.000 requests gratis |

Para el volumen de Celestina Cocina (decenas de pedidos/día) esto es **gratis para siempre** con el crédito de $200/mes.

---

## Si algo sale mal

- **"This page can't load Google Maps correctly"** → la key no está en `.env` o no tiene billing activado
- **"API key not authorized"** → falta agregar el dominio en las restricciones (Paso 5)
- **El mapa carga pero geocoding no funciona** → falta habilitar la Geocoding API (Paso 3)
