// 공통 상수 정의

// 주문 상태
export const ORDER_STATUS = {
  PENDING: 'pending',
  RECEIVED: 'received',
  IN_PROGRESS: 'inProgress',
  COMPLETED: 'completed',
}

// 주문 상태 레이블
export const ORDER_STATUS_LABEL = {
  [ORDER_STATUS.PENDING]: '주문 대기',
  [ORDER_STATUS.RECEIVED]: '주문 접수',
  [ORDER_STATUS.IN_PROGRESS]: '제조 중',
  [ORDER_STATUS.COMPLETED]: '제조 완료',
}

// 재고 상태 임계값
export const STOCK_THRESHOLD = {
  OUT_OF_STOCK: 0,
  LOW_STOCK: 5,
}

// API 엔드포인트
export const API_ENDPOINTS = {
  MENUS: '/menus',
  INVENTORY: '/inventory',
  ORDERS: '/orders',
  STATISTICS: '/statistics',
}
