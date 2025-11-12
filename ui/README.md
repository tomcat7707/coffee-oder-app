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
│   ├── components/     # 재사용 컴포넌트 (추후 추가)
│   ├── services/       # API 호출 로직 (추후 추가)
│   ├── App.jsx
│   ├── main.jsx
│   ├── App.css
│   └── index.css
├── index.html
├── vite.config.js
└── package.json
```

## 라우팅

- `/` - 주문하기 화면
- `/admin` - 관리자 화면
