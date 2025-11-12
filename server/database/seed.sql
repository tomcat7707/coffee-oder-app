-- Menu data insertion
INSERT INTO menus (name, description, price, image_url, stock) VALUES
('Americano (ICE)', 'Cool and clean iced Americano', 4000, 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735', 20),
('Americano (HOT)', 'Warm and strong hot Americano', 4000, 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd', 20),
('Cafe Latte', 'Harmony of soft milk and espresso', 5000, 'https://images.unsplash.com/photo-1561882468-9110e03e0f78', 15);

-- Option data insertion
-- Americano (ICE) options
INSERT INTO options (menu_id, name, price) VALUES
(1, 'Extra Shot', 500),
(1, 'Add Syrup', 500);

-- Americano (HOT) options
INSERT INTO options (menu_id, name, price) VALUES
(2, 'Extra Shot', 500),
(2, 'Add Syrup', 500);

-- Cafe Latte options
INSERT INTO options (menu_id, name, price) VALUES
(3, 'Extra Shot', 500),
(3, 'Vanilla Syrup', 500),
(3, 'Hazelnut Syrup', 500);

-- Test order data (optional)
INSERT INTO orders (total_amount, status) VALUES
(4000, 'received');

INSERT INTO order_items (order_id, menu_id, quantity, price) VALUES
(1, 1, 1, 4000);

-- Stock reduction for test order
UPDATE menus SET stock = stock - 1 WHERE menu_id = 1;

-- Completion message
SELECT 'Seed data inserted successfully!' as message;
SELECT 
  (SELECT COUNT(*) FROM menus) as menus_count,
  (SELECT COUNT(*) FROM options) as options_count,
  (SELECT COUNT(*) FROM orders) as orders_count;
