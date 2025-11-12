-- Menu data insertion (temporary English data - will be updated to Korean via API)
-- Encoding: UTF-8
INSERT INTO menus (name, description, price, image_url, stock) VALUES
(E'아메리카노 (ICE)', E'시원하고 깔끔한 아이스 아메리카노', 4000, 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735', 20),
(E'아메리카노 (HOT)', E'따뜻하고 진한 핫 아메리카노', 4000, 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd', 20),
(E'카페라떼', E'부드러운 우유와 에스프레소의 조화', 5000, 'https://images.unsplash.com/photo-1561882468-9110e03e0f78', 15);

-- Option data insertion
INSERT INTO options (menu_id, name, price) VALUES
(1, E'샷 추가', 500),
(1, E'시럽 추가', 500);

INSERT INTO options (menu_id, name, price) VALUES
(2, E'샷 추가', 500),
(2, E'시럽 추가', 500);

INSERT INTO options (menu_id, name, price) VALUES
(3, E'샷 추가', 500),
(3, E'바닐라 시럽', 500),
(3, E'헤이즐넛 시럽', 500);

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
