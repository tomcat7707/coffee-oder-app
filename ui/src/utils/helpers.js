// 날짜 포맷팅 유틸리티
export function formatDate(dateString) {
  const date = new Date(dateString)
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hours = date.getHours()
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${month}월 ${day}일 ${hours}:${minutes}`
}

// 가격 포맷팅 (천 단위 콤마)
export function formatPrice(price) {
  return price.toLocaleString('ko-KR')
}

// 재고 상태 계산
export function getStockStatus(stock) {
  if (stock === 0) {
    return { text: '품절', className: 'status-out' }
  }
  if (stock < 5) {
    return { text: '주의', className: 'status-warning' }
  }
  return { text: '정상', className: 'status-normal' }
}

// 주문 상태에 따른 다음 액션 버튼 텍스트
export function getOrderActionText(status) {
  const actionMap = {
    'pending': '주문 접수',
    'received': '제조 시작',
    'inProgress': '제조 완료',
    'completed': null
  }
  return actionMap[status]
}

// 주문 상태에 따른 다음 상태
export function getNextOrderStatus(currentStatus) {
  const statusFlow = {
    'pending': 'received',
    'received': 'inProgress',
    'inProgress': 'completed',
    'completed': 'completed'
  }
  return statusFlow[currentStatus]
}
