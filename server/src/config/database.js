const { Pool } = require('pg');

// PostgreSQL 연결 풀 설정
let poolConfig;

if (process.env.DATABASE_URL) {
  // Production: DATABASE_URL 사용
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  };
} else {
  // Development: 개별 설정 사용
  poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'coffee_order_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD
  };
}

const pool = new Pool({
  ...poolConfig,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

// 연결 테스트
pool.on('connect', (client) => {
  console.log('✅ 데이터베이스 연결 성공');
  client.query('SET CLIENT_ENCODING TO UTF8');
});

pool.on('error', (err) => {
  console.error('❌ 데이터베이스 연결 오류:', err);
  process.exit(-1);
});

// 쿼리 헬퍼 함수
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('쿼리 실행:', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('쿼리 오류:', { text, error: error.message });
    throw error;
  }
};

// 트랜잭션 헬퍼 함수
const getClient = async () => {
  const client = await pool.connect();
  const query = client.query.bind(client);
  const release = client.release.bind(client);
  
  // 트랜잭션 헬퍼 메서드 추가
  client.query = (...args) => {
    return query(...args);
  };
  
  client.release = () => {
    return release();
  };
  
  return client;
};

module.exports = {
  pool,
  query,
  getClient
};
