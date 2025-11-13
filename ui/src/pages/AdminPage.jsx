import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { statisticsApi, inventoryApi, orderApi, menuApi, optionApi, optionPresetApi } from '../services/api'
import './AdminPage.css'

function AdminPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('orders') // 'inventory', 'orders', 'menus'
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
  const [optionPresets, setOptionPresets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // 모달 상태
  const [showMenuModal, setShowMenuModal] = useState(false)
  const [showOptionModal, setShowOptionModal] = useState(false)
  const [showPresetModal, setShowPresetModal] = useState(false)
  const [showPresetManagerModal, setShowPresetManagerModal] = useState(false)
  const [editingMenu, setEditingMenu] = useState(null)
  const [editingOption, setEditingOption] = useState(null)
  const [targetMenuForOption, setTargetMenuForOption] = useState(null)
  const [presetTargetMenu, setPresetTargetMenu] = useState(null)
  const [expandedOptionMenus, setExpandedOptionMenus] = useState({})

  // 데이터 로드
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // 통계, 재고, 주문 데이터 병렬 로드
      const [statsData, inventoryData, ordersData, menusData, optionsData, presetsData] = await Promise.all([
        statisticsApi.getStatistics(),
        inventoryApi.getInventory(),
        orderApi.getOrders(),
        menuApi.getAllMenus(),
        optionApi.getAllOptions(),
        optionPresetApi.getOptionPresets()
      ])
      
      setStatistics(statsData)
      setInventory(inventoryData)
      setOrders(ordersData)
      setMenus(menusData)
      setOptions(optionsData)
      setOptionPresets(presetsData)
      setExpandedOptionMenus(prev => {
        const nextState = {}
        menusData.forEach(menu => {
          nextState[menu.menuId] = prev?.[menu.menuId] ?? false
        })
        return nextState
      })
    } catch (err) {
      console.error('Failed to load admin data:', err)
      setError('데이터를 불러오는데 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let isCancelled = false
    let isRefreshing = false

    const pollOrders = async () => {
      if (isCancelled || isRefreshing) return

      isRefreshing = true

      try {
        const [statsData, ordersData] = await Promise.all([
          statisticsApi.getStatistics(),
          orderApi.getOrders()
        ])

        if (!isCancelled) {
          setStatistics(statsData)
          setOrders(ordersData)
        }
      } catch (err) {
        console.error('Failed to refresh orders:', err)
      } finally {
        isRefreshing = false
      }
    }

    const intervalId = setInterval(pollOrders, 5000)

    return () => {
      isCancelled = true
      clearInterval(intervalId)
    }
  }, [])

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

  const handleOrderCancel = async (orderId) => {
    if (!confirm('정말 주문을 취소하시겠습니까?')) return

    try {
      await orderApi.cancelOrder(orderId)
      await loadData()
    } catch (err) {
      console.error('Failed to cancel order:', err)
      alert(err.message || '주문 취소에 실패했습니다')
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
  const handleMenuSave = async (menuData, imageFile) => {
    try {
      let savedMenu
      if (editingMenu) {
        // 메뉴 수정
        savedMenu = await menuApi.updateMenu(editingMenu.menuId, menuData)
        
        // 이미지가 선택되었으면 업로드
        if (imageFile) {
          await menuApi.uploadMenuImage(editingMenu.menuId, imageFile)
        }
      } else {
        // 메뉴 추가
        savedMenu = await menuApi.createMenu(menuData)
        
        // 이미지가 선택되었으면 업로드
        if (imageFile && savedMenu.menuId) {
          await menuApi.uploadMenuImage(savedMenu.menuId, imageFile)
        }
      }
      
      setShowMenuModal(false)
      setEditingMenu(null)
      await loadData()
    } catch (err) {
      console.error('Failed to save menu:', err)
      alert('메뉴 저장에 실패했습니다')
      throw err
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
      const menuId = Number(optionData.menuId)
      const parsedName = optionData.name?.trim() || ''
      const rawPrice = optionData.price === '' || optionData.price === undefined
        ? 0
        : Number(optionData.price)

      if (!menuId || Number.isNaN(menuId)) {
        alert('연결할 메뉴를 선택해주세요')
        return
      }

      if (!parsedName) {
        alert('옵션명은 필수입니다')
        return
      }

      if (!Number.isFinite(rawPrice)) {
        alert('가격 형식이 올바르지 않습니다')
        return
      }

      const roundedPrice = Math.round(rawPrice)

      if (roundedPrice < 0) {
        alert('가격은 0 이상의 정수여야 합니다')
        return
      }

      const payload = {
        menuId,
        name: parsedName,
        price: roundedPrice
      }

      if (editingOption) {
        await optionApi.updateOption(editingOption.optionId, payload)
      } else {
        await optionApi.createOption(payload)
      }
      setShowOptionModal(false)
      setEditingOption(null)
      setTargetMenuForOption(null)
      await loadData()
      setExpandedOptionMenus(prev => ({
        ...prev,
        [menuId]: true
      }))
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

  const handlePresetApply = async (menuId, preset) => {
    if (!preset) return

    try {
      for (const presetOption of preset.options) {
        await optionApi.createOption({
          menuId,
          name: presetOption.name,
          price: presetOption.price,
        })
      }

      await loadData()
      setExpandedOptionMenus(prev => ({
        ...prev,
        [menuId]: true,
      }))
      alert(`${preset.name} 프리셋이 적용되었습니다.`)
    } catch (err) {
      console.error('Failed to apply preset:', err)
      alert(err.message || '프리셋 적용에 실패했습니다')
    }
  }

  const refreshOptionPresets = async () => {
    const presets = await optionPresetApi.getOptionPresets()
    setOptionPresets(presets)
  }

  const handleOptionPresetCreate = async (presetData) => {
    try {
      const created = await optionPresetApi.createOptionPreset(presetData)
      await refreshOptionPresets()
      return created
    } catch (err) {
      console.error('Failed to create option preset:', err)
      throw err
    }
  }

  const handleOptionPresetUpdate = async (presetId, presetData) => {
    try {
      const updated = await optionPresetApi.updateOptionPreset(presetId, presetData)
      await refreshOptionPresets()
      return updated
    } catch (err) {
      console.error('Failed to update option preset:', err)
      throw err
    }
  }

  const handleOptionPresetDelete = async (presetId) => {
    try {
      await optionPresetApi.deleteOptionPreset(presetId)
      await refreshOptionPresets()
    } catch (err) {
      console.error('Failed to delete option preset:', err)
      throw err
    }
  }

  const toggleOptionSection = (menuId) => {
    setExpandedOptionMenus(prev => ({
      ...prev,
      [menuId]: !prev?.[menuId]
    }))
  }

  // 주문 상태에 따른 버튼 텍스트
  const getOrderButtonText = (status) => {
    if (status === 'pending') return '주문 접수'
    if (status === 'received') return '제조 시작'
    if (status === 'inProgress') return '제조 완료'
    if (status === 'cancelled') return '취소됨'
    return '완료'
  }

  // 주문 상태에 따른 다음 상태
  const getNextStatus = (status) => {
    if (status === 'pending') return 'received'
    if (status === 'received') return 'inProgress'
    if (status === 'inProgress') return 'completed'
    if (status === 'cancelled') return 'cancelled'
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
                    <div className="order-header">
                      <div className="order-header-info">
                        <span className="order-time-badge">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12 6 12 12 16 14"/>
                          </svg>
                          {formatDate(order.createdAt)}
                        </span>
                        <span className="order-id-badge">주문 #{order.orderId}</span>
                      </div>
                      <div className="order-total">
                        <span className="total-label">합계</span>
                        <span className="total-amount">{order.totalAmount.toLocaleString()}원</span>
                      </div>
                    </div>
                    
                    <div className="order-items-container">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="menu-item-card">
                          <div className="menu-item-main">
                            <div className="menu-name-section">
                              <span className="menu-bullet">•</span>
                              <span className="menu-name">{item.menuName}</span>
                            </div>
                            <span className="menu-quantity">x {item.quantity}</span>
                          </div>
                          {item.options && item.options.length > 0 && (
                            <div className="menu-options">
                              {item.options.map((opt, optIdx) => (
                                <span key={optIdx} className="option-tag">
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="20 6 9 17 4 12"/>
                                  </svg>
                                  {opt.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    <div className="order-actions">
                      <button
                        className="order-action-button start"
                        onClick={() => handleOrderStatusChange(order.orderId, getNextStatus(order.status))}
                      >
                        {getOrderButtonText(order.status)}
                      </button>
                      <button
                        className="order-action-button cancel"
                        onClick={() => handleOrderCancel(order.orderId)}
                      >
                        주문 취소
                      </button>
                    </div>
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
                    <div className="order-header">
                      <div className="order-header-info">
                        <span className="order-time-badge">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12 6 12 12 16 14"/>
                          </svg>
                          {formatDate(order.createdAt)}
                        </span>
                        <span className="order-id-badge">주문 #{order.orderId}</span>
                      </div>
                      <div className="order-total">
                        <span className="total-label">합계</span>
                        <span className="total-amount">{order.totalAmount.toLocaleString()}원</span>
                      </div>
                    </div>
                    
                    <div className="order-items-container">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="menu-item-card">
                          <div className="menu-item-main">
                            <div className="menu-name-section">
                              <span className="menu-bullet">•</span>
                              <span className="menu-name">{item.menuName}</span>
                            </div>
                            <span className="menu-quantity">x {item.quantity}</span>
                          </div>
                          {item.options && item.options.length > 0 && (
                            <div className="menu-options">
                              {item.options.map((opt, optIdx) => (
                                <span key={optIdx} className="option-tag">
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="20 6 9 17 4 12"/>
                                  </svg>
                                  {opt.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    <div className="order-actions">
                      <button
                        className="order-action-button complete"
                        onClick={() => handleOrderStatusChange(order.orderId, getNextStatus(order.status))}
                      >
                        제조 완료
                      </button>
                    </div>
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
            <div className="section-header-actions">
              <button
                className="preset-manage-button"
                type="button"
                onClick={async () => {
                  try {
                    await refreshOptionPresets()
                  } catch (err) {
                    console.error('Failed to load option presets:', err)
                    alert(err.message || '프리셋 정보를 불러오는데 실패했습니다')
                    return
                  }
                  setShowPresetManagerModal(true)
                }}
              >
                프리셋 관리
              </button>
              <button 
                className="add-button"
                onClick={() => {
                  if (menus.length === 0) {
                    alert('옵션을 추가하려면 먼저 메뉴를 등록해주세요')
                    return
                  }
                  setEditingOption(null)
                  setTargetMenuForOption(null)
                  setShowOptionModal(true)
                }}
              >
                + 옵션 추가
              </button>
            </div>
          </div>
          {menus.length === 0 ? (
            <div className="option-empty">등록된 메뉴가 없습니다. 먼저 메뉴를 추가해주세요.</div>
          ) : (
            <div className="option-menu-groups">
              {menus.map(menu => {
                const menuOptions = options.filter(option => option.menuId === menu.menuId)
                const isExpanded = !!expandedOptionMenus[menu.menuId]

                return (
                  <div key={menu.menuId} className={`option-menu-card${isExpanded ? '' : ' collapsed'}`}>
                    <div className="option-menu-header">
                      <div>
                        <h3 className="option-menu-name">{menu.name}</h3>
                        <span className="option-menu-count">옵션 {menuOptions.length}개</span>
                      </div>
                      <div className="option-menu-actions">
                        <button
                          type="button"
                          className="option-toggle-button"
                          onClick={() => toggleOptionSection(menu.menuId)}
                        >
                          {isExpanded ? '옵션 접기' : '옵션 펼치기'}
                        </button>
                        <button
                          type="button"
                          className="option-preset-button"
                          onClick={() => {
                            setPresetTargetMenu(menu)
                            setShowPresetModal(true)
                          }}
                        >
                          프리셋 적용
                        </button>
                        <button
                          className="option-add-button"
                          onClick={() => {
                            setExpandedOptionMenus(prev => ({ ...prev, [menu.menuId]: true }))
                            setEditingOption(null)
                            setTargetMenuForOption(menu)
                            setShowOptionModal(true)
                          }}
                        >
                          + 옵션 추가
                        </button>
                      </div>
                    </div>
                    {!isExpanded ? (
                      menuOptions.length === 0 ? (
                        <div className="option-collapsed-hint empty">등록된 옵션이 없습니다</div>
                      ) : (
                        <div className="option-collapsed-hint">
                          <span className="collapsed-label">옵션 미리보기</span>
                          <div className="collapsed-options">
                            {menuOptions.slice(0, 3).map(option => (
                              <span key={option.optionId} className="collapsed-option-pill">
                                <span>{option.name}</span>
                                {option.price > 0 && (
                                  <span className="collapsed-option-price">+{option.price.toLocaleString()}원</span>
                                )}
                              </span>
                            ))}
                            {menuOptions.length > 3 && (
                              <span className="collapsed-more">+{menuOptions.length - 3}개</span>
                            )}
                          </div>
                        </div>
                      )
                    ) : menuOptions.length === 0 ? (
                      <div className="option-empty">등록된 옵션이 없습니다</div>
                    ) : (
                      <div className="option-list-group">
                        {menuOptions.map(option => (
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
                                  const relatedMenu = menus.find(m => m.menuId === option.menuId) || null
                                  setTargetMenuForOption(relatedMenu)
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
                    )}
                  </div>
                )
              })}
            </div>
          )}
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
          menus={menus}
          lockedMenu={targetMenuForOption}
          defaultMenuId={targetMenuForOption?.menuId ?? (menus[0]?.menuId ?? '')}
          presets={optionPresets}
          onSave={handleOptionSave}
          onClose={() => {
            setShowOptionModal(false)
            setEditingOption(null)
            setTargetMenuForOption(null)
          }}
        />
      )}

      {showPresetModal && presetTargetMenu && (
        <OptionPresetModal
          menu={presetTargetMenu}
          presets={optionPresets}
          onApply={async (presetId) => {
            const preset = optionPresets.find(item => item.presetId === presetId)
            if (!preset) {
              alert('선택한 프리셋을 찾을 수 없습니다')
              return
            }
            await handlePresetApply(presetTargetMenu.menuId, preset)
            setShowPresetModal(false)
            setPresetTargetMenu(null)
          }}
          onClose={() => {
            setShowPresetModal(false)
            setPresetTargetMenu(null)
          }}
        />
      )}

      {showPresetManagerModal && (
        <OptionPresetManagerModal
          presets={optionPresets}
          onCreate={handleOptionPresetCreate}
          onUpdate={handleOptionPresetUpdate}
          onDelete={handleOptionPresetDelete}
          onClose={() => setShowPresetManagerModal(false)}
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
  const [selectedImage, setSelectedImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(menu?.imageUrl || '')
  const [uploading, setUploading] = useState(false)

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // 파일 크기 체크 (5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('이미지 크기는 5MB 이하여야 합니다')
        return
      }

      // 이미지 타입 체크
      if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 업로드 가능합니다')
        return
      }

      setSelectedImage(file)
      
      // 미리보기 생성
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name || !formData.price) {
      alert('메뉴명과 가격은 필수입니다')
      return
    }

    setUploading(true)
    try {
      // 메뉴 정보와 이미지 파일을 함께 전달
      await onSave(formData, selectedImage)
    } catch (error) {
      console.error('Error:', error)
      alert('저장 중 오류가 발생했습니다')
    } finally {
      setUploading(false)
    }
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
            <label>이미지 업로드</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
            />
            {imagePreview && (
              <div className="image-preview-container">
                <img src={imagePreview} alt="미리보기" className="image-preview" />
              </div>
            )}
          </div>
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="cancel-button" disabled={uploading}>
              취소
            </button>
            <button type="submit" className="save-button" disabled={uploading}>
              {uploading ? '저장 중...' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// 옵션 모달 컴포넌트
function OptionModal({ option, menus = [], lockedMenu = null, defaultMenuId, presets = [], onSave, onClose }) {
  const lockedMenuId = lockedMenu?.menuId ? String(lockedMenu.menuId) : null
  const resolveMenuId = () => {
    if (option?.menuId) return String(option.menuId)
    if (lockedMenuId) return lockedMenuId
    return defaultMenuId ? String(defaultMenuId) : ''
  }

  const [formData, setFormData] = useState({
    menuId: resolveMenuId(),
    name: option?.name || '',
    price: option ? String(option.price) : '0'
  })

  useEffect(() => {
    setFormData({
      menuId: resolveMenuId(),
      name: option?.name || '',
      price: option ? String(option.price) : '0'
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [option, defaultMenuId, lockedMenuId])

  const applyPresetOption = (presetOption) => {
    if (!presetOption) return

    setFormData(prev => ({
      ...prev,
      name: presetOption.name,
      price: String(Number(presetOption.price) || 0)
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    const targetMenuId = lockedMenuId ?? formData.menuId

    if (!targetMenuId) {
      alert('연결할 메뉴를 선택해주세요')
      return
    }

    const trimmedName = formData.name.trim()
    if (!trimmedName) {
      alert('옵션명은 필수입니다')
      return
    }

    const priceValue = formData.price === '' ? 0 : Number(formData.price)
    if (!Number.isFinite(priceValue)) {
      alert('가격 형식이 올바르지 않습니다')
      return
    }

    const roundedPrice = Math.round(priceValue)
    if (roundedPrice < 0) {
      alert('가격은 0 이상의 정수여야 합니다')
      return
    }

    onSave({
      menuId: Number(targetMenuId),
      name: trimmedName,
      price: roundedPrice
    })
  }

  const hasPresets = Array.isArray(presets) && presets.length > 0

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2>{option ? '옵션 수정' : '옵션 추가'}</h2>
        <form onSubmit={handleSubmit}>
          {lockedMenuId ? (
            <div className="form-static">
              <label>대상 메뉴</label>
              <div className="form-static-value">{lockedMenu?.name || ''}</div>
            </div>
          ) : (
            <div className="form-group">
              <label>연결 메뉴 *</label>
              <select
                value={formData.menuId}
                onChange={e => setFormData({ ...formData, menuId: e.target.value })}
                required
              >
                <option value="">메뉴를 선택하세요</option>
                {menus.map(menu => (
                  <option key={menu.menuId} value={menu.menuId}>
                    {menu.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {hasPresets && (
            <div className="preset-quick-section">
              <div className="preset-quick-header">
                <span className="preset-quick-title">프리셋에서 불러오기</span>
                <span className="preset-quick-hint">옵션명을 클릭하면 아래 입력이 채워집니다</span>
              </div>
              <div className="preset-quick-list">
                {presets.map(preset => (
                  <div key={preset.presetId} className="preset-quick-card">
                    <div className="preset-quick-card-header">
                      <span className="preset-quick-card-title">{preset.name}</span>
                      {preset.description && (
                        <span className="preset-quick-card-description">{preset.description}</span>
                      )}
                    </div>
                    <div className="preset-quick-options">
                      {(preset.options || []).length === 0 ? (
                        <span className="preset-quick-empty">등록된 옵션이 없습니다</span>
                      ) : (
                        preset.options.map(optionItem => (
                          <button
                            type="button"
                            key={`${preset.presetId}-${optionItem.optionPresetOptionId || optionItem.name}`}
                            className="preset-quick-option"
                            onClick={() => applyPresetOption(optionItem)}
                          >
                            <span>{optionItem.name}</span>
                            <span className="preset-quick-option-price">+{Number(optionItem.price).toLocaleString()}원</span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="form-group">
            <label>옵션명 *</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>추가 가격</label>
            <input
              type="number"
              value={formData.price}
              onChange={e => setFormData({ ...formData, price: e.target.value })}
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

function OptionPresetModal({ menu, presets = [], onApply, onClose }) {
  const [selectedPresetId, setSelectedPresetId] = useState(presets[0]?.presetId || '')

  useEffect(() => {
    if (presets.length > 0 && !selectedPresetId) {
      setSelectedPresetId(presets[0].presetId)
    }
  }, [presets, selectedPresetId])

  const selectedPreset = presets.find(preset => preset.presetId === selectedPresetId) || null

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!selectedPresetId) {
      alert('적용할 프리셋을 선택해주세요')
      return
    }

    await onApply(selectedPresetId)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={e => e.stopPropagation()}>
        <h2>{menu ? `${menu.name} - 프리셋 적용` : '프리셋 적용'}</h2>
        <form onSubmit={handleSubmit} className="preset-form">
          <div className="form-group">
            <label>프리셋 선택 *</label>
            <div className="preset-list">
              {presets.length === 0 ? (
                <div className="preset-empty">등록된 프리셋이 없습니다.</div>
              ) : (
                presets.map(preset => (
                  <label key={preset.presetId} className={`preset-card${selectedPresetId === preset.presetId ? ' selected' : ''}`}>
                    <div className="preset-card-header">
                      <input
                        type="radio"
                        name="preset"
                        value={preset.presetId}
                        checked={selectedPresetId === preset.presetId}
                        onChange={() => setSelectedPresetId(preset.presetId)}
                      />
                      <div className="preset-card-title">{preset.name}</div>
                    </div>
                    {preset.description && (
                      <p className="preset-card-description">{preset.description}</p>
                    )}
                    <ul className="preset-option-list">
                      {(preset.options || []).map((option, index) => (
                        <li key={option.optionPresetOptionId || `${preset.presetId}-${index}`}>
                          <span className="preset-option-name">{option.name}</span>
                          <span className="preset-option-price">+{Number(option.price).toLocaleString()}원</span>
                        </li>
                      ))}
                    </ul>
                  </label>
                ))
              )}
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="cancel-button">취소</button>
            <button type="submit" className="save-button" disabled={presets.length === 0}>적용</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function OptionPresetManagerModal({ presets = [], onCreate, onUpdate, onDelete, onClose }) {
  const buildFormFromPreset = (preset) => ({
    name: preset?.name || '',
    description: preset?.description || '',
    options: (preset?.options || []).length > 0
      ? preset.options.map(option => ({
          name: option.name,
          price: String(Number(option.price) || 0)
        }))
      : [{ name: '', price: '0' }]
  })

  const [selectedPresetId, setSelectedPresetId] = useState(presets[0]?.presetId ?? null)
  const [formData, setFormData] = useState(buildFormFromPreset(presets[0]))
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [pendingSelectId, setPendingSelectId] = useState(null)

  useEffect(() => {
    if (pendingSelectId) {
      const pendingPreset = presets.find(preset => preset.presetId === pendingSelectId)
      if (pendingPreset) {
        setSelectedPresetId(pendingPreset.presetId)
        setFormData(buildFormFromPreset(pendingPreset))
        setPendingSelectId(null)
        return
      }
    }

    if (selectedPresetId === null) {
      if (presets.length === 0) {
        setFormData(buildFormFromPreset(null))
      }
      return
    }

    if (presets.length === 0) {
      setSelectedPresetId(null)
      setFormData(buildFormFromPreset(null))
      return
    }

    const matched = presets.find(preset => preset.presetId === selectedPresetId)
    if (matched) {
      setFormData(buildFormFromPreset(matched))
    } else {
      setSelectedPresetId(presets[0].presetId)
      setFormData(buildFormFromPreset(presets[0]))
    }
  }, [presets, selectedPresetId, pendingSelectId])

  const handleCreateNew = () => {
    setSelectedPresetId(null)
    setFormData({ name: '', description: '', options: [{ name: '', price: '0' }] })
  }

  const handleOptionFieldChange = (index, field, value) => {
    setFormData(prev => {
      const nextOptions = prev.options.map((option, idx) => (
        idx === index ? { ...option, [field]: value } : option
      ))
      return { ...prev, options: nextOptions }
    })
  }

  const handleAddOptionRow = () => {
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, { name: '', price: '0' }]
    }))
  }

  const handleRemoveOptionRow = (index) => {
    setFormData(prev => {
      if (prev.options.length === 1) {
        alert('옵션은 최소 1개 이상이어야 합니다')
        return prev
      }

      return {
        ...prev,
        options: prev.options.filter((_, idx) => idx !== index)
      }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const trimmedName = formData.name.trim()
    if (!trimmedName) {
      alert('프리셋 이름을 입력해주세요')
      return
    }

    const validOptions = formData.options.map(option => ({
      name: option.name.trim(),
      price: option.price === '' ? 0 : Number(option.price)
    }))

    if (validOptions.some(option => !option.name)) {
      alert('모든 옵션에 이름을 입력해주세요')
      return
    }

    if (validOptions.some(option => !Number.isInteger(option.price) || option.price < 0)) {
      alert('옵션 가격은 0 이상의 정수여야 합니다')
      return
    }

    const payload = {
      name: trimmedName,
      description: formData.description.trim(),
      options: validOptions
    }

    setSaving(true)
    try {
      if (selectedPresetId) {
        const updated = await onUpdate(selectedPresetId, payload)
        if (updated?.presetId) {
          setPendingSelectId(updated.presetId)
        } else {
          setPendingSelectId(selectedPresetId)
        }
        alert('프리셋이 저장되었습니다')
      } else {
        const created = await onCreate(payload)
        if (created?.presetId) {
          setPendingSelectId(created.presetId)
        }
        alert('새 프리셋이 생성되었습니다')
      }
    } catch (err) {
      console.error('Failed to save preset:', err)
      alert(err.message || '프리셋 저장에 실패했습니다')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedPresetId) {
      alert('삭제할 프리셋을 선택해주세요')
      return
    }

    if (!confirm('정말 이 프리셋을 삭제하시겠습니까?')) {
      return
    }

    setDeleting(true)
    try {
      await onDelete(selectedPresetId)
      alert('프리셋이 삭제되었습니다')
      setSelectedPresetId(null)
      setFormData({ name: '', description: '', options: [{ name: '', price: '0' }] })
    } catch (err) {
      console.error('Failed to delete preset:', err)
      alert(err.message || '프리셋 삭제에 실패했습니다')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={e => e.stopPropagation()}>
        <h2>옵션 프리셋 관리</h2>
        <div className="preset-manager">
          <aside className="preset-manager-sidebar">
            <div className="preset-manager-sidebar-header">
              <span className="preset-manager-sidebar-title">프리셋 목록</span>
              <button type="button" className="preset-manager-new" onClick={handleCreateNew}>
                + 새 프리셋
              </button>
            </div>
            <div className="preset-manager-list">
              {presets.length === 0 ? (
                <div className="preset-manager-empty">등록된 프리셋이 없습니다</div>
              ) : (
                presets.map(preset => (
                  <button
                    key={preset.presetId}
                    type="button"
                    className={`preset-manager-item${selectedPresetId === preset.presetId ? ' active' : ''}`}
                    onClick={() => {
                      setSelectedPresetId(preset.presetId)
                      setFormData(buildFormFromPreset(preset))
                    }}
                  >
                    <span className="preset-manager-item-name">{preset.name}</span>
                    <span className="preset-manager-item-count">{(preset.options || []).length}개</span>
                  </button>
                ))
              )}
            </div>
          </aside>
          <div className="preset-manager-form">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>프리셋 이름 *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="예: 라떼 기본 옵션"
                  required
                />
              </div>
              <div className="form-group">
                <label>설명</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  placeholder="프리셋 사용 목적을 메모해두세요"
                />
              </div>
              <div className="preset-option-editor">
                <div className="preset-option-editor-header">
                  <span>옵션 목록 *</span>
                  <button type="button" className="preset-option-add-button" onClick={handleAddOptionRow}>
                    + 옵션 추가
                  </button>
                </div>
                <div className="preset-option-editor-list">
                  {formData.options.map((option, index) => (
                    <div key={index} className="preset-option-row">
                      <input
                        type="text"
                        value={option.name}
                        onChange={e => handleOptionFieldChange(index, 'name', e.target.value)}
                        placeholder="옵션명"
                        required
                      />
                      <input
                        type="number"
                        min="0"
                        value={option.price}
                        onChange={e => handleOptionFieldChange(index, 'price', e.target.value)}
                        placeholder="추가 금액"
                      />
                      <button
                        type="button"
                        className="preset-option-remove"
                        onClick={() => handleRemoveOptionRow(index)}
                        disabled={formData.options.length === 1}
                        title={formData.options.length === 1 ? '옵션은 최소 1개 이상 필요합니다' : '옵션 삭제'}
                      >
                        삭제
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="preset-manager-actions">
                <button type="button" className="cancel-button" onClick={onClose} disabled={saving || deleting}>
                  닫기
                </button>
                <div className="preset-manager-primary-actions">
                  {selectedPresetId && (
                    <button
                      type="button"
                      className="delete-button"
                      onClick={handleDelete}
                      disabled={saving || deleting}
                    >
                      {deleting ? '삭제 중...' : '프리셋 삭제'}
                    </button>
                  )}
                  <button type="submit" className="save-button" disabled={saving || deleting}>
                    {saving ? '저장 중...' : selectedPresetId ? '변경 저장' : '프리셋 생성'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminPage
