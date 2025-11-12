-- Clear existing data
TRUNCATE menus, options, orders, order_items, order_item_options RESTART IDENTITY CASCADE;

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

SELECT 'Korean data inserted successfully!' as message;
