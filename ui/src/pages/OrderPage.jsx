import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './OrderPage.css'

// 임시 메뉴 데이터
const MENU_DATA = [
  {
    id: 1,
    name: '아메리카노(ICE)',
    price: 4000,
    description: '시원하고 깔끔한 아이스 아메리카노',
    imageUrl: 'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=400&h=300&fit=crop',
    options: [
      { id: 1, name: '샷 추가', price: 500 },
      { id: 2, name: '시럽 추가', price: 0 }
    ]
  },
  {
    id: 2,
    name: '아메리카노(HOT)',
    price: 4000,
    description: '따뜻하고 진한 아메리카노',
    imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=300&fit=crop',
    options: [
      { id: 1, name: '샷 추가', price: 500 },
      { id: 2, name: '시럽 추가', price: 0 }
    ]
  },
  {
    id: 3,
    name: '카페라떼',
    price: 5000,
    description: '부드럽고 고소한 카페라떼',
    imageUrl: 'https://images.unsplash.com/photo-1561882468-9110e03e0f78?w=400&h=300&fit=crop',
    options: [
      { id: 1, name: '샷 추가', price: 500 },
      { id: 2, name: '시럽 추가', price: 0 }
    ]
  }
]

function OrderPage() {
  const navigate = useNavigate()
  const [cart, setCart] = useState([])
  const [selectedOptions, setSelectedOptions] = useState({})

  // 옵션 선택/해제 핸들러
  const handleOptionChange = (menuId, optionId) => {
    setSelectedOptions(prev => {
      const menuOptions = prev[menuId] || []
      const isSelected = menuOptions.includes(optionId)
      
      return {
        ...prev,
        [menuId]: isSelected
          ? menuOptions.filter(id => id !== optionId)
          : [...menuOptions, optionId]
      }
    })
  }

  // 장바구니에 추가
  const handleAddToCart = (menu) => {
    const selectedOptionIds = selectedOptions[menu.id] || []
    const selectedMenuOptions = menu.options.filter(opt => 
      selectedOptionIds.includes(opt.id)
    )
    
    const optionsPrice = selectedMenuOptions.reduce((sum, opt) => sum + opt.price, 0)
    const totalPrice = menu.price + optionsPrice

    const cartItem = {
      menuId: menu.id,
      menuName: menu.name,
      basePrice: menu.price,
      selectedOptions: selectedMenuOptions,
      quantity: 1,
      totalPrice: totalPrice
    }

    // 동일한 메뉴+옵션 조합이 있는지 확인
    const existingIndex = cart.findIndex(item => 
      item.menuId === cartItem.menuId &&
      JSON.stringify(item.selectedOptions) === JSON.stringify(cartItem.selectedOptions)
    )

    if (existingIndex >= 0) {
      // 수량 증가
      const newCart = [...cart]
      newCart[existingIndex].quantity += 1
      newCart[existingIndex].totalPrice = 
        (cartItem.basePrice + optionsPrice) * newCart[existingIndex].quantity
      setCart(newCart)
    } else {
      // 새 아이템 추가
      setCart([...cart, cartItem])
    }

    // 선택된 옵션 초기화
    setSelectedOptions(prev => ({
      ...prev,
      [menu.id]: []
    }))
  }

  // 총 금액 계산
  const getTotalAmount = () => {
    return cart.reduce((sum, item) => sum + item.totalPrice, 0)
  }

  // 수량 증가
  const handleIncreaseQuantity = (index) => {
    const newCart = [...cart]
    const item = newCart[index]
    const unitPrice = item.basePrice + item.selectedOptions.reduce((sum, opt) => sum + opt.price, 0)
    
    item.quantity += 1
    item.totalPrice = unitPrice * item.quantity
    setCart(newCart)
  }

  // 수량 감소
  const handleDecreaseQuantity = (index) => {
    const newCart = [...cart]
    const item = newCart[index]
    
    if (item.quantity > 1) {
      const unitPrice = item.basePrice + item.selectedOptions.reduce((sum, opt) => sum + opt.price, 0)
      item.quantity -= 1
      item.totalPrice = unitPrice * item.quantity
      setCart(newCart)
    }
  }

  // 아이템 삭제
  const handleRemoveItem = (index) => {
    const newCart = cart.filter((_, i) => i !== index)
    setCart(newCart)
  }

  // 주문하기
  const handleOrder = () => {
    if (cart.length === 0) return

    // TODO: API 호출
    alert('주문이 완료되었습니다!')
    setCart([])
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
        {/* 메뉴 아이템 섹션 */}
        <section className="menu-section">
          <div className="menu-grid">
            {MENU_DATA.map(menu => (
              <div key={menu.id} className="menu-card">
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
                </div>

                {/* 옵션 선택 */}
                <div className="menu-options">
                  {menu.options.map(option => (
                    <label key={option.id} className="option-item">
                      <input
                        type="checkbox"
                        checked={(selectedOptions[menu.id] || []).includes(option.id)}
                        onChange={() => handleOptionChange(menu.id, option.id)}
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
                  onClick={() => handleAddToCart(menu)}
                >
                  담기
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* 장바구니 섹션 */}
        {cart.length > 0 && (
          <section className="cart-section">
            <h2 className="cart-title">장바구니</h2>
            
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
                              onClick={() => handleDecreaseQuantity(index)}
                            >
                              -
                            </button>
                            <span className="quantity-display">{item.quantity}</span>
                            <button 
                              className="quantity-button"
                              onClick={() => handleIncreaseQuantity(index)}
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
                            onClick={() => handleRemoveItem(index)}
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
                  <span className="total-amount">{getTotalAmount().toLocaleString()}원</span>
                </div>

                <button 
                  className="order-button"
                  onClick={handleOrder}
                >
                  주문하기
                </button>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

export default OrderPage
