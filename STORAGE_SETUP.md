# Supabase Storage — Setup de imágenes

## Paso 1 — Crear el bucket en el dashboard

Ir a **Storage → New bucket** con estos valores:

| Campo | Valor |
|---|---|
| Name | `menu-images` |
| Public bucket | ✅ activado |

> El bucket tiene que ser **público** para que las URLs de las imágenes funcionen sin login en el menú.

---

## Paso 2 — Políticas RLS del bucket

En **SQL Editor → New query**, pegar y ejecutar:

```sql
-- Lectura pública (el menú carga imágenes sin login)
create policy "menu_images_read_public"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'menu-images');

-- Solo admins autenticados pueden subir, editar y borrar
create policy "menu_images_insert_auth"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'menu-images');

create policy "menu_images_update_auth"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'menu-images');

create policy "menu_images_delete_auth"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'menu-images');
```

---

## Cómo quedan las URLs en `menu_items.image_url`

Una vez subida una imagen desde el back office, la URL pública tiene este formato:

```
https://imroxoqkmhwiqasponci.supabase.co/storage/v1/object/public/menu-images/nombre-del-archivo.jpg
```

Ese valor es lo que se guarda en la columna `image_url` de cada plato.  
El componente `MenuItemCard` ya lo lee y lo muestra automáticamente.

---

## Recomendaciones para los archivos

- Formato: **JPG o WebP** (WebP pesa menos y carga más rápido)
- Tamaño máximo sugerido: **800 × 600 px**, peso < 200 KB
- Nombres sin espacios ni tildes: `milanesa-pollo.jpg`, `lasagna.jpg`
