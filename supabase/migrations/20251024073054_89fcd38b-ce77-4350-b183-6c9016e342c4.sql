-- Remove mistakenly created 9th order and its items
DELETE FROM order_items WHERE order_id = (SELECT id FROM orders WHERE order_number = 'ORD1729641600009');
DELETE FROM orders WHERE order_number = 'ORD1729641600009';