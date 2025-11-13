-- Clear existing data
TRUNCATE option_preset_options, option_presets, menus, options, orders, order_items, order_item_options RESTART IDENTITY CASCADE;

-- Insert Korean menu data using bytea and convert to text
INSERT INTO menus (name, description, price, image_url, stock) VALUES
('아메리카노 (ICE)', '시원하고 깔끔한 아이스 아메리카노', 4000, '/images/menus/americano-ice.jpg', 20),
('아메리카노 (HOT)', '따뜻하고 진한 핫 아메리카노', 4000, '/images/menus/americano-hot.jpg', 20),
('카페라떼', '부드러운 우유와 에스프레소의 조화', 5000, '/images/menus/caffe-latte.jpg', 15);

-- Insert options
INSERT INTO options (menu_id, name, price) VALUES
(1, '샷 추가', 500),
(1, '시럽 추가', 500),
(2, '샷 추가', 500),
(2, '시럽 추가', 500),
(3, '샷 추가', 500),
(3, '바닐라 시럽', 500),
(3, '헤이즐넛 시럽', 500);

-- Insert option presets
INSERT INTO option_presets (name, description) VALUES
('클래식 시럽 3종', '라떼류에 자주 사용하는 대표 시럽'),
('에스프레소 강화', '커피 음료에 추가 샷 구성을 한 번에 적용'),
('우유 변경 프리셋', '우유 타입 변경 옵션을 빠르게 등록');

INSERT INTO option_preset_options (preset_id, name, price, display_order) VALUES
(1, '바닐라 시럽', 500, 1),
(1, '헤이즐넛 시럽', 500, 2),
(1, '카라멜 시럽', 500, 3),
(2, '샷 추가 1', 500, 1),
(2, '샷 추가 2', 1000, 2),
(3, '저지방 우유', 300, 1),
(3, '무지방 우유', 300, 2),
(3, '두유 변경', 500, 3);

SELECT 'Korean data inserted successfully!' as message;
