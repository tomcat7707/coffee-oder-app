import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { statisticsApi, inventoryApi, orderApi, menuApi, optionApi } from '../services/api'
import './AdminPage.css'

function AdminPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('inventory') // 'inventory', 'orders', 'menus'
  const [statistics, setStatistics] = useState({
    total: 0,
    received: 0,
    inProgress: 0,
    completed: 0
  })
  const [inventory, setInventory] = useState([])
  const [orders, setOrders] = useState([])
  const [menus, setMenus] = useState([])
  const [options, setOptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // 모달 상태
  const [showMenuModal, setShowMenuModal] = useState(false)
  const [showOptionModal, setShowOptionModal] = useState(false)
  const [editingMenu, setEditingMenu] = useState(null)
  const [editingOption, setEditingOption] = useState(null)

  // 데이터 로드
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // 통계, 재고, 주문 데이터 병렬 로드
      const [statsData, inventoryData, ordersData, menusData, optionsData] = await Promise.all([
        statisticsApi.getStatistics(),
        inventoryApi.getInventory(),
        orderApi.getOrders(),
        menuApi.getAllMenus(),
        optionApi.getAllOptions()
      ])
      
      setStatistics(statsData)
      setInventory(inventoryData)
      setOrders(ordersData)
      setMenus(menusData)
      setOptions(optionsData)
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

  // 메뉴 추가/수정 핸들러
  const handleMenuSave = async (menuData) => {
    try {
      if (editingMenu) {
        await menuApi.updateMenu(editingMenu.menuId, menuData)
      } else {
        await menuApi.createMenu(menuData)
      }
      setShowMenuModal(false)
      setEditingMenu(null)
      await loadData()
    } catch (err) {
      console.error('Failed to save menu:', err)
      alert('메뉴 저장에 실패했습니다')
    }
  }

  // 메뉴 삭제 핸들러
  const handleMenuDelete = async (menuId) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    
    try {
      await menuApi.deleteMenu(menuId)
      await loadData()
    } catch (err) {
      console.error('Failed to delete menu:', err)
      alert(err.message || '메뉴 삭제에 실패했습니다')
    }
  }

  // 옵션 추가/수정 핸들러
  const handleOptionSave = async (optionData) => {
    try {
      if (editingOption) {
        await optionApi.updateOption(editingOption.optionId, optionData)
      } else {
        await optionApi.createOption(optionData)
      }
      setShowOptionModal(false)
      setEditingOption(null)
      await loadData()
    } catch (err) {
      console.error('Failed to save option:', err)
      alert('옵션 저장에 실패했습니다')
    }
  }

  // 옵션 삭제 핸들러
  const handleOptionDelete = async (optionId) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    
    try {
      await optionApi.deleteOption(optionId)
      await loadData()
    } catch (err) {
      console.error('Failed to delete option:', err)
      alert(err.message || '옵션 삭제에 실패했습니다')
    }
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
        {/* 탭 네비게이션 */}
        <div className="admin-tabs">
          <button 
            className={`admin-tab ${activeTab === 'inventory' ? 'active' : ''}`}
            onClick={() => setActiveTab('inventory')}
          >
            재고관리
          </button>
          <button 
            className={`admin-tab ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            주문현황
          </button>
          <button 
            className={`admin-tab ${activeTab === 'menus' ? 'active' : ''}`}
            onClick={() => setActiveTab('menus')}
          >
            메뉴관리
          </button>
        </div>

        {/* 재고관리 탭 */}
        {activeTab === 'inventory' && (
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
          </>
        )}

        {/* 주문현황 탭 */}
        {activeTab === 'orders' && (
          <>
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

        {/* 메뉴관리 탭 */}
        {activeTab === 'menus' && (
          <>
        <section className="menu-management-section">
          <div className="section-header">
            <h2 className="section-title">메뉴 관리</h2>
            <button 
              className="add-button"
              onClick={() => {
                setEditingMenu(null)
                setShowMenuModal(true)
              }}
            >
              + 메뉴 추가
            </button>
          </div>
          
          <div className="menu-table">
            <table>
              <thead>
                <tr>
                  <th>이미지</th>
                  <th>메뉴명</th>
                  <th>설명</th>
                  <th>가격</th>
                  <th>재고</th>
                  <th>작업</th>
                </tr>
              </thead>
              <tbody>
                {menus.map(menu => (
                  <tr key={menu.menuId}>
                    <td>
                      {menu.imageUrl ? (
                        <img src={menu.imageUrl} alt={menu.name} className="menu-thumbnail" />
                      ) : (
                        <div className="menu-thumbnail-placeholder">이미지 없음</div>
                      )}
                    </td>
                    <td>{menu.name}</td>
                    <td>{menu.description}</td>
                    <td>{menu.price.toLocaleString()}원</td>
                    <td>{menu.stock}개</td>
                    <td>
                      <button 
                        className="action-button edit"
                        onClick={() => {
                          setEditingMenu(menu)
                          setShowMenuModal(true)
                        }}
                      >
                        수정
                      </button>
                      <button 
                        className="action-button delete"
                        onClick={() => handleMenuDelete(menu.menuId)}
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="option-management-section">
          <div className="section-header">
            <h2 className="section-title">옵션 관리</h2>
            <button 
              className="add-button"
              onClick={() => {
                setEditingOption(null)
                setShowOptionModal(true)
              }}
            >
              + 옵션 추가
            </button>
          </div>
          
          <div className="option-list">
            {options.map(option => (
              <div key={option.optionId} className="option-item">
                <div className="option-info">
                  <span className="option-name">{option.name}</span>
                  <span className="option-price">+{option.price.toLocaleString()}원</span>
                </div>
                <div className="option-actions">
                  <button 
                    className="action-button edit"
                    onClick={() => {
                      setEditingOption(option)
                      setShowOptionModal(true)
                    }}
                  >
                    수정
                  </button>
                  <button 
                    className="action-button delete"
                    onClick={() => handleOptionDelete(option.optionId)}
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
          </>
        )}
          </>
        )}
      </main>

      {/* 메뉴 추가/수정 모달 */}
      {showMenuModal && (
        <MenuModal
          menu={editingMenu}
          onSave={handleMenuSave}
          onClose={() => {
            setShowMenuModal(false)
            setEditingMenu(null)
          }}
        />
      )}

      {/* 옵션 추가/수정 모달 */}
      {showOptionModal && (
        <OptionModal
          option={editingOption}
          onSave={handleOptionSave}
          onClose={() => {
            setShowOptionModal(false)
            setEditingOption(null)
          }}
        />
      )}
    </div>
  )
}

// 메뉴 모달 컴포넌트
function MenuModal({ menu, onSave, onClose }) {
  const [formData, setFormData] = useState({
    name: menu?.name || '',
    description: menu?.description || '',
    price: menu?.price || '',
    stock: menu?.stock || 0,
    imageUrl: menu?.imageUrl || ''
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.name || !formData.price) {
      alert('메뉴명과 가격은 필수입니다')
      return
    }
    onSave(formData)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2>{menu ? '메뉴 수정' : '메뉴 추가'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>메뉴명 *</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label>설명</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              rows={3}
            />
          </div>
          <div className="form-group">
            <label>가격 *</label>
            <input
              type="number"
              value={formData.price}
              onChange={e => setFormData({...formData, price: e.target.value})}
              required
              min="0"
            />
          </div>
          <div className="form-group">
            <label>재고</label>
            <input
              type="number"
              value={formData.stock}
              onChange={e => setFormData({...formData, stock: e.target.value})}
              min="0"
            />
          </div>
          <div className="form-group">
            <label>이미지 URL</label>
            <input
              type="text"
              value={formData.imageUrl}
              onChange={e => setFormData({...formData, imageUrl: e.target.value})}
              placeholder="https://example.com/image.jpg"
            />
            {formData.imageUrl && (
              <img src={formData.imageUrl} alt="미리보기" className="image-preview" />
            )}
          </div>
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="cancel-button">취소</button>
            <button type="submit" className="save-button">저장</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// 옵션 모달 컴포넌트
function OptionModal({ option, onSave, onClose }) {
  const [formData, setFormData] = useState({
    name: option?.name || '',
    price: option?.price || 0
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.name) {
      alert('옵션명은 필수입니다')
      return
    }
    onSave(formData)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2>{option ? '옵션 수정' : '옵션 추가'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>옵션명 *</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label>추가 가격</label>
            <input
              type="number"
              value={formData.price}
              onChange={e => setFormData({...formData, price: e.target.value})}
              min="0"
            />
          </div>
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="cancel-button">취소</button>
            <button type="submit" className="save-button">저장</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AdminPage
