require('dotenv').config();
const { pool, query } = require('../src/config/database');

async function updateConstraint() {
  const dropSql = 'ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check';
  const addSql = "ALTER TABLE orders ADD CONSTRAINT orders_status_check CHECK (status IN ('pending','received','inProgress','completed','cancelled'))";

  try {
    console.log('🧱 주문 상태 제약 조건 업데이트 시작');
    await query(dropSql);
    console.log('🔄 기존 제약 조건 제거 완료 (또는 존재하지 않았음)');
    await query(addSql);
    console.log('✅ 새로운 제약 조건 추가 완료');
  } catch (error) {
    console.error('❌ 제약 조건 업데이트 실패:', error.message);
  } finally {
    await pool.end();
    console.log('🔚 데이터베이스 연결 종료');
  }
}

updateConstraint();
