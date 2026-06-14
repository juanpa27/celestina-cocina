-- ─────────────────────────────────────────
-- AJUSTE AL SCHEMA: agregar campo "description" a modifiers
-- (el schema.sql original no lo incluía, pero el menú real tiene
-- descripciones útiles para el cliente, ej. "Gringa", "A caballo")
-- ─────────────────────────────────────────
alter table modifiers add column if not exists description text;

-- ─────────────────────────────────────────
-- SEED: datos iniciales del menú real
-- Celestina Cocina — Caaguazú
-- Ejecutar DESPUÉS de schema.sql
-- ─────────────────────────────────────────

-- Nota: usamos un bloque PL/pgSQL con variables para poder referenciar
-- los ids generados (categorías, grupos de modificadores y los items
-- que necesitan modificadores) sin tener que escribir UUIDs a mano.

do $$
declare
  -- Categorías
  cat_pastas_cong   uuid := gen_random_uuid();
  cat_salsas_cong   uuid := gen_random_uuid();
  cat_focaccias     uuid := gen_random_uuid();
  cat_milanesas     uuid := gen_random_uuid();
  cat_guarniciones  uuid := gen_random_uuid();
  cat_pastas_artes  uuid := gen_random_uuid();
  cat_especiales    uuid := gen_random_uuid();

  -- Grupos de modificadores
  grp_variacion uuid := gen_random_uuid();
  grp_salsa     uuid := gen_random_uuid();

  -- Items de Milanesas (necesitan grupo "Variación")
  mi_mila_carne     uuid := gen_random_uuid();
  mi_mila_pollo     uuid := gen_random_uuid();
  mi_mila_berenjena uuid := gen_random_uuid();
  mi_mila_zucchini  uuid := gen_random_uuid();

  -- Items de Pastas Artesanales (necesitan grupo "Salsa")
  mi_pa_tagliatelles uuid := gen_random_uuid();
  mi_pa_noquis       uuid := gen_random_uuid();
  mi_pa_rav_carne    uuid := gen_random_uuid();
  mi_pa_rav_jyq      uuid := gen_random_uuid();
  mi_pa_rav_pollo    uuid := gen_random_uuid();
  mi_pa_rav_ricota   uuid := gen_random_uuid();

begin

  -- ─────────────────────────────────────────
  -- CATEGORÍAS
  -- ─────────────────────────────────────────
  insert into categories (id, name, sort_order) values
    (cat_pastas_cong,  'Pastas Congeladas',     1),
    (cat_salsas_cong,  'Salsas Congeladas',     2),
    (cat_focaccias,    'Focaccias para Hornear', 3),
    (cat_milanesas,    'Milanesas',             4),
    (cat_guarniciones, 'Guarniciones',          5),
    (cat_pastas_artes, 'Pastas Artesanales',    6),
    (cat_especiales,   'Especiales',            7);

  -- ─────────────────────────────────────────
  -- PASTAS CONGELADAS (500 gr)
  -- ─────────────────────────────────────────
  insert into menu_items (category_id, name, price, notes, sort_order) values
    (cat_pastas_cong, 'Tagliatelles / Pappardelles', 18000, 'Presentación: 500 gr', 1),
    (cat_pastas_cong, 'Ñoquis de papa y semolín',     18000, 'Presentación: 500 gr', 2),
    (cat_pastas_cong, 'Ravioles de carne',            25000, 'Presentación: 500 gr', 3),
    (cat_pastas_cong, 'Ravioles de jamón y queso',    25000, 'Presentación: 500 gr', 4),
    (cat_pastas_cong, 'Ravioles de pollo',            25000, 'Presentación: 500 gr', 5);

  -- ─────────────────────────────────────────
  -- SALSAS CONGELADAS (500 gr)
  -- ─────────────────────────────────────────
  insert into menu_items (category_id, name, price, notes, sort_order) values
    (cat_salsas_cong, 'Salsa Boloñesa', 28000, 'Presentación: 500 gr', 1),
    (cat_salsas_cong, 'Salsa Bechamel', 20000, 'Presentación: 500 gr', 2),
    (cat_salsas_cong, 'Salsa Rosa',     20000, 'Presentación: 500 gr', 3);

  -- ─────────────────────────────────────────
  -- FOCACCIAS PARA HORNEAR (15 x 20)
  -- ─────────────────────────────────────────
  insert into menu_items (category_id, name, price, notes, sort_order) values
    (cat_focaccias, 'Focaccia Tradicional',        15000, 'Tamaño: 15 x 20', 1),
    (cat_focaccias, 'Focaccia Caprese',            20000, 'Tamaño: 15 x 20', 2),
    (cat_focaccias, 'Focaccia La llorona',         20000, 'Tamaño: 15 x 20', 3),
    (cat_focaccias, 'Focaccia Pesto y mozzarella', 20000, 'Tamaño: 15 x 20', 4);

  -- ─────────────────────────────────────────
  -- MILANESAS (preparadas al momento, ~30 min)
  -- ─────────────────────────────────────────
  insert into menu_items (id, category_id, name, price, notes, sort_order) values
    (mi_mila_carne,     cat_milanesas, 'Milanesa de carne',     25000, 'Preparada al momento, aprox. 30 min', 1),
    (mi_mila_pollo,     cat_milanesas, 'Milanesa de pollo',     20000, 'Preparada al momento, aprox. 30 min', 2),
    (mi_mila_berenjena, cat_milanesas, 'Milanesa de berenjena', 20000, 'Preparada al momento, aprox. 30 min', 3),
    (mi_mila_zucchini,  cat_milanesas, 'Milanesa de zucchini',  20000, 'Preparada al momento, aprox. 30 min', 4);

  -- ─────────────────────────────────────────
  -- GUARNICIONES
  -- ─────────────────────────────────────────
  insert into menu_items (category_id, name, price, sort_order) values
    (cat_guarniciones, 'Papas fritas',                  10000, 1),
    (cat_guarniciones, 'Arroz con queso cremoso',       10000, 2),
    (cat_guarniciones, 'Ensalada fresca Celestina',     10000, 3),
    (cat_guarniciones, 'Pasta artesanal a la crema',    10000, 4);

  -- ─────────────────────────────────────────
  -- PASTAS ARTESANALES (preparadas al momento, ~30 min)
  -- ─────────────────────────────────────────
  insert into menu_items (id, category_id, name, price, notes, sort_order) values
    (mi_pa_tagliatelles, cat_pastas_artes, 'Tagliatelles artesanales',          28000, 'Preparada al momento, aprox. 30 min', 1),
    (mi_pa_noquis,       cat_pastas_artes, 'Ñoquis de papa artesanales',        30000, 'Preparada al momento, aprox. 30 min', 2),
    (mi_pa_rav_carne,    cat_pastas_artes, 'Ravioles de carne artesanales',     40000, 'Preparada al momento, aprox. 30 min', 3),
    (mi_pa_rav_jyq,      cat_pastas_artes, 'Ravioles de jamón y queso artesanales', 40000, 'Preparada al momento, aprox. 30 min', 4),
    (mi_pa_rav_pollo,    cat_pastas_artes, 'Ravioles de pollo artesanales',     40000, 'Preparada al momento, aprox. 30 min', 5),
    (mi_pa_rav_ricota,   cat_pastas_artes, 'Ravioles de ricota artesanales',    40000, 'Preparada al momento, aprox. 30 min', 6);

  -- ─────────────────────────────────────────
  -- ESPECIALES (incluyen tostadas a la provenzal + parmesano)
  -- ─────────────────────────────────────────
  insert into menu_items (category_id, name, price, notes, sort_order) values
    (cat_especiales, 'Lasaña',                    45000, 'Incluye tostadas a la provenzal y queso parmesano rallado', 1),
    (cat_especiales, 'Canelones de carne',        38000, 'Incluye tostadas a la provenzal y queso parmesano rallado', 2),
    (cat_especiales, 'Canelones de jamón y queso',38000, 'Incluye tostadas a la provenzal y queso parmesano rallado', 3),
    (cat_especiales, 'Canelones de choclo',       38000, 'Incluye tostadas a la provenzal y queso parmesano rallado', 4);

  -- ─────────────────────────────────────────
  -- GRUPOS DE MODIFICADORES
  -- ─────────────────────────────────────────
  insert into modifier_groups (id, name, selection_type, required, sort_order) values
    (grp_variacion, 'Variación', 'single', false, 1), -- opcional: la milanesa "sola" es válida
    (grp_salsa,     'Salsa',     'single', true,  1); -- obligatorio: toda pasta artesanal lleva una salsa

  -- ─────────────────────────────────────────
  -- OPCIONES — Grupo "Variación" (Milanesas, todas +10.000)
  -- ─────────────────────────────────────────
  insert into modifiers (group_id, name, description, extra_price, sort_order) values
    (grp_variacion, 'Napolitana',    'Salsa de tomate, jamón cocido y queso mozzarella fundido', 10000, 1),
    (grp_variacion, 'Fugazzeta',     'Salsa base con mozzarella, roquefort, cheddar y parmesano', 10000, 2),
    (grp_variacion, 'Cuatro quesos', 'Mozzarella, roquefort, cheddar y parmesano',                10000, 3),
    (grp_variacion, 'Gringa',        'Salsa cheddar ligera con panceta crujiente y cebollita de verdeo', 10000, 4),
    (grp_variacion, 'A caballo',     'Dos huevos fritos con yema blanda',                          10000, 5);

  -- ─────────────────────────────────────────
  -- OPCIONES — Grupo "Salsa" (Pastas Artesanales)
  -- ─────────────────────────────────────────
  insert into modifiers (group_id, name, description, extra_price, sort_order) values
    (grp_salsa, 'Boloñesa',          'Carne vacuna, tomate y vegetales', 0, 1),
    (grp_salsa, 'Bechamel o Alfredo','Salsa blanca',                     0, 2),
    (grp_salsa, 'Rosa',              'Salsa de tomate y crema',          0, 3),
    (grp_salsa, '4 quesos',          'Mozzarella, dambo, parmesano y roquefort', 10000, 4),
    (grp_salsa, 'Carbonara',         'Panceta, mozzarella, parmesano, perejil, yemas y crema de leche', 10000, 5);

  -- ─────────────────────────────────────────
  -- RELACIÓN ITEM ↔ GRUPO DE MODIFICADOR
  -- ─────────────────────────────────────────
  insert into menu_item_modifier_groups (menu_item_id, modifier_group_id) values
    (mi_mila_carne,     grp_variacion),
    (mi_mila_pollo,     grp_variacion),
    (mi_mila_berenjena, grp_variacion),
    (mi_mila_zucchini,  grp_variacion),

    (mi_pa_tagliatelles, grp_salsa),
    (mi_pa_noquis,       grp_salsa),
    (mi_pa_rav_carne,    grp_salsa),
    (mi_pa_rav_jyq,      grp_salsa),
    (mi_pa_rav_pollo,    grp_salsa),
    (mi_pa_rav_ricota,   grp_salsa);

end $$;
