-- Demo data. Only loaded with the "demo" profile (see application-demo.yml).
-- Every user's password is: demo1234
-- Brands and companies are fictional.

INSERT INTO app_user (id, email, password_hash, full_name, role, customer_id) VALUES
    (1, 'admin@example.com',           '$2a$10$CXT20XXO98D1n8OeVTOW9u2HB8yWB..QgWQcyzQ62chuOC2xC/sr2', 'Laura Gómez',   'ADMIN', NULL),
    (2, 'marcos.comercial@example.com', '$2a$10$CXT20XXO98D1n8OeVTOW9u2HB8yWB..QgWQcyzQ62chuOC2xC/sr2', 'Marcos Ruiz',   'SALES', NULL),
    (3, 'irene.comercial@example.com',  '$2a$10$CXT20XXO98D1n8OeVTOW9u2HB8yWB..QgWQcyzQ62chuOC2xC/sr2', 'Irene Sánchez', 'SALES', NULL);

INSERT INTO customer (id, name, tax_id, email, phone, city, sales_rep_id) VALUES
    (1, 'Móviles del Cantábrico S.L.', 'B00000001', 'pedidos@moviles-cantabrico.example', '942000001', 'Santander',         2),
    (2, 'Accesorios Bizkaia S.L.',     'B00000002', 'compras@accesorios-bizkaia.example', '944000002', 'Bilbao',            2),
    (3, 'TecnoVera Distribución S.L.', 'B00000003', 'pedidos@tecnovera.example',          '927000003', 'Jaraíz de la Vera', 3),
    (4, 'Plaza Mayor Phone S.L.',      'B00000004', 'compras@plazamayorphone.example',    '923000004', 'Salamanca',         3);

INSERT INTO app_user (id, email, password_hash, full_name, role, customer_id) VALUES
    (4, 'cliente.cantabrico@example.com', '$2a$10$CXT20XXO98D1n8OeVTOW9u2HB8yWB..QgWQcyzQ62chuOC2xC/sr2', 'Pablo Herrera', 'CUSTOMER', 1),
    (5, 'cliente.vera@example.com',       '$2a$10$CXT20XXO98D1n8OeVTOW9u2HB8yWB..QgWQcyzQ62chuOC2xC/sr2', 'Nuria Castro',  'CUSTOMER', 3);

INSERT INTO brand (id, name, royalty_rate) VALUES
    (1, 'Kraken Sports', 12.00),
    (2, 'Aurora Studio',  8.50),
    (3, 'Pixel Pals',    10.00),
    (4, 'Bosque Design',  6.00);

INSERT INTO product (id, sku, name, brand_id, unit_price, stock) VALUES
    (1,  'KRK-CAS-IP17', 'Carcasa Kraken Sports iPhone 17',          1,  9.90, 240),
    (2,  'KRK-CAS-S25',  'Carcasa Kraken Sports Galaxy S25',         1,  9.90, 180),
    (3,  'KRK-FUN-UNI',  'Funda deportiva universal Kraken Sports',  1, 12.50,  90),
    (4,  'AUR-CAS-IP17', 'Carcasa Aurora Studio iPhone 17',          2, 11.00, 150),
    (5,  'AUR-CAS-S25',  'Carcasa Aurora Studio Galaxy S25',         2, 11.00, 120),
    (6,  'AUR-SOP-ADH',  'Soporte adhesivo Aurora Studio',           2,  4.20, 500),
    (7,  'PXP-CAS-IP17', 'Carcasa Pixel Pals iPhone 17',             3,  8.50, 300),
    (8,  'PXP-CAS-A56',  'Carcasa Pixel Pals Galaxy A56',            3,  8.50, 260),
    (9,  'PXP-CAR-USB',  'Cargador USB-C 20 W Pixel Pals',           3,  7.90, 200),
    (10, 'BSQ-CAS-IP17', 'Carcasa de madera Bosque Design iPhone 17', 4, 14.00,  60),
    (11, 'BSQ-FUN-LIB',  'Funda libro Bosque Design',                4, 15.50,  40),
    (12, 'BSQ-PRO-CRI',  'Protector de pantalla de cristal Bosque',  4,  3.10,   0);

INSERT INTO license (id, customer_id, brand_id, start_date, end_date) VALUES
    (1, 1, 1, '2026-01-01', '2028-12-31'),
    (2, 1, 2, '2026-01-01', '2028-12-31'),
    (3, 1, 3, '2025-01-01', '2025-12-31'), -- expired
    (4, 2, 1, '2026-03-01', '2028-12-31'),
    (5, 2, 4, '2026-03-01', '2028-12-31'),
    (6, 3, 2, '2025-06-01', '2028-12-31'),
    (7, 3, 3, '2025-06-01', '2028-12-31'),
    (8, 3, 4, '2026-01-01', '2028-12-31'),
    (9, 4, 1, '2029-01-01', '2029-12-31'); -- not started yet

INSERT INTO orders (id, customer_id, created_by, status, total, created_at, confirmed_at, updated_at) VALUES
    (1, 1, 4, 'DELIVERED',  825.00, '2026-07-09 10:00+02', '2026-07-10 09:30+02', '2026-07-14 12:00+02'),
    (2, 1, 2, 'SHIPPED',    816.00, '2026-09-14 16:20+02', '2026-09-15 08:45+02', '2026-09-17 11:10+02'),
    (3, 2, 2, 'CONFIRMED',  390.00, '2026-10-05 09:00+02', '2026-10-05 09:05+02', '2026-10-05 09:05+02'),
    (4, 3, 5, 'DRAFT',      510.00, '2026-10-20 18:30+02', NULL,                  '2026-10-20 18:30+02'),
    (5, 3, 3, 'CANCELLED',   77.50, '2026-08-01 12:00+02', NULL,                  '2026-08-02 09:00+02'),
    (6, 3, 3, 'DELIVERED', 1295.00, '2026-08-19 11:00+02', '2026-08-20 10:00+02', '2026-08-25 13:00+02');

INSERT INTO order_line (order_id, product_id, quantity, unit_price, line_total) VALUES
    (1, 1,  50,  9.90, 495.00),
    (1, 4,  30, 11.00, 330.00),
    (2, 2,  40,  9.90, 396.00),
    (2, 6, 100,  4.20, 420.00),
    (3, 3,  20, 12.50, 250.00),
    (3, 10, 10, 14.00, 140.00),
    (4, 7,  60,  8.50, 510.00),
    (5, 11,  5, 15.50,  77.50),
    (6, 7,  80,  8.50, 680.00),
    (6, 9,  50,  7.90, 395.00),
    (6, 5,  20, 11.00, 220.00);

-- Explicit ids were used above, so move each sequence past them.
SELECT setval('app_user_id_seq', (SELECT max(id) FROM app_user));
SELECT setval('customer_id_seq', (SELECT max(id) FROM customer));
SELECT setval('brand_id_seq',    (SELECT max(id) FROM brand));
SELECT setval('product_id_seq',  (SELECT max(id) FROM product));
SELECT setval('license_id_seq',  (SELECT max(id) FROM license));
SELECT setval('orders_id_seq',   (SELECT max(id) FROM orders));
