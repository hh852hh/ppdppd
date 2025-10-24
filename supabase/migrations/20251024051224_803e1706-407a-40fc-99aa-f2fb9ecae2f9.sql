
-- Update order amounts to be in cents (multiply by 100) and update order items prices
UPDATE orders SET total_amount = 1950000 WHERE order_number = 'ORD1729641600001';
UPDATE orders SET total_amount = 2000000 WHERE order_number = 'ORD1729641600002';
UPDATE orders SET total_amount = 1950000 WHERE order_number = 'ORD1729641600003';
UPDATE orders SET total_amount = 949800 WHERE order_number = 'ORD1729641600004';
UPDATE orders SET total_amount = 2000000 WHERE order_number = 'ORD1729641600005';
UPDATE orders SET total_amount = 1999400 WHERE order_number = 'ORD1729641600006';
UPDATE orders SET total_amount = 1990000 WHERE order_number = 'ORD1729641600007';
UPDATE orders SET total_amount = 1970000 WHERE order_number = 'ORD1729641600008';

-- Update order items prices to match (multiply by 100)
UPDATE order_items SET price_at_time = 1950000 WHERE order_id = '514d0f52-b678-48d2-91ff-748d54710c6c';
UPDATE order_items SET price_at_time = 2000000 WHERE order_id = 'b49bae29-b823-424d-957b-b05c4eba2aca';
UPDATE order_items SET price_at_time = 1950000 WHERE order_id = 'b47ca160-476d-486c-beb9-6964ec30c073';
UPDATE order_items SET price_at_time = 949800 WHERE order_id = '81e3a8ad-2af0-47b4-951d-9129a5ab9a74';
UPDATE order_items SET price_at_time = 2000000 WHERE order_id = 'ca2235c4-eb44-4314-887f-c673aeb20945';
UPDATE order_items SET price_at_time = 1999400 WHERE order_id = '58ced3bc-d691-4fcb-9121-96f82c0ec524';
UPDATE order_items SET price_at_time = 1990000 WHERE order_id = '40c7a021-c9ad-4dde-965a-fdf9f41fcb9d';
UPDATE order_items SET price_at_time = 1970000 WHERE order_id = '31f0383f-d865-4ce1-a7b1-f5164ad9ccb2';
