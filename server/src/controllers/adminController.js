const { query } = require('../config/database');

// 주문 통계 조회
const getStatistics = async (req, res, next) => {
  try {
    const result = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'received') as received,
        COUNT(*) FILTER (WHERE status = 'inProgress') as in_progress,
        COUNT(*) FILTER (WHERE status = 'completed') as completed
      FROM orders
    `);
    
    const stats = result.rows[0];
    
    res.json({
      success: true,
      data: {
        total: parseInt(stats.total),
        received: parseInt(stats.received),
        inProgress: parseInt(stats.in_progress),
        completed: parseInt(stats.completed)
      }
    });
  } catch (error) {
    next(error);
  }
};

// 재고 현황 조회
const getInventory = async (req, res, next) => {
  try {
    const result = await query(
      'SELECT menu_id, name as menu_name, stock FROM menus ORDER BY menu_id'
    );
    
    const inventory = result.rows.map(row => ({
      menuId: row.menu_id,
      menuName: row.menu_name,
      stock: row.stock
    }));
    
    res.json({
      success: true,
      data: inventory
    });
  } catch (error) {
    next(error);
  }
};

// 재고 수정
const updateStock = async (req, res, next) => {
  try {
    const menuId = parseInt(req.params.menuId);
    const { stock } = req.body;
    
    const result = await query(
      'UPDATE menus SET stock = $1, updated_at = NOW() WHERE menu_id = $2 RETURNING menu_id, name as menu_name, stock',
      [stock, menuId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Menu not found'
      });
    }
    
    const menu = result.rows[0];
    
    res.json({
      success: true,
      data: {
        menuId: menu.menu_id,
        menuName: menu.menu_name,
        stock: menu.stock
      }
    });
  } catch (error) {
    next(error);
  }
};

// 주문 목록 조회
const getOrders = async (req, res, next) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;
    
    let queryText = 'SELECT order_id, total_amount, status, created_at FROM orders';
    const params = [];
    
    // 상태 필터
    if (status) {
      const statuses = status.split(',');
      queryText += ' WHERE status = ANY($1)';
      params.push(statuses);
    }
    
    queryText += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(parseInt(limit), parseInt(offset));
    
    const ordersResult = await query(queryText, params);
    
    // 각 주문의 아이템 조회
    const orders = [];
    for (const order of ordersResult.rows) {
      const itemsResult = await query(
        `SELECT m.name as menu_name, oi.quantity
         FROM order_items oi
         JOIN menus m ON oi.menu_id = m.menu_id
         WHERE oi.order_id = $1`,
        [order.order_id]
      );
      
      orders.push({
        orderId: order.order_id,
        totalAmount: order.total_amount,
        status: order.status,
        items: itemsResult.rows.map(item => ({
          menuName: item.menu_name,
          quantity: item.quantity
        })),
        createdAt: order.created_at
      });
    }
    
    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    next(error);
  }
};

// 주문 상태 변경
const updateOrderStatus = async (req, res, next) => {
  try {
    const orderId = parseInt(req.params.orderId);
    const { status } = req.body;
    
    // 현재 주문 상태 조회
    const currentResult = await query(
      'SELECT status FROM orders WHERE order_id = $1',
      [orderId]
    );
    
    if (currentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    const currentStatus = currentResult.rows[0].status;
    
    // 상태 전환 유효성 검증
    const validTransitions = {
      'pending': ['received'],
      'received': ['inProgress'],
      'inProgress': ['completed'],
      'completed': []
    };
    
    if (!validTransitions[currentStatus].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status transition',
        details: {
          currentStatus,
          requestedStatus: status
        }
      });
    }
    
    // 상태 업데이트
    const result = await query(
      'UPDATE orders SET status = $1, updated_at = NOW() WHERE order_id = $2 RETURNING order_id, status, updated_at',
      [status, orderId]
    );
    
    res.json({
      success: true,
      data: {
        orderId: result.rows[0].order_id,
        status: result.rows[0].status,
        updatedAt: result.rows[0].updated_at
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStatistics,
  getInventory,
  updateStock,
  getOrders,
  updateOrderStatus
};
