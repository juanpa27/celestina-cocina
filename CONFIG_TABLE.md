# Tabla `app_config` — Configuración del negocio

Tabla de clave-valor para settings que la dueña puede cambiar sin tocar código.

## SQL para crear la tabla

```sql
create table app_config (
  key   text primary key,
  value text not null,
  label text,        -- descripción legible para el back office
  updated_at timestamptz default now()
);

-- RLS
alter table app_config enable row level security;

-- Lectura pública (el front necesita el número de WA para armar el link)
create policy "app_config_select_public"
  on app_config for select
  to anon, authenticated using (true);

-- Solo admins pueden modificar
create policy "app_config_update_auth"
  on app_config for update
  to authenticated using (true);

create policy "app_config_insert_auth"
  on app_config for insert
  to authenticated with check (true);
```

## Seed inicial

```sql
insert into app_config (key, value, label) values
  ('whatsapp_negocio', '595986818441', 'WhatsApp Celestina Cocina'),
  ('whatsapp_ajaka',   '',             'WhatsApp Ajaka (delivery)');
```

> El número de Ajaka se completa cuando esté disponible.

## Estructura de la tabla

| key | value | label |
|---|---|---|
| `whatsapp_negocio` | `595986818441` | WhatsApp Celestina Cocina |
| `whatsapp_ajaka` | _(pendiente)_ | WhatsApp Ajaka (delivery) |

## Formato del número

Sin `+`, sin espacios, sin guiones. Solo dígitos con código de país:
- Paraguay → `595` + número sin el 0 inicial
- Ejemplo: `0986 818 441` → `595986818441`

## Uso en el código

Al confirmar un pedido se abrirán **dos links de WhatsApp**:
1. `wa.me/595986818441?text=...` → notifica a Celestina Cocina
2. `wa.me/<whatsapp_ajaka>?text=...` → notifica a Ajaka (si el número está cargado)

El mensaje a Ajaka puede ser más corto (solo dirección + total), el de Celestina incluye el detalle completo del pedido.
