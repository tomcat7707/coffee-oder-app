import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { menuApi, orderApi } from '../services/api'
import useOrderCart from '../hooks/useOrderCart'
import './OrderPage.css'

function OrderPage() {
  const navigate = useNavigate()
  const [menus, setMenus] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const {
    cart,
    selectedOptions,
    toggleOption,
    addMenuToCart,
    increaseQuantity,
    decreaseQuantity,
    removeItem,
    clearCart,
    clearSelections,
    totalAmount
  } = useOrderCart()
  const [orderLoading, setOrderLoading] = useState(false)

  // 메뉴 데이터 로드
  useEffect(() => {
    loadMenus()
  }, [])

  const loadMenus = async () => {
    try {
      setLoading(true)
      const data = await menuApi.getMenus()
      setMenus(data)
      setError(null)
    } catch (err) {
      console.error('Failed to load menus:', err)
      setError('메뉴를 불러오는데 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  // 주문하기
  const handleOrder = async () => {
    if (cart.length === 0) return

    try {
      setOrderLoading(true)
      
      // API 요청 형식으로 변환
      const orderData = {
        items: cart.map(item => ({
          menuId: item.menuId,
          quantity: item.quantity,
          options: item.selectedOptions.map(opt => ({
            optionId: opt.optionId
          }))
        }))
      }

      const result = await orderApi.createOrder(orderData)
      alert(`주문이 완료되었습니다!\n주문번호: ${result.orderId}\n총 금액: ${result.totalAmount.toLocaleString()}원`)
      clearCart()
      clearSelections()
    } catch (err) {
      console.error('Order failed:', err)
      alert(err.message || '주문에 실패했습니다')
    } finally {
      setOrderLoading(false)
    }
  }

  return (
    <div className="order-page">
      {/* 헤더 */}
      <header className="header">
        <div className="logo">COZY</div>
        <nav className="navigation">
          <button className="nav-button active">주문하기</button>
          <button className="nav-button" onClick={() => navigate('/admin')}>
            관리자
          </button>
        </nav>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="main-content">
        {/* 로딩 상태 */}
        {loading && (
          <div className="loading-message">메뉴를 불러오는 중...</div>
        )}

        {/* 에러 상태 */}
        {error && (
          <div className="error-message">
            {error}
            <button onClick={loadMenus} className="retry-button">다시 시도</button>
          </div>
        )}

        {/* 메뉴 아이템 섹션 */}
        {!loading && !error && (
          <section className="menu-section">
            <div className="menu-grid">
              {menus.map(menu => (
                <div key={menu.menuId} className="menu-card">
                  {/* 이미지 영역 */}
                  <div className="menu-image">
                    {menu.imageUrl ? (
                      <img src={menu.imageUrl} alt={menu.name} />
                    ) : (
                      <div className="image-placeholder">
                        <div className="placeholder-line line-1"></div>
                        <div className="placeholder-line line-2"></div>
                      </div>
                    )}
                  </div>

                  {/* 메뉴 정보 */}
                  <div className="menu-info">
                    <h3 className="menu-name">{menu.name}</h3>
                    <p className="menu-price">{menu.price.toLocaleString()}원</p>
                    <p className="menu-description">{menu.description}</p>
                    {menu.stock !== undefined && (
                      <p className="menu-stock" style={{ 
                        color: menu.stock > 10 ? '#666' : menu.stock > 0 ? '#ff6b35' : '#e74c3c',
                        fontSize: '14px',
                        marginTop: '8px',
                        fontWeight: menu.stock <= 5 ? 'bold' : 'normal'
                      }}>
                        재고: {menu.stock}개
                      </p>
                    )}
                  </div>

                  {/* 옵션 선택 */}
                  <div className="menu-options">
                    {menu.options.map(option => (
                      <label key={option.optionId} className="option-item">
                        <input
                          type="checkbox"
                          checked={(selectedOptions[menu.menuId] || []).includes(option.optionId)}
                          onChange={() => toggleOption(menu.menuId, option.optionId)}
                        />
                        <span className="option-label">
                          {option.name} (+{option.price}원)
                        </span>
                      </label>
                    ))}
                  </div>

                  {/* 담기 버튼 */}
                  <button 
                    className="add-button"
                    onClick={() => addMenuToCart(menu)}
                  >
                    담기
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 장바구니 섹션 - 항상 표시 */}
        <section className="cart-section">
          <h2 className="cart-title">장바구니</h2>
          
          {cart.length === 0 ? (
            // 빈 장바구니
            <div className="empty-cart">
              <div className="empty-cart-icon">🛒</div>
              <p className="empty-cart-message">장바구니가 비어있습니다</p>
              <p className="empty-cart-hint">원하시는 메뉴를 선택하고 '담기' 버튼을 눌러주세요</p>
            </div>
          ) : (
            // 장바구니에 아이템이 있을 때
            <div className="cart-container">
              {/* 왼쪽: 주문 내역 */}
              <div className="cart-items-container">
                <div className="cart-items">
                  {cart.map((item, index) => (
                    <div key={index} className="cart-item">
                      <div className="cart-item-main">
                        <div className="cart-item-info">
                          <span className="cart-item-name">
                            {item.menuName}
                          </span>
                          {item.selectedOptions.length > 0 && (
                            <span className="cart-item-options">
                              {item.selectedOptions.map(opt => opt.name).join(', ')}
                            </span>
                          )}
                        </div>
                        
                        <div className="cart-item-controls">
                          {/* 수량 조절 */}
                          <div className="quantity-controls">
                            <button 
                              className="quantity-button"
                              onClick={() => decreaseQuantity(index)}
                            >
                              -
                            </button>
                            <span className="quantity-display">{item.quantity}</span>
                            <button 
                              className="quantity-button"
                              onClick={() => increaseQuantity(index)}
                            >
                              +
                            </button>
                          </div>
                          
                          {/* 가격 */}
                          <span className="cart-item-price">
                            {item.totalPrice.toLocaleString()}원
                          </span>
                          
                          {/* 삭제 버튼 */}
                          <button 
                            className="remove-button"
                            onClick={() => removeItem(index)}
                            title="삭제"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 오른쪽: 총 금액 및 주문하기 */}
              <div className="cart-summary">
                <div className="cart-total">
                  <span className="total-label">총 금액</span>
                  <span className="total-amount">{totalAmount.toLocaleString()}원</span>
                </div>

                <button 
                  className="order-button"
                  onClick={handleOrder}
                >
                  주문하기
                </button>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default OrderPage
