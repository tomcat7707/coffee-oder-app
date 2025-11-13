const express = require('express');
const cors = require('cors');
const path = require('path');
const { query } = require('./config/database');

const app = express();

// 미들웨어 설정
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL, 'https://coffee-oder-app-frontend.onrender.com']
    : true,  // 개발 환경에서는 모든 origin 허용
  credentials: true
}));

app.use(express.json({ charset: 'utf-8' }));
app.use(express.urlencoded({ extended: true }));

// 정적 이미지 제공 (업로드된 메뉴 이미지)
app.use('/images', express.static(path.join(__dirname, '../../ui/public/images')));

// UTF-8 응답 헤더 설정
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

// 요청 로깅 미들웨어
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// 기본 라우트
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Coffee Order API Server',
    version: '1.0.0',
    endpoints: {
      menus: '/api/menus',
      orders: '/api/orders',
      admin: '/api/admin',
      dbTest: '/api/db-test'
    }
  });
});

// 데이터베이스 연결 테스트 라우트
app.get('/api/db-test', async (req, res, next) => {
  try {
    const result = await query('SELECT NOW() as current_time, version() as pg_version');
    const menusResult = await query('SELECT COUNT(*) as menu_count FROM menus');
    const optionsResult = await query('SELECT COUNT(*) as option_count FROM options');
    const ordersResult = await query('SELECT COUNT(*) as order_count FROM orders');
    
    res.json({
      success: true,
      message: 'Database connection successful!',
      data: {
        currentTime: result.rows[0].current_time,
        postgresqlVersion: result.rows[0].pg_version,
        counts: {
          menus: parseInt(menusResult.rows[0].menu_count),
          options: parseInt(optionsResult.rows[0].option_count),
          orders: parseInt(ordersResult.rows[0].order_count)
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// API 라우트
const menusRouter = require('./routes/menus');
const ordersRouter = require('./routes/orders');
const adminRouter = require('./routes/admin');

app.use('/api/menus', menusRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/admin', adminRouter);

// 404 에러 처리
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: '요청하신 경로를 찾을 수 없습니다'
  });
});

// 에러 처리 미들웨어
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  console.error(err.stack);
  
  res.status(err.status || 500).json({
    success: false,
    error: err.message || '서버 오류가 발생했습니다',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

module.exports = app;
