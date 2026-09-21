-- ============================================================
-- 0010 — Seed: Catalog Data
-- ============================================================
-- Seeds the initial catalog: 3 categories, 46 products, variants,
-- purchase options, images, expense categories, and store settings.
--
-- Safe to re-run: uses ON CONFLICT DO NOTHING where possible,
-- or subselects that are deterministic.
-- NOTE: product IDs match the current mock data for localStorage migration.

-- ── Expense categories ────────────────────────────────────────
insert into expense_categories (name, slug, active) values
  ('Mercancía',  'merchandise', true),
  ('Publicidad', 'advertising', true),
  ('Delivery',   'delivery',    true),
  ('Empaques',   'packaging',   true),
  ('Otros',      'other',       true)
on conflict (slug) do nothing;

-- ── Store settings (single row) ───────────────────────────────
insert into store_settings (
  id, store_name, whatsapp_number, whatsapp_display, instagram_url,
  location, currency, currency_symbol, delivery_text, shipping_text,
  hero_title, hero_description, site_domain, tagline,
  about_text
) values (
  1,
  'Luale Kids Shop',
  '584220162748',
  '+58 422-0162748',
  'https://instagram.com/lualekids.shop',
  'Caracas, Venezuela',
  'USD',
  '$',
  'Delivery en Caracas con costo según la zona.',
  'Envíos a toda Venezuela.',
  'Más que ropa, es amor en cada detalle.',
  'Prendas especiales para acompañar con ternura sus primeros pasos, aventuras y pequeños grandes momentos.',
  'lualekids.shop',
  'Pequeños grandes momentos.',
  'Luale nace de dos nombres que representan el amor más profundo de una familia: Luciano y Alessia. Una marca pensada para acompañar con ternura una de las etapas más bonitas de la vida: la infancia.'
)
on conflict (id) do nothing;

-- ── Categories ──────────────────────────────────────────────
insert into categories (id, name, slug, description, color, active, sort_order) values
  (gen_random_uuid(), 'Bebés',  'bebes',  'Ropa tierna y cómoda para los más pequeños', '#8DB9D5', true, 1),
  (gen_random_uuid(), 'Niñas',  'ninas',  'Prendas especiales para ellas',               '#E8B5B0', true, 2),
  (gen_random_uuid(), 'Niños',  'ninos',  'Ropa cómoda y resistente para ellos',         '#F2C66D', true, 3);

-- ── Products ────────────────────────────────────────────────
insert into products
  (id, catalog_number, sku, slug, name, garment_type, description, status,
   manual_availability, inventory_configured, featured, is_new, size_note,
   tags, published_at)
values
  ('prod-001', 1, 'LK-001', 'chaqueta-denim-con-parches', 'Chaqueta Denim con Parches', 'Chaqueta', 'Chaqueta de mezclilla con parches bordados de corazones y estrellas. Perfecta para el frío sin sacrificar el estilo.', 'active', 'consult', false, true, false, null, '{"denim","parches"}', now()),
  ('prod-002', 2, 'LK-002', 'set-3-piezas-leon', 'Set 3 Piezas León', 'Set', 'Adorable set de tres piezas con estampado de leoncito. Incluye body, pantalón y gorrito a juego. Ideal para bebés.', 'active', 'consult', false, false, true, null, '{"bebé","set","leoncito"}', now()),
  ('prod-003', 3, 'LK-003', 'pantalones-jogger-con-lazo', 'Pantalones Jogger con Lazo', 'Pantalón', 'Pantalones jogger para bebés con lazo decorativo en la cintura. Cómodos y lindos para el día a día.', 'active', 'consult', false, false, false, null, '{"jogger","bebé","lazo"}', now()),
  ('prod-004', 4, 'LK-004', 'joggers-cargo-estampados', 'Joggers Cargo Estampados', 'Pantalón', 'Joggers estilo cargo con estampados divertidos para bebés. Cintura elástica ajustable para mayor comodidad.', 'active', 'consult', false, false, false, null, '{"cargo","bebé","estampado"}', now()),
  ('prod-005', 5, 'LK-005', 'set-leggings-basicos', 'Set Leggings Básicos', 'Leggings', 'Leggings básicos para bebés en colores neutros. Súper elásticos y cómodos para todo el día.', 'active', 'consult', false, false, false, null, '{"leggings","básico","bebé"}', now()),
  ('prod-006', 10, 'LK-006', 'pijamas-enterizas-estampadas', 'Pijamas Enterizas Estampadas', 'Pijama', 'Pijama enteriza con estampados dulces. Cierre de botones a presión para facilitar los cambios. Suave y acogedora para las noches de bebé.', 'active', 'consult', false, true, false, null, '{"pijama","bebé","enteriza"}', now()),
  ('prod-007', 27, 'LK-007', 'vestido-polo-rosa', 'Vestido Polo Rosa', 'Vestido', 'Vestido estilo polo en color rosa. Botones delanteros y corte cómodo para bebés. Elegante y práctico.', 'active', 'consult', false, false, true, null, '{"vestido","polo","bebé"}', now()),
  ('prod-008', 29, 'LK-008', 'conjunto-deportivo-oliva', 'Conjunto Deportivo Oliva', 'Conjunto', 'Conjunto deportivo en color oliva compuesto por sudadera y pantalón jogger a juego. Perfecto para bebés activos.', 'active', 'consult', false, false, false, null, '{"deportivo","oliva","bebé"}', now()),
  ('prod-009', 32, 'LK-009', 'set-floral-rosa', 'Set Floral Rosa', 'Set', 'Delicado set floral con blusa y short estampados en flores sobre fondo rosa. Perfecto para los días de calor.', 'active', 'consult', false, true, true, null, '{"floral","niñas","verano"}', now()),
  ('prod-010', 37, 'LK-010', 'set-polo-oakland-azul', 'Set Polo Oakland Azul', 'Set', 'Set estilo preppy con polo en azul y bermuda a juego. Un look clásico y versátil para niños.', 'active', 'consult', false, true, false, null, '{"polo","niños","clásico"}', now()),
  ('prod-011', 43, 'LK-011', 'vestido-camiseta-parches-fucsia', 'Vestido Camiseta Parches Fucsia', 'Vestido', 'Vestido tipo camiseta en fucsia con parches bordados en el pecho. Moderno, divertido y fácil de combinar.', 'active', 'consult', false, false, false, null, '{"vestido","parches","niñas"}', now()),
  ('prod-012', 44, 'LK-012', 'set-amore-coral', 'Set AMORE Coral', 'Set', 'Set especial con la inscripción ', 'active', 'consult', false, false, true, null, '{"amore","niñas","regalo"}', now()),
  ('prod-013', 6, 'LK-013', 'medias-con-olan-tonos-neutros', 'Medias con Olán Tonos Neutros', 'Medias', 'Medias con olán en tonos neutros para bebés. Se venden en set de 5 pares. Adorables y muy suaves para los pies pequeñitos.', 'active', 'consult', false, false, false, null, '{"medias","bebé","neutros"}', now()),
  ('prod-014', 7, 'LK-014', 'medias-con-lazo-colores-pastel', 'Medias con Lazo Colores Pastel', 'Medias', 'Medias con lazo en colores pastel para bebés. Perfectas para complementar cualquier outfit y muy cómodas.', 'active', 'consult', false, false, false, null, '{"medias","bebé","pastel","lazo"}', now()),
  ('prod-015', 8, 'LK-015', 'medias-basicas', 'Medias Básicas', 'Medias', 'Medias básicas para bebés en colores lisos. Cómodas, duraderas y muy versátiles para el día a día.', 'active', 'consult', false, false, false, null, '{"medias","básico","bebé"}', now()),
  ('prod-016', 9, 'LK-016', 'medias-smile-tonos-neutros', 'Medias Smile Tonos Neutros', 'Medias', 'Medias con estampado de smile en tonos neutros para bebés. Alegres y cómodas para los más pequeños.', 'active', 'consult', false, false, false, null, '{"medias","smile","bebé"}', now()),
  ('prod-017', 11, 'LK-017', 'pijamas-2-piezas-dulces', 'Pijamas 2 Piezas Dulces', 'Pijama', 'Pijama de dos piezas con estampados dulces para bebés. Suave al tacto y perfecta para noches de descanso.', 'active', 'consult', false, false, false, null, '{"pijama","bebé","2 piezas"}', now()),
  ('prod-018', 12, 'LK-018', 'pijamas-enterizas-transportes', 'Pijamas Enterizas Transportes', 'Pijama', 'Pijama enteriza con estampado de transportes para bebés. Botones a presión para cambios fáciles en la noche.', 'active', 'consult', false, false, false, null, '{"pijama","bebé","transportes"}', now()),
  ('prod-019', 13, 'LK-019', 'pijamas-2-piezas-dinosaurios', 'Pijamas 2 Piezas Dinosaurios', 'Pijama', 'Pijama de dos piezas con estampado de dinosaurios para bebés. Divertida y cómoda para las noches de aventura.', 'active', 'consult', false, false, true, null, '{"pijama","bebé","dinosaurios"}', now()),
  ('prod-020', 14, 'LK-020', 'sets-leggings-blanco-y-negro', 'Sets Leggings Blanco y Negro', 'Leggings', 'Set de leggings en blanco y negro para bebés. Básicos esenciales que combinan con todo.', 'active', 'consult', false, false, false, 'Talla pendiente de confirmación (pendiente de confirmación)', '{"leggings","bebé","básico"}', now()),
  ('prod-021', 15, 'LK-021', 'vestido-gris-con-blusa', 'Vestido Gris con Blusa', 'Vestido', 'Conjunto de vestido gris con blusa para bebés. Un look elegante y cómodo para ocasiones especiales.', 'active', 'consult', false, false, false, null, '{"vestido","bebé","gris"}', now()),
  ('prod-022', 16, 'LK-022', 'rompers-florales-modelo-1', 'Rompers Florales Modelo 1', 'Romper', 'Romper floral para bebés con estampado de flores vibrantes. Fresco, fácil de poner y muy tierno.', 'active', 'consult', false, false, false, null, '{"romper","floral","bebé"}', now()),
  ('prod-023', 17, 'LK-023', 'set-rayas-con-cerezas', 'Set Rayas con Cerezas', 'Set', 'Set de rayas con cerezas para bebés. Fresco y muy dulce, ideal para los días de verano.', 'active', 'consult', false, false, false, null, '{"rayas","cerezas","bebé"}', now()),
  ('prod-024', 18, 'LK-024', 'rompers-florales-modelo-2', 'Rompers Florales Modelo 2', 'Romper', 'Romper floral para bebés en diseño diferente. Estampado alegre con flores y tela suave al tacto.', 'active', 'consult', false, false, false, null, '{"romper","floral","bebé"}', now()),
  ('prod-025', 19, 'LK-025', 'overol-denim-con-camiseta-bebe', 'Overol Denim con Camiseta Bebé', 'Overol', 'Overol de denim para bebés con camiseta a juego. Tierno y muy cómodo para los más chiquitos.', 'active', 'consult', false, false, false, null, '{"overol","denim","bebé"}', now()),
  ('prod-026', 20, 'LK-026', 'overol-denim-con-camiseta-infantil', 'Overol Denim con Camiseta Infantil', 'Overol', 'Overol de denim para bebés mayores con camiseta incluida. Estilo casual perfecto para explorar el mundo.', 'active', 'consult', false, false, false, null, '{"overol","denim","bebé"}', now()),
  ('prod-027', 21, 'LK-027', 'sets-tejidos-de-verano', 'Sets Tejidos de Verano', 'Set', 'Sets tejidos para bebés perfectos para el verano. Frescos y lindos para los días cálidos.', 'active', 'consult', false, false, false, null, '{"tejido","verano","bebé"}', now()),
  ('prod-028', 22, 'LK-028', 'conjunto-waffle-marron', 'Conjunto Waffle Marrón', 'Conjunto', 'Conjunto de tela waffle en color marrón para bebés. Suave, cálido y muy elegante para el día a día.', 'active', 'consult', false, false, false, null, '{"waffle","marrón","bebé"}', now()),
  ('prod-029', 23, 'LK-029', 'conjunto-waffle-verde', 'Conjunto Waffle Verde', 'Conjunto', 'Conjunto de tela waffle en color verde para bebés. Fresco, suave y muy tierno para los pequeños.', 'active', 'consult', false, false, false, null, '{"waffle","verde","bebé"}', now()),
  ('prod-030', 24, 'LK-030', 'conjunto-animalitos', 'Conjunto Animalitos', 'Conjunto', 'Conjunto con estampado de animalitos para bebés. Divertido y adorable para los pequeños exploradores.', 'active', 'consult', false, false, false, null, '{"animalitos","bebé","estampado"}', now()),
  ('prod-031', 25, 'LK-031', 'conjuntos-basicos-osito', 'Conjuntos Básicos Osito', 'Conjunto', 'Conjuntos básicos con estampado de osito para bebés. Suaves, cálidos y perfectos para estar en casa.', 'active', 'consult', false, false, false, null, '{"osito","básico","bebé"}', now()),
  ('prod-032', 26, 'LK-032', 'conjunto-mamas-boy', 'Conjunto Mama', 'Conjunto', 'Conjunto con la leyenda ', 'active', 'consult', false, false, false, null, '{"mama","bebé","niño"}', now()),
  ('prod-033', 28, 'LK-033', 'vestido-de-lunares-blanco-y-negro', 'Vestido de Lunares Blanco y Negro', 'Vestido', 'Vestido de lunares en blanco y negro para bebés. Clásico y muy elegante para momentos especiales.', 'active', 'consult', false, false, false, null, '{"lunares","vestido","bebé"}', now()),
  ('prod-034', 30, 'LK-034', 'medias-altas-con-lazo', 'Medias Altas con Lazo', 'Medias', 'Medias altas con lazo decorativo para bebés. Precio por par. Muy lindas y cálidas para los pies de los más pequeños.', 'active', 'consult', false, false, false, null, '{"medias","lazo","bebé"}', now()),
  ('prod-035', 31, 'LK-035', 'set-floral-naranja', 'Set Floral Naranja', 'Set', 'Set floral en tones naranja para niñas. Alegre, fresco y perfecto para el verano.', 'active', 'consult', false, false, false, null, '{"floral","naranja","niñas"}', now()),
  ('prod-036', 33, 'LK-036', 'set-sunset-studios', 'Set Sunset Studios', 'Set', 'Set con diseño Sunset Studios para niños mayores. Estilo juvenil y cómodo para el día a día.', 'active', 'consult', false, false, false, null, '{"sunset","niños","juvenil"}', now()),
  ('prod-037', 34, 'LK-037', 'set-capri-italy', 'Set Capri Italy', 'Set', 'Set con diseño Capri Italy para niños. Estilo italiano relajado, ideal para paseos y tiempo libre.', 'active', 'consult', false, false, false, null, '{"capri","italy","niños"}', now()),
  ('prod-038', 35, 'LK-038', 'conjunto-tie-dye', 'Conjunto Tie-Dye', 'Conjunto', 'Conjunto tie-dye para niños. Vibrante y único, perfecto para niños que quieren destacar con estilo.', 'active', 'consult', false, true, true, null, '{"tie-dye","niños","colorido"}', now()),
  ('prod-039', 36, 'LK-039', 'set-polo-oakland-celeste', 'Set Polo Oakland Celeste', 'Set', 'Set estilo preppy con polo en celeste y bermuda a juego. Versátil y muy bien combinado para niños.', 'active', 'consult', false, false, false, null, '{"polo","celeste","niños"}', now()),
  ('prod-040', 38, 'LK-040', 'hoodie-blanco-jogger-gris', 'Hoodie Blanco + Jogger Gris', 'Hoodie', 'Hoodie blanco con jogger gris para niños. Cómodo, abrigado y muy a la moda para los días frescos.', 'active', 'consult', false, false, false, null, '{"hoodie","jogger","niños"}', now()),
  ('prod-041', 39, 'LK-041', 'hoodie-crema-jogger-vino', 'Hoodie Crema + Jogger Vino', 'Hoodie', 'Hoodie crema con jogger vino para niños. Combinación elegante y cálida para el otoño.', 'active', 'consult', false, false, false, null, '{"hoodie","jogger","niños"}', now()),
  ('prod-042', 40, 'LK-042', 'set-camiseta-pantalon-verde', 'Set Camiseta + Pantalón Verde', 'Set', 'Set de camiseta con pantalón en verde para niños. Fresco y muy cómodo para el verano.', 'active', 'consult', false, false, false, null, '{"camiseta","pantalón","niños"}', now()),
  ('prod-043', 41, 'LK-043', 'vestido-camiseta-parches-crema', 'Vestido Camiseta Parches Crema', 'Vestido', 'Vestido tipo camiseta en crema con parches bordados. Dulce y sofisticado para niñas con estilo propio.', 'active', 'consult', false, true, false, null, '{"vestido","parches","niñas"}', now()),
  ('prod-044', 42, 'LK-044', 'set-beach-vibes-rosa', 'Set Beach Vibes Rosa', 'Set', 'Set Beach Vibes en rosa para niñas. Alegre y veraniego, perfecto para ir a la playa o al parque.', 'active', 'consult', false, false, true, null, '{"beach","verano","niñas"}', now()),
  ('prod-045', 45, 'LK-045', 'set-amore-gris', 'Set AMORE Gris', 'Set', 'Set especial con la inscripción ', 'active', 'consult', false, false, false, null, '{"amore","niñas","regalo"}', now()),
  ('prod-046', 46, 'LK-046', 'sets-waffle-oso-dinosaurio', 'Sets Waffle Oso Dinosaurio', 'Set', 'Set de tela waffle con bordado de oso o dinosaurio para bebés. Suave, abrigado y muy tierno.', 'active', 'consult', false, false, true, null, '{"waffle","oso","dinosaurio","bebé"}', now());

-- ── Product → Category links ─────────────────────────────────
insert into product_categories (product_id, category_id)
select p.id, c.id from products p, categories c where
  (  (p.sku = 'LK-001' and c.slug = 'bebes')
  or   (p.sku = 'LK-002' and c.slug = 'bebes')
  or   (p.sku = 'LK-003' and c.slug = 'bebes')
  or   (p.sku = 'LK-004' and c.slug = 'bebes')
  or   (p.sku = 'LK-005' and c.slug = 'bebes')
  or   (p.sku = 'LK-006' and c.slug = 'bebes')
  or   (p.sku = 'LK-007' and c.slug = 'bebes')
  or   (p.sku = 'LK-008' and c.slug = 'bebes')
  or   (p.sku = 'LK-009' and c.slug = 'ninas')
  or   (p.sku = 'LK-010' and c.slug = 'ninos')
  or   (p.sku = 'LK-011' and c.slug = 'ninas')
  or   (p.sku = 'LK-012' and c.slug = 'ninas')
  or   (p.sku = 'LK-013' and c.slug = 'bebes')
  or   (p.sku = 'LK-014' and c.slug = 'bebes')
  or   (p.sku = 'LK-015' and c.slug = 'bebes')
  or   (p.sku = 'LK-016' and c.slug = 'bebes')
  or   (p.sku = 'LK-017' and c.slug = 'bebes')
  or   (p.sku = 'LK-018' and c.slug = 'bebes')
  or   (p.sku = 'LK-019' and c.slug = 'bebes')
  or   (p.sku = 'LK-020' and c.slug = 'bebes')
  or   (p.sku = 'LK-021' and c.slug = 'bebes')
  or   (p.sku = 'LK-022' and c.slug = 'bebes')
  or   (p.sku = 'LK-023' and c.slug = 'bebes')
  or   (p.sku = 'LK-024' and c.slug = 'bebes')
  or   (p.sku = 'LK-025' and c.slug = 'bebes')
  or   (p.sku = 'LK-026' and c.slug = 'bebes')
  or   (p.sku = 'LK-027' and c.slug = 'bebes')
  or   (p.sku = 'LK-028' and c.slug = 'bebes')
  or   (p.sku = 'LK-029' and c.slug = 'bebes')
  or   (p.sku = 'LK-030' and c.slug = 'bebes')
  or   (p.sku = 'LK-031' and c.slug = 'bebes')
  or   (p.sku = 'LK-032' and c.slug = 'bebes')
  or   (p.sku = 'LK-033' and c.slug = 'bebes')
  or   (p.sku = 'LK-034' and c.slug = 'bebes')
  or   (p.sku = 'LK-035' and c.slug = 'ninas')
  or   (p.sku = 'LK-036' and c.slug = 'ninos')
  or   (p.sku = 'LK-037' and c.slug = 'ninos')
  or   (p.sku = 'LK-038' and c.slug = 'ninos')
  or   (p.sku = 'LK-039' and c.slug = 'ninos')
  or   (p.sku = 'LK-040' and c.slug = 'ninos')
  or   (p.sku = 'LK-041' and c.slug = 'ninos')
  or   (p.sku = 'LK-042' and c.slug = 'ninos')
  or   (p.sku = 'LK-043' and c.slug = 'ninas')
  or   (p.sku = 'LK-044' and c.slug = 'ninas')
  or   (p.sku = 'LK-045' and c.slug = 'ninas')
  or   (p.sku = 'LK-046' and c.slug = 'bebes'));

-- ── Purchase Options ─────────────────────────────────────────
insert into product_purchase_options (product_id, label, price, unit_description, active, sort_order)
values
  ((select id from products where sku='LK-003'), 'Una unidad', 8, 'c/u', true, 0),
  ((select id from products where sku='LK-003'), 'Set completo', 35, 'set', true, 1),
  ((select id from products where sku='LK-005'), 'Una unidad', 8, 'c/u', true, 0),
  ((select id from products where sku='LK-005'), 'Set completo', 35, 'set', true, 1),
  ((select id from products where sku='LK-014'), 'Un par', 3, 'par', true, 0),
  ((select id from products where sku='LK-014'), 'Cinco pares', 8, 'set de 5', true, 1),
  ((select id from products where sku='LK-015'), 'Un par', 3, 'par', true, 0),
  ((select id from products where sku='LK-015'), 'Cinco pares', 8, 'set de 5', true, 1),
  ((select id from products where sku='LK-016'), 'Un par', 3, 'par', true, 0),
  ((select id from products where sku='LK-016'), 'Cinco pares', 8, 'set de 5', true, 1);

-- ── Product Variants ─────────────────────────────────────────
insert into product_variants (product_id, purchase_option_id, size, color, active)
values
  ((select id from products where sku='LK-001'), null, '2 años', null, true),
  ((select id from products where sku='LK-002'), null, '6-9 meses', null, true),
  ((select id from products where sku='LK-003'), null, '9-12 meses', null, true),
  ((select id from products where sku='LK-004'), null, '2-3 años', null, true),
  ((select id from products where sku='LK-005'), null, '3-6 meses', null, true),
  ((select id from products where sku='LK-006'), null, '9-12 meses', null, true),
  ((select id from products where sku='LK-007'), null, '9-12 meses', null, true),
  ((select id from products where sku='LK-008'), null, '6-9 meses', null, true),
  ((select id from products where sku='LK-009'), null, '4 años', null, true),
  ((select id from products where sku='LK-010'), null, '5 años', null, true),
  ((select id from products where sku='LK-011'), null, '8 años', null, true),
  ((select id from products where sku='LK-012'), null, '5 años', null, true),
  ((select id from products where sku='LK-013'), null, '1-2 años', null, true),
  ((select id from products where sku='LK-014'), null, '1-3 años', null, true),
  ((select id from products where sku='LK-015'), null, '2-3 años', null, true),
  ((select id from products where sku='LK-016'), null, '2-3 años', null, true),
  ((select id from products where sku='LK-017'), null, '9-12 meses', null, true),
  ((select id from products where sku='LK-018'), null, '9-12 meses', null, true),
  ((select id from products where sku='LK-019'), null, '4 años', null, true),
  ((select id from products where sku='LK-020'), null, '9-13 meses', null, true),
  ((select id from products where sku='LK-021'), null, '9-12 meses', null, true),
  ((select id from products where sku='LK-022'), null, '6-9 meses', null, true),
  ((select id from products where sku='LK-023'), null, '6-9 meses', null, true),
  ((select id from products where sku='LK-024'), null, '6-9 meses', null, true),
  ((select id from products where sku='LK-025'), null, '6-9 meses', null, true),
  ((select id from products where sku='LK-026'), null, '2-3 años', null, true),
  ((select id from products where sku='LK-027'), null, '9-12 meses', null, true),
  ((select id from products where sku='LK-028'), null, '9-12 meses', null, true),
  ((select id from products where sku='LK-029'), null, '6-9 meses', null, true),
  ((select id from products where sku='LK-030'), null, '6-9 meses', null, true),
  ((select id from products where sku='LK-031'), null, '9-12 meses', null, true),
  ((select id from products where sku='LK-032'), null, '12-18 meses', null, true),
  ((select id from products where sku='LK-033'), null, '9-12 meses', null, true),
  ((select id from products where sku='LK-034'), null, '1-2 años', null, true),
  ((select id from products where sku='LK-035'), null, '5 años', null, true),
  ((select id from products where sku='LK-036'), null, '8 años', null, true),
  ((select id from products where sku='LK-037'), null, '5 años', null, true),
  ((select id from products where sku='LK-038'), null, '6 años', null, true),
  ((select id from products where sku='LK-039'), null, '5 años', null, true),
  ((select id from products where sku='LK-040'), null, '6 años', null, true),
  ((select id from products where sku='LK-041'), null, '4 años', null, true),
  ((select id from products where sku='LK-042'), null, '4 años', null, true),
  ((select id from products where sku='LK-043'), null, '8 años', null, true),
  ((select id from products where sku='LK-044'), null, '5 años', null, true),
  ((select id from products where sku='LK-045'), null, '6 años', null, true),
  ((select id from products where sku='LK-046'), null, '9-12 meses', null, true);

-- ── Product Images ───────────────────────────────────────────
insert into product_images (product_id, storage_path, alt_text, position, is_primary)
values
  ((select id from products where sku='LK-001'), '/images/products/luale-001-chaqueta-denim-con-parches.webp', 'Chaqueta Denim con Parches de Luale Kids Shop', 0, true),
  ((select id from products where sku='LK-002'), '/images/products/luale-002-set-3-piezas-leon.webp', 'Set 3 Piezas León de Luale Kids Shop', 0, true),
  ((select id from products where sku='LK-003'), '/images/products/luale-003-pantalones-jogger-con-lazo.webp', 'Pantalones Jogger con Lazo de Luale Kids Shop', 0, true),
  ((select id from products where sku='LK-004'), '/images/products/luale-004-joggers-cargo-estampados.webp', 'Joggers Cargo Estampados de Luale Kids Shop', 0, true),
  ((select id from products where sku='LK-005'), '/images/products/luale-005-set-leggings-basicos.webp', 'Set Leggings Básicos de Luale Kids Shop', 0, true),
  ((select id from products where sku='LK-006'), '/images/products/luale-010-pijamas-enterizas-estampadas.webp', 'Pijamas Enterizas Estampadas de Luale Kids Shop', 0, true),
  ((select id from products where sku='LK-007'), '/images/products/luale-027-vestido-polo-rosa.webp', 'Vestido Polo Rosa de Luale Kids Shop', 0, true),
  ((select id from products where sku='LK-008'), '/images/products/luale-029-conjunto-deportivo-oliva.webp', 'Conjunto Deportivo Oliva de Luale Kids Shop', 0, true),
  ((select id from products where sku='LK-009'), '/images/products/luale-032-set-floral-rosa.webp', 'Set Floral Rosa de Luale Kids Shop', 0, true),
  ((select id from products where sku='LK-010'), '/images/products/luale-037-set-polo-oakland-azul.webp', 'Set Polo Oakland Azul de Luale Kids Shop', 0, true),
  ((select id from products where sku='LK-011'), '/images/products/luale-043-vestido-camiseta-parches-fucsia.webp', 'Vestido Camiseta Parches Fucsia de Luale Kids Shop', 0, true),
  ((select id from products where sku='LK-012'), '/images/products/luale-044-set-amore-coral.webp', 'Set AMORE Coral de Luale Kids Shop', 0, true),
  ((select id from products where sku='LK-013'), '/images/products/luale-006-medias-con-olan-tonos-neutros.webp', 'Medias con Olán Tonos Neutros de Luale Kids Shop', 0, true),
  ((select id from products where sku='LK-014'), '/images/products/luale-007-medias-con-lazo-colores-pastel.webp', 'Medias con Lazo Colores Pastel de Luale Kids Shop', 0, true),
  ((select id from products where sku='LK-015'), '/images/products/luale-008-medias-basicas.webp', 'Medias Básicas de Luale Kids Shop', 0, true),
  ((select id from products where sku='LK-016'), '/images/products/luale-009-medias-smile-tonos-neutros.webp', 'Medias Smile Tonos Neutros de Luale Kids Shop', 0, true),
  ((select id from products where sku='LK-017'), '/images/products/luale-011-pijamas-2-piezas-dulces.webp', 'Pijamas 2 Piezas Dulces de Luale Kids Shop', 0, true),
  ((select id from products where sku='LK-018'), '/images/products/luale-012-pijamas-enterizas-transportes.webp', 'Pijamas Enterizas Transportes de Luale Kids Shop', 0, true),
  ((select id from products where sku='LK-019'), '/images/products/luale-013-pijamas-2-piezas-dinosaurios.webp', 'Pijamas 2 Piezas Dinosaurios de Luale Kids Shop', 0, true),
  ((select id from products where sku='LK-020'), '/images/products/luale-014-sets-leggings-blanco-y-negro.webp', 'Sets Leggings Blanco y Negro de Luale Kids Shop', 0, true),
  ((select id from products where sku='LK-021'), '/images/products/luale-015-vestido-gris-con-blusa.webp', 'Vestido Gris con Blusa de Luale Kids Shop', 0, true),
  ((select id from products where sku='LK-022'), '/images/products/luale-016-rompers-florales-modelo-1.webp', 'Rompers Florales Modelo 1 de Luale Kids Shop', 0, true),
  ((select id from products where sku='LK-023'), '/images/products/luale-017-set-rayas-con-cerezas.webp', 'Set Rayas con Cerezas de Luale Kids Shop', 0, true),
  ((select id from products where sku='LK-024'), '/images/products/luale-018-rompers-florales-modelo-2.webp', 'Rompers Florales Modelo 2 de Luale Kids Shop', 0, true),
  ((select id from products where sku='LK-025'), '/images/products/luale-019-overol-denim-con-camiseta-bebe.webp', 'Overol Denim con Camiseta Bebé de Luale Kids Shop', 0, true),
  ((select id from products where sku='LK-026'), '/images/products/luale-020-overol-denim-con-camiseta-infantil.webp', 'Overol Denim con Camiseta Infantil de Luale Kids Shop', 0, true),
  ((select id from products where sku='LK-027'), '/images/products/luale-021-sets-tejidos-de-verano.webp', 'Sets Tejidos de Verano de Luale Kids Shop', 0, true),
  ((select id from products where sku='LK-028'), '/images/products/luale-022-conjunto-waffle-marron.webp', 'Conjunto Waffle Marrón de Luale Kids Shop', 0, true),
  ((select id from products where sku='LK-029'), '/images/products/luale-023-conjunto-waffle-verde.webp', 'Conjunto Waffle Verde de Luale Kids Shop', 0, true),
  ((select id from products where sku='LK-030'), '/images/products/luale-024-conjunto-animalitos.webp', 'Conjunto Animalitos de Luale Kids Shop', 0, true),
  ((select id from products where sku='LK-031'), '/images/products/luale-025-conjuntos-basicos-osito.webp', 'Conjuntos Básicos Osito de Luale Kids Shop', 0, true),
  ((select id from products where sku='LK-032'), '/images/products/luale-026-conjunto-mama.webp', 'Conjunto Mama de Luale Kids Shop', 0, true),
  ((select id from products where sku='LK-033'), '/images/products/luale-028-vestido-de-lunares-blanco-y-negro.webp', 'Vestido de Lunares Blanco y Negro de Luale Kids Shop', 0, true),
  ((select id from products where sku='LK-034'), '/images/products/luale-030-medias-altas-con-lazo.webp', 'Medias Altas con Lazo de Luale Kids Shop', 0, true),
  ((select id from products where sku='LK-035'), '/images/products/luale-031-set-floral-naranja.webp', 'Set Floral Naranja de Luale Kids Shop', 0, true),
  ((select id from products where sku='LK-036'), '/images/products/luale-033-set-sunset-studios.webp', 'Set Sunset Studios de Luale Kids Shop', 0, true),
  ((select id from products where sku='LK-037'), '/images/products/luale-034-set-capri-italy.webp', 'Set Capri Italy de Luale Kids Shop', 0, true),
  ((select id from products where sku='LK-038'), '/images/products/luale-035-conjunto-tie-dye.webp', 'Conjunto Tie-Dye de Luale Kids Shop', 0, true),
  ((select id from products where sku='LK-039'), '/images/products/luale-036-set-polo-oakland-celeste.webp', 'Set Polo Oakland Celeste de Luale Kids Shop', 0, true),
  ((select id from products where sku='LK-040'), '/images/products/luale-038-hoodie-blanco-jogger-gris.webp', 'Hoodie Blanco + Jogger Gris de Luale Kids Shop', 0, true),
  ((select id from products where sku='LK-041'), '/images/products/luale-039-hoodie-crema-jogger-vino.webp', 'Hoodie Crema + Jogger Vino de Luale Kids Shop', 0, true),
  ((select id from products where sku='LK-042'), '/images/products/luale-040-set-camiseta-pantalon-verde.webp', 'Set Camiseta + Pantalón Verde de Luale Kids Shop', 0, true),
  ((select id from products where sku='LK-043'), '/images/products/luale-041-vestido-camiseta-parches-crema.webp', 'Vestido Camiseta Parches Crema de Luale Kids Shop', 0, true),
  ((select id from products where sku='LK-044'), '/images/products/luale-042-set-beach-vibes-rosa.webp', 'Set Beach Vibes Rosa de Luale Kids Shop', 0, true),
  ((select id from products where sku='LK-045'), '/images/products/luale-045-set-amore-gris.webp', 'Set AMORE Gris de Luale Kids Shop', 0, true),
  ((select id from products where sku='LK-046'), '/images/products/luale-046-sets-waffle-oso-dinosaurio.webp', 'Sets Waffle Oso Dinosaurio de Luale Kids Shop', 0, true);