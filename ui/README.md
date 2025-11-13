# Coffee Order App - Frontend

React + Vite를 사용한 커피 주문 앱 프론트엔드

## 개발 시작

```bash
# 의존성 설치
npm install

# 개발 서버 실행 (http://localhost:3000)
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 미리보기
npm run preview
```

## 환경 변수

`.env` 파일을 생성하고 다음 변수를 설정하세요:

```env
VITE_API_URL=http://localhost:5000/api
```

## 기술 스택

- React 18
- Vite
- React Router DOM
- Vanilla JavaScript

## 프로젝트 구조

```
ui/
├── src/
│   ├── pages/          # 페이지 컴포넌트
│   │   ├── OrderPage.jsx
│   │   └── AdminPage.jsx
│   ├── hooks/          # 화면별 상태 관리 훅
│   │   └── useOrderCart.js
│   ├── components/     # 재사용 컴포넌트 (추후 추가)
│   ├── services/       # API 호출 로직
│   │   └── api.js
│   ├── utils/          # 유틸리티 함수
│   │   └── helpers.js
│   ├── constants/      # 상수 정의
│   │   └── index.js
│   ├── App.jsx
│   ├── main.jsx
│   ├── App.css
│   └── index.css
├── .env                # 환경 변수
├── index.html
├── vite.config.js
└── package.json
```

## 라우팅

- `/` - 주문하기 화면
- `/admin` - 관리자 화면

## 백엔드 API 연동

### API 엔드포인트

**메뉴**
- `GET /api/menus` - 메뉴 목록 조회

**재고**
- `GET /api/inventory` - 재고 목록 조회
- `PUT /api/inventory/:menuId` - 재고 업데이트
- `PATCH /api/inventory/:menuId/increase` - 재고 증가
- `PATCH /api/inventory/:menuId/decrease` - 재고 감소

**주문**
- `GET /api/orders` - 주문 목록 조회
- `POST /api/orders` - 주문 생성
- `PATCH /api/orders/:orderId/status` - 주문 상태 변경

**통계**
- `GET /api/statistics` - 주문 통계 조회

### 데이터 구조

**메뉴 응답 예시**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "아메리카노(ICE)",
      "price": 4000,
      "description": "시원하고 깔끔한 아이스 아메리카노",
      "imageUrl": "...",
      "stock": 10,
      "options": [
        { "id": 1, "name": "샷 추가", "price": 500 }
      ]
    }
  ]
}
```

**주문 생성 요청 예시**
```json
{
  "items": [
    {
      "menuId": 1,
      "quantity": 1,
      "selectedOptions": [
        { "optionId": 1 }
      ]
    }
  ],
  "totalAmount": 4500
}
```

## 현재 상태

- ✅ 주문/관리 UI 및 API 연동 완료
- ✅ 옵션 프리셋 CRUD 연결
- ✅ 주문 페이지 장바구니 로직 커스텀 훅 분리
- ⏳ 관리자 페이지 상태 관리 분리 예정
- ⏳ 통합 테스트 및 UI 리그레션 검증 예정

## 다음 단계

1. 관리자 화면 상태 로직도 커스텀 훅/Context로 분리
2. E2E 테스트 시나리오 작성 및 수행
3. 실시간 주문-재고 동기화를 위한 SSE/WebSocket 검토
4. 에러 처리 및 로딩 상태 공통 컴포넌트화

