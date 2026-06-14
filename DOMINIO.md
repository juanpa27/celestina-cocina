# Dominio para Celestina Cocina

## Lo que ya tenés (gratis, sin hacer nada)

`celestina-cocina.vercel.app` — funciona ahora mismo. Es largo pero es gratis y estable para siempre.

---

## Opción 1 — Dominio pago (~$10-15 USD/año) ✅ Recomendado

**La opción más prolija y profesional.**

### Dónde comprarlo

| Registrador | Precio aprox. | Notas |
|---|---|---|
| [Namecheap](https://namecheap.com) | ~$10/año `.com` | El más barato, interfaz simple |
| [Porkbun](https://porkbun.com) | ~$9/año `.com` | Muy sencillo, incluye privacidad gratis |
| [Cloudflare Registrar](https://cloudflare.com) | ~$9/año `.com` | Precio de costo, sin markup |

**Dominio sugerido:** `celestinacocina.com` o `celestinacocina.com.py`

> `.com.py` requiere ser ciudadano/empresa paraguaya y trámite en [NIC.py](https://www.nic.py) (~$30 USD/año).

### Cómo conectarlo a Vercel

1. Comprás el dominio en cualquiera de los registradores de arriba
2. En Vercel → tu proyecto → **Settings → Domains** → escribís el dominio → **Add**
3. Vercel te da dos registros DNS (tipo `A` y `CNAME`)
4. En el panel del registrador → DNS → agregás esos dos registros
5. En 5-30 minutos el dominio apunta a tu app

---

## Opción 2 — Subdominio gratis (cero costo, funcional)

### is-a.dev — subdominio `.is-a.dev`

Resultado: `celestina.is-a.dev`

**Cómo:**
1. Ir a [is-a.dev](https://is-a.dev) → "Register"
2. Fork del repo en GitHub, agregar un archivo JSON con tu subdominio
3. Abrir un Pull Request → aprobado en horas
4. Apuntar el subdominio a Vercel (te dan las instrucciones exactas)

**Ideal para:** proyectos personales/portfolios. Para un negocio se ve un poco técnico.

---

## Opción 3 — Freenom `.tk` / `.ml` / `.ga` ❌ No recomendado

Eran populares pero desde 2023 Freenom canceló dominios masivamente sin aviso. **No usarlo para un negocio.**

---

## Recomendación final

Para Celestina Cocina: **comprá `celestinacocina.com` en Porkbun o Namecheap** (~$10/año). Es menos de 1.000 Gs por día. Le da credibilidad al negocio cuando lo compartís por WhatsApp o Instagram, y Vercel lo conecta en 5 minutos.

Si por ahora no querés gastar nada, `celestina-cocina.vercel.app` funciona perfectamente — podés actualizar el dominio cuando quieras sin cambiar nada del código.

---

## Cómo conectar el dominio en Vercel (paso a paso visual)

```
Vercel
└── Tu proyecto (celestina-cocina)
    └── Settings
        └── Domains
            ├── Escribís: celestinacocina.com   [Add]
            └── Vercel te muestra:
                  A record:      76.76.21.21
                  CNAME record:  cname.vercel-dns.com
```

```
Registrador (Namecheap / Porkbun / Cloudflare)
└── DNS Records
    ├── Tipo A    | Host: @        | Value: 76.76.21.21
    └── Tipo CNAME| Host: www      | Value: cname.vercel-dns.com
```

SSL (HTTPS) lo activa Vercel automáticamente. No se paga nada extra.
