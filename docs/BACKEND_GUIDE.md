# 백엔드 구축 가이드

## 📋 백엔드 요구사항

### 기술 스택
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma 또는 Sequelize

## 🔄 현재 운영 메모
- `menus`, `options`, `option_presets`, `option_preset_options` 등 최신 스키마는 `database/schema.sql`에 반영되어 있습니다.
- PowerShell 환경에서는 `npm run db:reset`으로 스키마와 시드 데이터를 한 번에 초기화할 수 있습니다.
- UTF-8 인코딩이 아닌 경우 시드가 실패하므로 스크립트 실행 시 자동으로 `PGCLIENTENCODING`을 지정합니다.

## 📈 마이그레이션 로드맵
1. `node-pg-migrate` 또는 `knex` 마이그레이션 도구 비교 후 채택 결정
2. 현재 `schema.sql`을 테이블 단위 마이그레이션으로 분할
3. CI 단계에서 마이그레이션 검증 작업 추가
4. 운영/개발 DB 간 스크립트 차이를 기록하는 변경 로그 마련

### 필요한 API 엔드포인트

#### 1. 메뉴 관리
```
GET    /api/menus              # 메뉴 목록 조회
GET    /api/menus/:id          # 메뉴 상세 조회
```

#### 2. 재고 관리
```
GET    /api/inventory          # 재고 목록 조회
PUT    /api/inventory/:menuId  # 재고 업데이트 (절대값)
PATCH  /api/inventory/:menuId/increase  # 재고 증가
PATCH  /api/inventory/:menuId/decrease  # 재고 감소
```

#### 3. 주문 관리
```
GET    /api/orders             # 주문 목록 조회
POST   /api/orders             # 주문 생성 (재고 자동 감소)
GET    /api/orders/:id         # 주문 상세 조회
PATCH  /api/orders/:id/status  # 주문 상태 변경
```

#### 4. 통계
```
GET    /api/statistics         # 주문 상태별 통계
```

---

## 🗄️ 데이터베이스 스키마

### 1. menus (메뉴 테이블)
```sql
CREATE TABLE menus (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  price INTEGER NOT NULL,
  description TEXT,
  image_url VARCHAR(500),
  stock INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. menu_options (메뉴 옵션 테이블)
```sql
CREATE TABLE menu_options (
  id SERIAL PRIMARY KEY,
  menu_id INTEGER REFERENCES menus(id),
  name VARCHAR(100) NOT NULL,
  price INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3. orders (주문 테이블)
```sql
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  total_amount INTEGER NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 4. order_items (주문 아이템 테이블)
```sql
CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id),
  menu_id INTEGER REFERENCES menus(id),
  menu_name VARCHAR(100) NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price INTEGER NOT NULL,
  total_price INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 5. order_item_options (주문 아이템 옵션 테이블)
```sql
CREATE TABLE order_item_options (
  id SERIAL PRIMARY KEY,
  order_item_id INTEGER REFERENCES order_items(id),
  option_id INTEGER REFERENCES menu_options(id),
  option_name VARCHAR(100) NOT NULL,
  option_price INTEGER NOT NULL
);
```

---

## 📦 초기 데이터 (Seed Data)

### 메뉴 데이터
```sql
INSERT INTO menus (name, price, description, image_url, stock) VALUES
('아메리카노(ICE)', 4000, '시원하고 깔끔한 아이스 아메리카노', 'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=400&h=300&fit=crop', 10),
('아메리카노(HOT)', 4000, '따뜻하고 진한 아메리카노', 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=300&fit=crop', 10),
('카페라떼', 5000, '부드럽고 고소한 카페라떼', 'https://images.unsplash.com/photo-1561882468-9110e03e0f78?w=400&h=300&fit=crop', 10);
```

### 메뉴 옵션 데이터
```sql
INSERT INTO menu_options (menu_id, name, price) VALUES
(1, '샷 추가', 500),
(1, '시럽 추가', 0),
(2, '샷 추가', 500),
(2, '시럽 추가', 0),
(3, '샷 추가', 500),
(3, '시럽 추가', 0);
```

---

## 🔄 API 응답 형식

### 성공 응답
```json
{
  "success": true,
  "data": { ... }
}
```

### 에러 응답
```json
{
  "success": false,
  "error": "에러 메시지",
  "code": "ERROR_CODE"
}
```

---

## 🔐 비즈니스 로직

### 1. 주문 생성 시
1. 주문 아이템의 재고 확인
2. 재고가 부족하면 에러 반환
3. 주문 생성
4. 재고 자동 감소
5. 주문 응답 반환

### 2. 재고 업데이트 시
- 재고는 0 이하로 내려갈 수 없음
- 재고 변경 시 타임스탬프 업데이트

### 3. 주문 상태 변경
- pending → received → inProgress → completed
- 역순으로는 변경 불가

---

## 📁 백엔드 프로젝트 구조 (권장)

```
server/
├── src/
│   ├── config/
│   │   └── database.js      # DB 연결 설정
│   ├── models/              # 데이터 모델
│   │   ├── Menu.js
│   │   ├── Order.js
│   │   └── OrderItem.js
│   ├── routes/              # API 라우트
│   │   ├── menus.js
│   │   ├── inventory.js
│   │   ├── orders.js
│   │   └── statistics.js
│   ├── controllers/         # 비즈니스 로직
│   │   ├── menuController.js
│   │   ├── inventoryController.js
│   │   ├── orderController.js
│   │   └── statisticsController.js
│   ├── middlewares/         # 미들웨어
│   │   ├── errorHandler.js
│   │   └── validator.js
│   ├── utils/               # 유틸리티
│   │   └── helpers.js
│   └── app.js               # Express 앱
├── prisma/
│   └── schema.prisma        # Prisma 스키마
├── .env                     # 환경 변수
├── package.json
└── README.md
```

---

## 🚀 다음 단계

1. ✅ 프론트엔드 API 서비스 레이어 준비 완료
2. ⏳ 백엔드 프로젝트 생성
3. ⏳ PostgreSQL 데이터베이스 설정
4. ⏳ API 엔드포인트 구현
5. ⏳ 프론트엔드-백엔드 연동 테스트
