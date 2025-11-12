const { query, getClient } = require('../config/database');

// 주문 생성
const createOrder = async (req, res, next) => {
  const client = await getClient();
  
  try {
    const { items } = req.body;
    
    await client.query('BEGIN');
    
    // 1. 재고 확인 및 가격 계산
    let totalAmount = 0;
    const menuData = [];
    
    for (const item of items) {
      // 메뉴 정보 및 재고 확인 (FOR UPDATE로 락)
      const menuResult = await client.query(
        'SELECT menu_id, name, price, stock FROM menus WHERE menu_id = $1 FOR UPDATE',
        [item.menuId]
      );
      
      if (menuResult.rows.length === 0) {
        throw new Error(`Menu not found: ${item.menuId}`);
      }
      
      const menu = menuResult.rows[0];
      
      // 재고 확인
      if (menu.stock < item.quantity) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          error: 'Insufficient stock',
          details: {
            menuName: menu.name,
            requested: item.quantity,
            available: menu.stock
          }
        });
      }
      
      // 가격 계산
      let itemTotal = menu.price * item.quantity;
      const optionData = [];
      
      // 옵션 확인 및 가격 계산
      if (item.options && item.options.length > 0) {
        for (const opt of item.options) {
          const optionResult = await client.query(
            'SELECT option_id, name, price FROM options WHERE option_id = $1 AND menu_id = $2',
            [opt.optionId, item.menuId]
          );
          
          if (optionResult.rows.length === 0) {
            throw new Error(`Invalid option ${opt.optionId} for menu ${item.menuId}`);
          }
          
          const option = optionResult.rows[0];
          itemTotal += option.price * item.quantity;
          optionData.push(option);
        }
      }
      
      totalAmount += itemTotal;
      menuData.push({ menu, item, optionData });
    }
    
    // 2. 주문 생성
    const orderResult = await client.query(
      'INSERT INTO orders (total_amount, status) VALUES ($1, $2) RETURNING order_id, created_at',
      [totalAmount, 'received']
    );
    
    const orderId = orderResult.rows[0].order_id;
    const createdAt = orderResult.rows[0].created_at;
    
    // 3. 주문 아이템 추가
    const orderItems = [];
    for (const data of menuData) {
      const { menu, item, optionData } = data;
      
      const itemResult = await client.query(
        'INSERT INTO order_items (order_id, menu_id, quantity, price) VALUES ($1, $2, $3, $4) RETURNING item_id',
        [orderId, menu.menu_id, item.quantity, menu.price]
      );
      
      const itemId = itemResult.rows[0].item_id;
      
      // 4. 주문 아이템 옵션 추가
      const options = [];
      for (const option of optionData) {
        await client.query(
          'INSERT INTO order_item_options (item_id, option_id, option_name, option_price) VALUES ($1, $2, $3, $4)',
          [itemId, option.option_id, option.name, option.price]
        );
        options.push({ name: option.name, price: option.price });
      }
      
      // 5. 재고 차감
      await client.query(
        'UPDATE menus SET stock = stock - $1, updated_at = NOW() WHERE menu_id = $2',
        [item.quantity, menu.menu_id]
      );
      
      orderItems.push({
        menuName: menu.name,
        quantity: item.quantity,
        price: menu.price,
        options: options,
        subtotal: menu.price * item.quantity + options.reduce((sum, opt) => sum + opt.price, 0) * item.quantity
      });
    }
    
    await client.query('COMMIT');
    
    res.status(201).json({
      success: true,
      data: {
        orderId,
        totalAmount,
        status: 'received',
        items: orderItems,
        createdAt
      }
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

// 주문 상세 조회
const getOrderById = async (req, res, next) => {
  try {
    const orderId = parseInt(req.params.orderId);
    
    // 주문 조회
    const orderResult = await query(
      'SELECT order_id, total_amount, status, created_at, updated_at FROM orders WHERE order_id = $1',
      [orderId]
    );
    
    if (orderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    const order = orderResult.rows[0];
    
    // 주문 아이템 조회
    const itemsResult = await query(
      `SELECT oi.item_id, oi.quantity, oi.price, m.name as menu_name
       FROM order_items oi
       JOIN menus m ON oi.menu_id = m.menu_id
       WHERE oi.order_id = $1`,
      [orderId]
    );
    
    // 각 아이템의 옵션 조회
    const items = [];
    for (const item of itemsResult.rows) {
      const optionsResult = await query(
        'SELECT option_name, option_price FROM order_item_options WHERE item_id = $1',
        [item.item_id]
      );
      
      items.push({
        menuName: item.menu_name,
        quantity: item.quantity,
        price: item.price,
        options: optionsResult.rows.map(opt => ({
          name: opt.option_name,
          price: opt.option_price
        }))
      });
    }
    
    res.json({
      success: true,
      data: {
        orderId: order.order_id,
        totalAmount: order.total_amount,
        status: order.status,
        items,
        createdAt: order.created_at,
        updatedAt: order.updated_at
      }
    });
    
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getOrderById
};
