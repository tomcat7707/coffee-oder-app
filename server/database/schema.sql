-- 기존 테이블 삭제 (개발 환경에서만 사용)
DROP TABLE IF EXISTS option_preset_options CASCADE;
DROP TABLE IF EXISTS option_presets CASCADE;
DROP TABLE IF EXISTS order_item_options CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS options CASCADE;
DROP TABLE IF EXISTS menus CASCADE;

-- Menus 테이블 생성
CREATE TABLE menus (
  menu_id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price INTEGER NOT NULL CHECK (price >= 0),
  image_url VARCHAR(500),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Options 테이블 생성
CREATE TABLE options (
  option_id SERIAL PRIMARY KEY,
  menu_id INTEGER NOT NULL REFERENCES menus(menu_id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  price INTEGER NOT NULL DEFAULT 0 CHECK (price >= 0),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Option Presets 테이블 생성
CREATE TABLE option_presets (
  preset_id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE option_preset_options (
  preset_option_id SERIAL PRIMARY KEY,
  preset_id INTEGER NOT NULL REFERENCES option_presets(preset_id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  price INTEGER NOT NULL DEFAULT 0 CHECK (price >= 0),
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders 테이블 생성
CREATE TABLE orders (
  order_id SERIAL PRIMARY KEY,
  total_amount INTEGER NOT NULL CHECK (total_amount >= 0),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'received', 'inProgress', 'completed', 'cancelled')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order_Items 테이블 생성
CREATE TABLE order_items (
  item_id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
  menu_id INTEGER NOT NULL REFERENCES menus(menu_id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price INTEGER NOT NULL CHECK (price >= 0),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order_Item_Options 테이블 생성
CREATE TABLE order_item_options (
  id SERIAL PRIMARY KEY,
  item_id INTEGER NOT NULL REFERENCES order_items(item_id) ON DELETE CASCADE,
  option_id INTEGER NOT NULL REFERENCES options(option_id),
  option_name VARCHAR(50) NOT NULL,
  option_price INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX idx_menus_stock ON menus(stock);
CREATE INDEX idx_options_menu_id ON options(menu_id);
CREATE INDEX idx_option_preset_options_preset_id ON option_preset_options(preset_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_menu_id ON order_items(menu_id);
CREATE INDEX idx_order_item_options_item_id ON order_item_options(item_id);

-- updated_at 자동 업데이트를 위한 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Menus 테이블에 트리거 추가
CREATE TRIGGER update_menus_updated_at 
  BEFORE UPDATE ON menus 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Orders 테이블에 트리거 추가
CREATE TRIGGER update_orders_updated_at 
  BEFORE UPDATE ON orders 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Option Presets 테이블에 트리거 추가
CREATE TRIGGER update_option_presets_updated_at
  BEFORE UPDATE ON option_presets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 스키마 생성 완료 메시지
SELECT 'Database schema created successfully!' as message;
