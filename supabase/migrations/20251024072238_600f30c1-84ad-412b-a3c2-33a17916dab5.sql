-- Update orders to match transaction data from image
-- Times are in Hong Kong time (UTC+8), so converting to UTC for database storage
-- Format: HK time → UTC time, Amount in cents

UPDATE orders SET 
  created_at = '2025-10-22 12:19:00+00',
  total_amount = 20000
WHERE order_number = 'ORD1729641600001';

UPDATE orders SET 
  created_at = '2025-10-23 08:27:00+00',
  total_amount = 20000
WHERE order_number = 'ORD1729641600002';

UPDATE orders SET 
  created_at = '2025-10-23 08:28:00+00',
  total_amount = 19500
WHERE order_number = 'ORD1729641600003';

UPDATE orders SET 
  created_at = '2025-10-23 08:42:00+00',
  total_amount = 19500
WHERE order_number = 'ORD1729641600004';

UPDATE orders SET 
  created_at = '2025-10-23 08:44:00+00',
  total_amount = 9498
WHERE order_number = 'ORD1729641600005';

UPDATE orders SET 
  created_at = '2025-10-23 09:04:00+00',
  total_amount = 20000
WHERE order_number = 'ORD1729641600006';

UPDATE orders SET 
  created_at = '2025-10-23 09:05:00+00',
  total_amount = 19994
WHERE order_number = 'ORD1729641600007';

UPDATE orders SET 
  created_at = '2025-10-23 10:08:00+00',
  total_amount = 19900
WHERE order_number = 'ORD1729641600008';