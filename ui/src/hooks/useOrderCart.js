import { useState, useCallback, useMemo } from 'react'

export function useOrderCart() {
  const [cart, setCart] = useState([])
  const [selectedOptions, setSelectedOptions] = useState({})

  const toggleOption = useCallback((menuId, optionId) => {
    setSelectedOptions(prev => {
      const current = prev[menuId] || []
      const next = current.includes(optionId)
        ? current.filter(id => id !== optionId)
        : [...current, optionId]
      return {
        ...prev,
        [menuId]: next
      }
    })
  }, [])

  const addMenuToCart = useCallback((menu) => {
    const selectedIds = selectedOptions[menu.menuId] || []
    const selectedMenuOptions = menu.options.filter(opt => selectedIds.includes(opt.optionId))
    const optionsPrice = selectedMenuOptions.reduce((sum, opt) => sum + opt.price, 0)

    setCart(prevCart => {
      const baseItem = {
        menuId: menu.menuId,
        menuName: menu.name,
        basePrice: menu.price,
        selectedOptions: selectedMenuOptions,
        quantity: 1,
        totalPrice: menu.price + optionsPrice
      }

      const existingIndex = prevCart.findIndex(item =>
        item.menuId === baseItem.menuId &&
        JSON.stringify(item.selectedOptions) === JSON.stringify(baseItem.selectedOptions)
      )

      if (existingIndex >= 0) {
        return prevCart.map((item, idx) => {
          if (idx !== existingIndex) {
            return item
          }
          const unitPrice = item.basePrice + item.selectedOptions.reduce((sum, opt) => sum + opt.price, 0)
          const nextQuantity = item.quantity + 1
          return {
            ...item,
            quantity: nextQuantity,
            totalPrice: unitPrice * nextQuantity
          }
        })
      }

      return [...prevCart, baseItem]
    })

    setSelectedOptions(prev => ({
      ...prev,
      [menu.menuId]: []
    }))
  }, [selectedOptions])

  const increaseQuantity = useCallback((index) => {
    setCart(prevCart => prevCart.map((item, idx) => {
      if (idx !== index) {
        return item
      }
      const unitPrice = item.basePrice + item.selectedOptions.reduce((sum, opt) => sum + opt.price, 0)
      const nextQuantity = item.quantity + 1
      return {
        ...item,
        quantity: nextQuantity,
        totalPrice: unitPrice * nextQuantity
      }
    }))
  }, [])

  const decreaseQuantity = useCallback((index) => {
    setCart(prevCart => prevCart.map((item, idx) => {
      if (idx !== index) {
        return item
      }
      if (item.quantity <= 1) {
        return item
      }
      const unitPrice = item.basePrice + item.selectedOptions.reduce((sum, opt) => sum + opt.price, 0)
      const nextQuantity = item.quantity - 1
      return {
        ...item,
        quantity: nextQuantity,
        totalPrice: unitPrice * nextQuantity
      }
    }))
  }, [])

  const removeItem = useCallback((index) => {
    setCart(prevCart => prevCart.filter((_, idx) => idx !== index))
  }, [])

  const clearCart = useCallback(() => {
    setCart([])
  }, [])

  const clearSelections = useCallback(() => {
    setSelectedOptions({})
  }, [])

  const totalAmount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.totalPrice, 0)
  }, [cart])

  return {
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
  }
}

export default useOrderCart
