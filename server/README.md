# Coffee Order App - Backend

커피 주문 앱의 백엔드 서버입니다. Express.js와 PostgreSQL을 사용하여 구축되었습니다.

## 🚀 시작하기

### 필수 요구사항

- Node.js (v18 이상)
- PostgreSQL (v14 이상)
- npm 또는 yarn

### 설치 방법

1. **의존성 설치**
```bash
cd server
npm install
```

2. **환경 변수 설정**
`.env.example` 파일을 `.env`로 복사하고 데이터베이스 정보를 수정합니다.

```bash
cp .env.example .env
```

`.env` 파일 수정:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=coffee_order
DB_USER=postgres
DB_PASSWORD=your_password
PORT=5000
```

3. **PostgreSQL 데이터베이스 생성**

PostgreSQL에 접속하여 데이터베이스를 생성합니다:

```bash
# PostgreSQL 접속
psql -U postgres

# 데이터베이스 생성
CREATE DATABASE coffee_order;

# 접속 확인
\c coffee_order
```

4. **데이터베이스 스키마 생성**

```bash
# Windows (PowerShell)
Get-Content database\schema.sql | psql -U postgres -d coffee_order

# 또는 직접 psql 명령어 사용
psql -U postgres -d coffee_order -f database/schema.sql
```

5. **초기 데이터 삽입**

```bash
# Windows (PowerShell)
Get-Content database\seed.sql | psql -U postgres -d coffee_order

# 또는 직접 psql 명령어 사용
psql -U postgres -d coffee_order -f database/seed.sql
```

### 서버 실행

**개발 모드 (nodemon 사용)**
```bash
npm run dev
```

**프로덕션 모드**
```bash
npm start
```

서버가 성공적으로 시작되면 다음과 같은 메시지가 표시됩니다:
```
🚀 서버가 포트 5000에서 실행중입니다
📍 http://localhost:5000
🌍 환경: development
✅ 데이터베이스 연결 성공
```

## 📁 프로젝트 구조

```
server/
├── database/
│   ├── schema.sql          # 데이터베이스 스키마
│   └── seed.sql            # 초기 데이터
├── src/
│   ├── config/
│   │   └── database.js     # DB 연결 설정
│   ├── controllers/        # 비즈니스 로직
│   ├── routes/             # API 라우트
│   ├── middleware/
│   │   ├── errorHandler.js # 에러 처리
│   │   └── validator.js    # 요청 검증
│   └── app.js              # Express 앱 설정
├── .env                    # 환경 변수 (git 제외)
├── .env.example            # 환경 변수 예시
├── .gitignore
├── package.json
└── server.js               # 서버 시작점
```

## 🗄️ 데이터베이스 스키마

### 테이블 구조

- **menus**: 커피 메뉴 정보
- **options**: 메뉴 옵션 (샷 추가, 시럽 등)
- **orders**: 주문 정보
- **order_items**: 주문 아이템
- **order_item_options**: 주문 아이템 옵션

자세한 스키마는 `database/schema.sql` 파일을 참고하세요.

## 📡 API 엔드포인트

### 기본
- `GET /` - API 서버 정보

### 메뉴 (추후 구현)
- `GET /api/menus` - 전체 메뉴 목록 조회
- `GET /api/menus/:menuId` - 특정 메뉴 상세 조회

### 주문 (추후 구현)
- `POST /api/orders` - 새 주문 생성
- `GET /api/orders/:orderId` - 주문 상세 조회

### 관리자 (추후 구현)
- `GET /api/admin/statistics` - 주문 통계
- `GET /api/admin/inventory` - 재고 현황
- `PATCH /api/admin/inventory/:menuId` - 재고 수정
- `GET /api/admin/orders` - 주문 목록
- `PATCH /api/admin/orders/:orderId/status` - 주문 상태 변경

## 🛠️ 개발 가이드

### 데이터베이스 초기화 (리셋)

```bash
# 스키마 재생성
psql -U postgres -d coffee_order -f database/schema.sql

# 데이터 재삽입
psql -U postgres -d coffee_order -f database/seed.sql
```

### 데이터베이스 연결 테스트

서버를 실행하면 자동으로 데이터베이스 연결을 테스트합니다.
연결 성공 시 "✅ 데이터베이스 연결 성공" 메시지가 표시됩니다.

### 로깅

모든 HTTP 요청은 자동으로 콘솔에 로깅됩니다:
```
[2025-11-12T14:30:00.000Z] GET /api/menus
```

## 🔧 트러블슈팅

### 데이터베이스 연결 실패

1. PostgreSQL이 실행 중인지 확인
2. `.env` 파일의 데이터베이스 정보가 올바른지 확인
3. 데이터베이스가 생성되었는지 확인

### 포트 충돌

포트 5000이 이미 사용 중인 경우 `.env` 파일에서 `PORT` 값을 변경하세요.

## 📝 다음 단계

1. ✅ 프로젝트 구조 설정
2. ✅ 데이터베이스 스키마 생성
3. ⏳ API 라우트 구현
4. ⏳ 컨트롤러 로직 구현
5. ⏳ 프론트엔드 연동

## 📚 참고 자료

- [Express.js 공식 문서](https://expressjs.com/)
- [PostgreSQL 공식 문서](https://www.postgresql.org/docs/)
- [node-postgres (pg) 문서](https://node-postgres.com/)
