-- Adjust created_at to reflect Hong Kong time (UTC+8) so displayed times are 16:28, 17:04, 16:44, 18:10 in HK
-- Mapping HK→UTC: 16:28→08:28, 17:04→09:04, 16:44→08:44, 18:10→10:10

UPDATE orders SET created_at = '2025-10-23 09:04:00+00' WHERE order_number = 'ORD1729641600001'; -- shows 17:04 HK
UPDATE orders SET created_at = '2025-10-23 08:44:00+00' WHERE order_number = 'ORD1729641600002'; -- shows 16:44 HK
UPDATE orders SET created_at = '2025-10-23 10:10:00+00' WHERE order_number = 'ORD1729641600003'; -- shows 18:10 HK
UPDATE orders SET created_at = '2025-10-23 08:28:00+00' WHERE order_number = 'ORD1729641600004'; -- shows 16:28 HK
UPDATE orders SET created_at = '2025-10-23 10:10:00+00' WHERE order_number = 'ORD1729641600005'; -- shows 18:10 HK
UPDATE orders SET created_at = '2025-10-23 08:44:00+00' WHERE order_number = 'ORD1729641600006'; -- shows 16:44 HK
UPDATE orders SET created_at = '2025-10-23 09:04:00+00' WHERE order_number = 'ORD1729641600007'; -- shows 17:04 HK
UPDATE orders SET created_at = '2025-10-23 08:28:00+00' WHERE order_number = 'ORD1729641600008'; -- shows 16:28 HK