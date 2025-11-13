// API 기본 URL
// Production: VITE_API_URL 환경 변수 사용 (Render.com에서 설정)
// Development: localhost:5000 사용
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const API_URL = `${API_BASE_URL}/api`

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

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || `API Error: ${response.status}`)
    }

    return data
  } catch (error) {
    console.error('API Call Error:', error)
    throw error
  }
}

// 메뉴 관련 API
export const menuApi = {
  // 메뉴 목록 조회
  getMenus: async () => {
    const response = await apiCall('/menus')
    return response.data
  },
  
  // 메뉴 상세 조회
  getMenu: async (id) => {
    const response = await apiCall(`/menus/${id}`)
    return response.data
  },

  // 모든 메뉴 조회 (관리자용)
  getAllMenus: async () => {
    const response = await apiCall('/menus')
    return response.data
  },

  // 메뉴 추가
  createMenu: async (menuData) => {
    const response = await apiCall('/admin/menus', {
      method: 'POST',
      body: JSON.stringify(menuData),
    })
    return response.data
  },

  // 메뉴 수정
  updateMenu: async (menuId, menuData) => {
    const response = await apiCall(`/admin/menus/${menuId}`, {
      method: 'PUT',
      body: JSON.stringify(menuData),
    })
    return response.data
  },

  // 메뉴 삭제
  deleteMenu: async (menuId) => {
    const response = await apiCall(`/admin/menus/${menuId}`, {
      method: 'DELETE',
    })
    return response.data
  },
}

// 옵션 관련 API
export const optionApi = {
  // 모든 옵션 조회
  getAllOptions: async () => {
    const response = await apiCall('/admin/options')
    return response.data
  },

  // 옵션 추가
  createOption: async (optionData) => {
    const response = await apiCall('/admin/options', {
      method: 'POST',
      body: JSON.stringify(optionData),
    })
    return response.data
  },

  // 옵션 수정
  updateOption: async (optionId, optionData) => {
    const response = await apiCall(`/admin/options/${optionId}`, {
      method: 'PUT',
      body: JSON.stringify(optionData),
    })
    return response.data
  },

  // 옵션 삭제
  deleteOption: async (optionId) => {
    const response = await apiCall(`/admin/options/${optionId}`, {
      method: 'DELETE',
    })
    return response.data
  },
}

// 재고 관련 API
export const inventoryApi = {
  // 재고 목록 조회
  getInventory: async () => {
    const response = await apiCall('/admin/inventory')
    return response.data
  },
  
  // 재고 업데이트
  updateStock: async (menuId, stock) => {
    const response = await apiCall(`/admin/inventory/${menuId}`, {
      method: 'PATCH',
      body: JSON.stringify({ stock }),
    })
    return response.data
  },
}

// 주문 관련 API
export const orderApi = {
  // 주문 목록 조회
  getOrders: async (status) => {
    let endpoint = '/admin/orders'
    if (status) {
      endpoint += `?status=${status}`
    }
    const response = await apiCall(endpoint)
    return response.data
  },
  
  // 주문 생성
  createOrder: async (orderData) => {
    const response = await apiCall('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    })
    return response.data
  },
  
  // 주문 상세 조회
  getOrder: async (orderId) => {
    const response = await apiCall(`/orders/${orderId}`)
    return response.data
  },
  
  // 주문 상태 변경
  updateOrderStatus: async (orderId, status) => {
    const response = await apiCall(`/admin/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
    return response.data
  },
}

// 통계 관련 API
export const statisticsApi = {
  // 주문 통계 조회
  getStatistics: async () => {
    const response = await apiCall('/admin/statistics')
    return response.data
  },
}

