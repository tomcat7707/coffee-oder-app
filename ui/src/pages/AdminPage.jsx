import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { statisticsApi, inventoryApi, orderApi } from '../services/api'
import './AdminPage.css'

function AdminPage() {
  const navigate = useNavigate()
  const [statistics, setStatistics] = useState({
    total: 0,
    received: 0,
    inProgress: 0,
    completed: 0
  })
  const [inventory, setInventory] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // 데이터 로드
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // 통계, 재고, 주문 데이터 병렬 로드
      const [statsData, inventoryData, ordersData] = await Promise.all([
        statisticsApi.getStatistics(),
        inventoryApi.getInventory(),
        orderApi.getOrders()
      ])
      
      setStatistics(statsData)
      setInventory(inventoryData)
      setOrders(ordersData)
    } catch (err) {
      console.error('Failed to load admin data:', err)
      setError('데이터를 불러오는데 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  // 재고 상태 판단
  const getStockStatus = (stock) => {
    if (stock === 0) return { text: '품절', className: 'status-out' }
    if (stock < 5) return { text: '주의', className: 'status-warning' }
    return { text: '정상', className: 'status-normal' }
  }

  // 재고 증가
  const handleIncreaseStock = async (menuId) => {
    try {
      const item = inventory.find(i => i.menuId === menuId)
      await inventoryApi.updateStock(menuId, item.stock + 1)
      await loadData() // 데이터 새로고침
    } catch (err) {
      console.error('Failed to increase stock:', err)
      alert('재고 증가에 실패했습니다')
    }
  }

  // 재고 감소
  const handleDecreaseStock = async (menuId) => {
    try {
      const item = inventory.find(i => i.menuId === menuId)
      if (item.stock > 0) {
        await inventoryApi.updateStock(menuId, item.stock - 1)
        await loadData() // 데이터 새로고침
      }
    } catch (err) {
      console.error('Failed to decrease stock:', err)
      alert('재고 감소에 실패했습니다')
    }
  }

  // 주문 상태 변경
  const handleOrderStatusChange = async (orderId, newStatus) => {
    try {
      await orderApi.updateOrderStatus(orderId, newStatus)
      await loadData() // 데이터 새로고침
    } catch (err) {
      console.error('Failed to update order status:', err)
      alert('주문 상태 변경에 실패했습니다')
    }
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
        {/* 로딩 상태 */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '40px', fontSize: '18px' }}>
            데이터를 불러오는 중...
          </div>
        )}

        {/* 에러 상태 */}
        {error && (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p style={{ color: '#e74c3c', marginBottom: '16px' }}>{error}</p>
            <button onClick={loadData} style={{ padding: '8px 16px', cursor: 'pointer' }}>
              다시 시도
            </button>
          </div>
        )}

        {/* 정상 상태 */}
        {!loading && !error && (
          <>
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

        {/* 접수된 주문 */}
        <section className="orders-section">
          <h2 className="section-title">접수된 주문</h2>
          <div className="orders-list">
            {orders.filter(order => order.status === 'received' || order.status === 'pending').length === 0 ? (
              <div className="empty-orders">
                <p className="empty-orders-text">접수된 주문이 없습니다</p>
              </div>
            ) : (
              orders
                .filter(order => order.status === 'received' || order.status === 'pending')
                .map(order => (
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
                    <button
                      className="order-action-button start"
                      onClick={() => handleOrderStatusChange(order.orderId, getNextStatus(order.status))}
                    >
                      {getOrderButtonText(order.status)}
                    </button>
                  </div>
                ))
            )}
          </div>
        </section>

        {/* 제조중인 주문 */}
        <section className="orders-section">
          <h2 className="section-title">제조중인 주문</h2>
          <div className="orders-list">
            {orders.filter(order => order.status === 'inProgress').length === 0 ? (
              <div className="empty-orders">
                <p className="empty-orders-text">제조중인 주문이 없습니다</p>
              </div>
            ) : (
              orders
                .filter(order => order.status === 'inProgress')
                .map(order => (
                  <div key={order.orderId} className="order-item in-progress">
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
                    <button
                      className="order-action-button complete"
                      onClick={() => handleOrderStatusChange(order.orderId, getNextStatus(order.status))}
                    >
                      제조 완료
                    </button>
                  </div>
                ))
            )}
          </div>
        </section>
          </>
        )}
      </main>
    </div>
  )
}

export default AdminPage
