-- Menu data insertion (temporary English data - will be updated to Korean via API)
-- Encoding: UTF-8
INSERT INTO menus (name, description, price, image_url, stock) VALUES
(E'?꾨찓由ъ뭅??(ICE)', E'?쒖썝?섍퀬 源붾걫???꾩씠???꾨찓由ъ뭅??, 4000, 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735', 20),
(E'?꾨찓由ъ뭅??(HOT)', E'?곕쑜?섍퀬 吏꾪븳 ???꾨찓由ъ뭅??, 4000, 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd', 20),
(E'移댄럹?쇰뼹', E'遺?쒕윭???곗쑀? ?먯뒪?꾨젅?뚯쓽 議고솕', 5000, 'https://images.unsplash.com/photo-1561882468-9110e03e0f78', 15);

-- Option data insertion
INSERT INTO options (menu_id, name, price) VALUES
(1, E'??異붽?', 500),
(1, E'?쒕읇 異붽?', 500);

INSERT INTO options (menu_id, name, price) VALUES
(2, E'??異붽?', 500),
(2, E'?쒕읇 異붽?', 500);

INSERT INTO options (menu_id, name, price) VALUES
(3, E'??異붽?', 500),
(3, E'諛붾땺???쒕읇', 500),
(3, E'?ㅼ씠利먮꽋 ?쒕읇', 500);

-- Option preset data insertion
INSERT INTO option_presets (name, description) VALUES
(E'?대옒???쒕읇 3醫?, E'?쇰뼹瑜섏뿉 ?먯＜ ?ъ슜?섎뒗 ????쒕읇'),
(E'?먯뒪?꾨젅??媛뺥솕', E'而ㅽ뵾 ?뚮즺??異붽? ??援ъ꽦????踰덉뿉 ?곸슜'),
(E'?곗쑀 蹂寃??꾨━??, E'?곗쑀 ???蹂寃??듭뀡??鍮좊Ⅴ寃??깅줉');

INSERT INTO option_preset_options (preset_id, name, price, display_order) VALUES
(1, E'諛붾땺???쒕읇', 500, 1),
(1, E'?ㅼ씠利먮꽋 ?쒕읇', 500, 2),
(1, E'移대씪硫??쒕읇', 500, 3),
(2, E'??異붽? 1', 500, 1),
(2, E'??異붽? 2', 1000, 2),
(3, E'?吏諛??곗쑀', 300, 1),
(3, E'臾댁?諛??곗쑀', 300, 2),
(3, E'?먯쑀 蹂寃?, 500, 3);

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
