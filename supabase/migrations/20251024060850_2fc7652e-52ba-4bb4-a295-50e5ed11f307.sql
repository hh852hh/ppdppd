-- Randomly distribute the 4 times across 8 orders
UPDATE orders SET created_at = '2025-10-23 17:04:00+00' WHERE order_number = 'ORD1729641600001';
UPDATE orders SET created_at = '2025-10-23 16:44:00+00' WHERE order_number = 'ORD1729641600002';
UPDATE orders SET created_at = '2025-10-23 18:10:00+00' WHERE order_number = 'ORD1729641600003';
UPDATE orders SET created_at = '2025-10-23 16:28:00+00' WHERE order_number = 'ORD1729641600004';
UPDATE orders SET created_at = '2025-10-23 18:10:00+00' WHERE order_number = 'ORD1729641600005';
UPDATE orders SET created_at = '2025-10-23 16:44:00+00' WHERE order_number = 'ORD1729641600006';
UPDATE orders SET created_at = '2025-10-23 17:04:00+00' WHERE order_number = 'ORD1729641600007';
UPDATE orders SET created_at = '2025-10-23 16:28:00+00' WHERE order_number = 'ORD1729641600008';