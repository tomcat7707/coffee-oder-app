# Render.com 배포 가이드

## 🚀 배포 순서

### 1단계: GitHub 업로드

```powershell
cd I:\Cursor_test\oder-app-vscode
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

---

## 2단계: Render.com 배포

### A. PostgreSQL 데이터베이스 생성 ⭐ (제일 먼저!)

1. **Render Dashboard** → **New +** → **PostgreSQL**

2. **설정값:**
   - Name: `coffee-order-db`
   - Database: `coffee_order_db`
   - User: (자동 생성)
   - Region: `Singapore`
   - Plan: **Free**

3. **Create Database** 클릭

4. **연결 정보 저장:**
   - 생성 후 "Info" 탭에서 **Internal Database URL** 복사
   - 예시: `postgresql://user:pass@host.render.com/coffee_order_db`
   - ⚠️ 이 URL을 메모장에 복사해두세요!

5. **데이터베이스 스키마 생성:**
   - Connect 탭에서 **PSQL Command** 복사
   - 로컬 터미널에서 실행:
   ```powershell
   # Render가 제공하는 PSQL 명령어 붙여넣기
   # 예: PGPASSWORD=xxx psql -h xxx.render.com -U user coffee_order_db
   ```
   
   - 또는 Render 웹 콘솔에서:
   - Database 페이지 → **Connect** → **External Connection**
   - psql 또는 pgAdmin으로 접속

6. **스키마 및 데이터 삽입:**
   ```sql
   -- 로컬의 schema.sql 내용 붙여넣기
   -- 로컬의 seed_korean.sql 내용 붙여넣기
   ```

---

### B. 백엔드 (Node.js API) 배포

1. **Render Dashboard** → **New +** → **Web Service**

2. **저장소 연결:**
   - **Connect a repository** 클릭
   - GitHub에서 `coffee-order-app` 선택

3. **설정값:**
   ```
   Name: coffee-order-backend
   Region: Singapore
   Branch: main
   Root Directory: server
   Runtime: Node
   Build Command: npm install
   Start Command: npm start
   Instance Type: Free
   ```

4. **환경 변수 추가** (Environment 탭):
   
   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `PORT` | `5000` |
   | `DATABASE_URL` | (위에서 복사한 Internal Database URL) |
   | `FRONTEND_URL` | (나중에 프론트엔드 URL로 업데이트) |

5. **Create Web Service** 클릭

6. **배포 완료 대기** (3-5분 소요)
   - 로그에서 "🚀 서버가 포트 5000에서 실행중입니다" 확인

7. **백엔드 URL 복사:**
   - 예: `https://coffee-order-backend.onrender.com`
   - ⚠️ 이 URL을 메모장에 복사해두세요!

---

### C. 프론트엔드 (React + Vite) 배포

1. **Render Dashboard** → **New +** → **Static Site**

2. **저장소 연결:**
   - 같은 GitHub 저장소 선택

3. **설정값:**
   ```
   Name: coffee-order-frontend
   Branch: main
   Root Directory: ui
   Build Command: npm install && npm run build
   Publish Directory: dist
   ```

4. **환경 변수 추가** (Environment 탭):
   
   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | (백엔드 URL, 예: https://coffee-order-backend.onrender.com) |

5. **Create Static Site** 클릭

6. **배포 완료 대기**

7. **프론트엔드 URL 확인:**
   - 예: `https://coffee-order-frontend.onrender.com`

---

## 3단계: 최종 설정

### A. 백엔드 환경 변수 업데이트

1. 백엔드 서비스로 이동
2. **Environment** 탭
3. `FRONTEND_URL` 값을 프론트엔드 URL로 변경
4. **Save Changes** → 자동 재배포

### B. 프론트엔드 API URL 설정 확인

1. `ui/src/services/api.js` 파일에서:
   ```javascript
   const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
   ```
   이 코드가 있는지 확인 (환경 변수 사용)

---

## 4단계: 배포 전 코드 수정 필요 사항

### 📝 수정 1: server/src/config/database.js

```javascript
const pool = new Pool({
  // Render는 DATABASE_URL 환경 변수 사용
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  client_encoding: 'UTF8'
});
```

### 📝 수정 2: ui/src/services/api.js

```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});
```

### 📝 수정 3: server/package.json

```json
{
  "scripts": {
    "start": "node server.js",  // production용
    "dev": "nodemon server.js"  // development용
  }
}
```

---

## 🔍 배포 후 테스트

### 1. 백엔드 API 테스트
브라우저에서 접속:
```
https://coffee-order-backend.onrender.com/api/menus
```
→ JSON으로 메뉴 데이터가 보이면 성공!

### 2. 프론트엔드 테스트
```
https://coffee-order-frontend.onrender.com
```
→ 주문 페이지가 열리고 메뉴가 표시되면 성공!

---

## ⚠️ 주의사항

### Free Plan 제한사항
- **백엔드 서버:** 15분 동안 요청이 없으면 자동으로 절전 모드
  - 첫 요청 시 30-60초 정도 소요 (Cold Start)
  
- **데이터베이스:** 
  - 90일 후 자동 삭제 (Free Plan)
  - 1GB 저장 용량 제한

### 이미지 파일 처리
- `ui/public/images/menus/` 폴더의 이미지들은 자동으로 배포됨
- Static Site에서 `/images/menus/americano-ice.jpg` 경로로 접근 가능

---

## 🐛 문제 해결

### 백엔드가 시작되지 않을 때
1. Render Dashboard → 백엔드 서비스 → **Logs** 탭 확인
2. 데이터베이스 연결 오류 → `DATABASE_URL` 환경 변수 확인

### CORS 에러가 발생할 때
1. 백엔드 `FRONTEND_URL` 환경 변수가 올바른지 확인
2. `src/app.js`의 CORS 설정 확인

### 한글이 깨질 때
1. 데이터베이스가 UTF-8로 생성되었는지 확인
2. `seed_korean.sql`을 UTF-8로 다시 삽입

---

## 📱 완료 후 접속 URL

- **주문 페이지:** https://coffee-order-frontend.onrender.com
- **관리자 페이지:** https://coffee-order-frontend.onrender.com/admin
- **API:** https://coffee-order-backend.onrender.com/api/menus

축하합니다! 배포 완료! 🎉
