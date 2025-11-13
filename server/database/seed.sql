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

-- Option preset data insertion
INSERT INTO option_presets (name, description) VALUES
(E'클래식 시럽 3종', E'라떼류에 자주 사용하는 대표 시럽'),
(E'에스프레소 강화', E'커피 음료에 추가 샷 구성을 한 번에 적용'),
(E'우유 변경 프리셋', E'우유 타입 변경 옵션을 빠르게 등록');

INSERT INTO option_preset_options (preset_id, name, price, display_order) VALUES
(1, E'바닐라 시럽', 500, 1),
(1, E'헤이즐넛 시럽', 500, 2),
(1, E'카라멜 시럽', 500, 3),
(2, E'샷 추가 1', 500, 1),
(2, E'샷 추가 2', 1000, 2),
(3, E'저지방 우유', 300, 1),
(3, E'무지방 우유', 300, 2),
(3, E'두유 변경', 500, 3);

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
  (SELECT COUNT(*) FROM option_presets) as option_presets_count,
  (SELECT COUNT(*) FROM orders) as orders_count;
