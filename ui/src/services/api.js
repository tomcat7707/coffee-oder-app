// API 기본 URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// API 호출 헬퍼 함수
async function apiCall(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('API Call Error:', error)
    throw error
  }
}

// 메뉴 관련 API
export const menuApi = {
  // 메뉴 목록 조회
  getMenus: () => apiCall('/menus'),
  
  // 메뉴 상세 조회
  getMenu: (id) => apiCall(`/menus/${id}`),
}

// 재고 관련 API
export const inventoryApi = {
  // 재고 목록 조회
  getInventory: () => apiCall('/inventory'),
  
  // 재고 업데이트
  updateStock: (menuId, stock) => 
    apiCall(`/inventory/${menuId}`, {
      method: 'PUT',
      body: JSON.stringify({ stock }),
    }),
  
  // 재고 증가
  increaseStock: (menuId) => 
    apiCall(`/inventory/${menuId}/increase`, {
      method: 'PATCH',
    }),
  
  // 재고 감소
  decreaseStock: (menuId) => 
    apiCall(`/inventory/${menuId}/decrease`, {
      method: 'PATCH',
    }),
}

// 주문 관련 API
export const orderApi = {
  // 주문 목록 조회
  getOrders: () => apiCall('/orders'),
  
  // 주문 생성
  createOrder: (orderData) => 
    apiCall('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    }),
  
  // 주문 상태 변경
  updateOrderStatus: (orderId, status) => 
    apiCall(`/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
}

// 통계 관련 API
export const statisticsApi = {
  // 주문 통계 조회
  getStatistics: () => apiCall('/statistics'),
}
