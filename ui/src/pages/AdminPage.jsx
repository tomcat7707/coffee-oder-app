import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './AdminPage.css'

// 임시 통계 데이터
const INITIAL_STATISTICS = {
  total: 1,
  received: 1,
  inProgress: 0,
  completed: 0
}

// 임시 재고 데이터
const INITIAL_INVENTORY = [
  { menuId: 1, menuName: '아메리카노 (ICE)', stock: 10 },
  { menuId: 2, menuName: '아메리카노 (HOT)', stock: 10 },
  { menuId: 3, menuName: '카페라떼', stock: 10 }
]

// 임시 주문 데이터
const INITIAL_ORDERS = [
  {
    orderId: 1,
    createdAt: '2025-07-31T13:00:00',
    items: [
      { menuName: '아메리카노(ICE)', quantity: 1 }
    ],
    totalAmount: 4000,
    status: 'received'
  }
]

function AdminPage() {
  const navigate = useNavigate()
  const [statistics, setStatistics] = useState(INITIAL_STATISTICS)
  const [inventory, setInventory] = useState(INITIAL_INVENTORY)
  const [orders, setOrders] = useState(INITIAL_ORDERS)

  // 재고 상태 판단
  const getStockStatus = (stock) => {
    if (stock === 0) return { text: '품절', className: 'status-out' }
    if (stock < 5) return { text: '주의', className: 'status-warning' }
    return { text: '정상', className: 'status-normal' }
  }

  // 재고 증가
  const handleIncreaseStock = (menuId) => {
    setInventory(prev => prev.map(item =>
      item.menuId === menuId
        ? { ...item, stock: item.stock + 1 }
        : item
    ))
  }

  // 재고 감소
  const handleDecreaseStock = (menuId) => {
    setInventory(prev => prev.map(item =>
      item.menuId === menuId
        ? { ...item, stock: Math.max(0, item.stock - 1) }
        : item
    ))
  }

  // 주문 상태 변경
  const handleOrderStatusChange = (orderId, newStatus) => {
    setOrders(prev => prev.map(order =>
      order.orderId === orderId
        ? { ...order, status: newStatus }
        : order
    ))

    // 통계 업데이트
    setStatistics(prev => {
      const order = orders.find(o => o.orderId === orderId)
      const oldStatus = order.status
      const newStats = { ...prev }

      // 이전 상태에서 감소
      if (oldStatus === 'received') newStats.received -= 1
      if (oldStatus === 'inProgress') newStats.inProgress -= 1
      if (oldStatus === 'completed') newStats.completed -= 1

      // 새 상태에 추가
      if (newStatus === 'received') newStats.received += 1
      if (newStatus === 'inProgress') newStats.inProgress += 1
      if (newStatus === 'completed') newStats.completed += 1

      return newStats
    })
  }

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const month = date.getMonth() + 1
    const day = date.getDate()
    const hours = date.getHours()
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${month}월 ${day}일 ${hours}:${minutes}`
  }

  // 주문 상태에 따른 버튼 텍스트
  const getOrderButtonText = (status) => {
    if (status === 'pending') return '주문 접수'
    if (status === 'received') return '제조 시작'
    if (status === 'inProgress') return '제조 완료'
    return '완료'
  }

  // 주문 상태에 따른 다음 상태
  const getNextStatus = (status) => {
    if (status === 'pending') return 'received'
    if (status === 'received') return 'inProgress'
    if (status === 'inProgress') return 'completed'
    return 'completed'
  }

  return (
    <div className="admin-page">
      {/* 헤더 */}
      <header className="header">
        <div className="logo">COZY</div>
        <nav className="navigation">
          <button className="nav-button" onClick={() => navigate('/')}>
            주문하기
          </button>
          <button className="nav-button active">관리자</button>
        </nav>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="main-content">
        {/* 관리자 대시보드 */}
        <section className="dashboard-section">
          <h2 className="section-title">관리자 대시보드</h2>
          <div className="statistics">
            <span className="stat-text">
              총 주문 <strong>{statistics.total}</strong>
            </span>
            <span className="stat-divider">/</span>
            <span className="stat-text">
              주문 접수 <strong>{statistics.received}</strong>
            </span>
            <span className="stat-divider">/</span>
            <span className="stat-text">
              제조 중 <strong>{statistics.inProgress}</strong>
            </span>
            <span className="stat-divider">/</span>
            <span className="stat-text">
              제조 완료 <strong>{statistics.completed}</strong>
            </span>
          </div>
        </section>

        {/* 재고 현황 */}
        <section className="inventory-section">
          <h2 className="section-title">재고 현황</h2>
          <div className="inventory-grid">
            {inventory.map(item => {
              const status = getStockStatus(item.stock)
              return (
                <div key={item.menuId} className="inventory-card">
                  <div className="inventory-header">
                    <h3 className="inventory-menu-name">{item.menuName}</h3>
                    <span className={`stock-status ${status.className}`}>
                      {status.text}
                    </span>
                  </div>
                  <div className="inventory-stock">
                    <span className="stock-count">{item.stock}개</span>
                  </div>
                  <div className="inventory-controls">
                    <button
                      className="stock-button decrease"
                      onClick={() => handleDecreaseStock(item.menuId)}
                    >
                      -
                    </button>
                    <button
                      className="stock-button increase"
                      onClick={() => handleIncreaseStock(item.menuId)}
                    >
                      +
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* 주문 현황 */}
        <section className="orders-section">
          <h2 className="section-title">주문 현황</h2>
          <div className="orders-list">
            {orders.length === 0 ? (
              <div className="empty-orders">
                <p>주문이 없습니다</p>
              </div>
            ) : (
              orders.map(order => (
                <div key={order.orderId} className="order-item">
                  <div className="order-info">
                    <span className="order-date">
                      {formatDate(order.createdAt)}
                    </span>
                    <span className="order-items">
                      {order.items.map((item, idx) => (
                        <span key={idx}>
                          {item.menuName} x {item.quantity}
                          {idx < order.items.length - 1 ? ', ' : ''}
                        </span>
                      ))}
                    </span>
                    <span className="order-amount">
                      {order.totalAmount.toLocaleString()}원
                    </span>
                  </div>
                  {order.status !== 'completed' && (
                    <button
                      className="order-action-button"
                      onClick={() => handleOrderStatusChange(order.orderId, getNextStatus(order.status))}
                    >
                      {getOrderButtonText(order.status)}
                    </button>
                  )}
                  {order.status === 'completed' && (
                    <span className="order-completed">완료</span>
                  )}
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  )
}

export default AdminPage
