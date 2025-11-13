# PostgreSQL 데이터베이스 설정 완료 ✅

## 설정 요약

### 데이터베이스 정보
- **데이터베이스명**: `coffee_order_db`
- **호스트**: localhost
- **포트**: 5432
- **사용자**: postgres

### 생성된 테이블 (5개)
1. ✅ **menus** - 커피 메뉴 정보 (3개 레코드)
2. ✅ **options** - 메뉴 옵션 (7개 레코드)
3. ✅ **orders** - 주문 정보 (2개 테스트 레코드)
4. ✅ **order_items** - 주문 아이템 (1개 테스트 레코드)
5. ✅ **order_item_options** - 주문 아이템 옵션

### 초기 데이터
- **메뉴 3개**: Americano (ICE), Americano (HOT), Cafe Latte
- **옵션 7개**: Extra Shot, Add Syrup, Vanilla Syrup, Hazelnut Syrup

## 구현된 API

### ✅ 메뉴 API
- `GET /api/menus` - 전체 메뉴 목록 조회 (옵션 포함)
- `GET /api/menus/:menuId` - 특정 메뉴 상세 조회

### 테스트 API
- `GET /api/db-test` - 데이터베이스 연결 및 데이터 확인

## 테스트 방법

### 1. 데이터베이스 연결 테스트
```
http://localhost:5000/api/db-test
```

### 2. 메뉴 목록 조회
```
http://localhost:5000/api/menus
```

예상 응답:
```json
{
  "success": true,
  "data": [
    {
      "menuId": 1,
      "name": "Americano (ICE)",
      "description": "Cool and clean iced Americano",
      "price": 4000,
      "imageUrl": "https://images.unsplash.com/...",
      "options": [
        {
          "optionId": 1,
          "name": "Extra Shot",
          "price": 500
        }
      ]
    }
  ]
}
```

## 다음 단계

### 구현 예정 API
- [ ] POST /api/orders - 주문 생성
- [ ] GET /api/orders/:orderId - 주문 상세 조회
- [ ] GET /api/admin/statistics - 주문 통계
- [ ] GET /api/admin/inventory - 재고 현황
- [ ] PATCH /api/admin/inventory/:menuId - 재고 수정
- [ ] GET /api/admin/orders - 주문 목록
- [ ] PATCH /api/admin/orders/:orderId/status - 주문 상태 변경

## 유용한 PostgreSQL 명령어

### 데이터베이스 접속
```bash
psql -U postgres -d coffee_order_db
```

### 테이블 목록 확인
```sql
\dt
```

### 메뉴 데이터 확인
```sql
SELECT * FROM menus;
```

### 옵션 데이터 확인
```sql
SELECT * FROM options;
```

### 주문 데이터 확인
```sql
SELECT * FROM orders;
```

### 데이터베이스 초기화 (주의!)
```bash
# PowerShell 자동화 스크립트 (권장)
npm run db:reset

# 수동 실행이 필요한 경우
Get-Content database\schema.sql | psql -U postgres -d coffee_order_db
Get-Content database\seed.sql | psql -U postgres -d coffee_order_db
```

`npm run db:reset`은 `.env` 파일에서 DB 정보를 읽어 `schema.sql`과 `seed.sql`을 UTF-8 인코딩으로 순차 적용합니다. PostgreSQL이 다른 경로에 설치되어 있다면 `server/scripts/reset-db.ps1`의 `PsqlPath` 파라미터를 조정하세요.
