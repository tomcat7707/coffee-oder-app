// UTF-8 인코딩 설정
process.env.LANG = 'ko_KR.UTF-8';

require('dotenv').config();
const app = require('./src/app');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 서버가 포트 ${PORT}에서 실행중입니다`);
  console.log(`📍 http://localhost:${PORT}`);
  console.log(`🌍 환경: ${process.env.NODE_ENV || 'development'}`);
});
