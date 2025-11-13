const { query, getClient } = require('../config/database');

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
    
    // 각 주문의 아이템 및 옵션 조회
    const orders = [];
    for (const order of ordersResult.rows) {
      const itemsResult = await query(
        `SELECT oi.item_id, m.name as menu_name, oi.quantity
         FROM order_items oi
         JOIN menus m ON oi.menu_id = m.menu_id
         WHERE oi.order_id = $1
         ORDER BY oi.item_id`,
        [order.order_id]
      );
      
      // 각 아이템의 옵션 조회
      const items = [];
      for (const item of itemsResult.rows) {
        const optionsResult = await query(
          `SELECT option_name, option_price
           FROM order_item_options
           WHERE item_id = $1
           ORDER BY id`,
          [item.item_id]
        );
        
        items.push({
          menuName: item.menu_name,
          quantity: item.quantity,
          options: optionsResult.rows.map(opt => ({
            name: opt.option_name,
            price: opt.option_price
          }))
        });
      }
      
      orders.push({
        orderId: order.order_id,
        totalAmount: order.total_amount,
        status: order.status,
        items: items,
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

    const validTransitions = {
      pending: ['received', 'cancelled'],
      received: ['inProgress', 'cancelled'],
      inProgress: ['completed'],
      completed: [],
      cancelled: []
    };

    if (!validTransitions[currentStatus] || !validTransitions[currentStatus].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status transition',
        details: {
          currentStatus,
          requestedStatus: status
        }
      });
    }

    if (status === 'cancelled') {
      const client = await getClient();

      try {
        await client.query('BEGIN');

        const itemsResult = await client.query(
          'SELECT menu_id, quantity FROM order_items WHERE order_id = $1',
          [orderId]
        );

        for (const item of itemsResult.rows) {
          await client.query(
            'UPDATE menus SET stock = stock + $1, updated_at = NOW() WHERE menu_id = $2',
            [item.quantity, item.menu_id]
          );
        }

        const updateResult = await client.query(
          'UPDATE orders SET status = $1, updated_at = NOW() WHERE order_id = $2 RETURNING order_id, status, updated_at',
          [status, orderId]
        );

        await client.query('COMMIT');

        return res.json({
          success: true,
          data: {
            orderId: updateResult.rows[0].order_id,
            status: updateResult.rows[0].status,
            updatedAt: updateResult.rows[0].updated_at
          }
        });
      } catch (error) {
        await client.query('ROLLBACK');
        return next(error);
      } finally {
        client.release();
      }
    }

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

// 메뉴 추가
const createMenu = async (req, res, next) => {
  try {
    const { name, description, price, stock, imageUrl } = req.body;
    
    // 유효성 검증
    if (!name || !price) {
      return res.status(400).json({
        success: false,
        error: 'Name and price are required'
      });
    }
    
    const result = await query(
      `INSERT INTO menus (name, description, price, stock, image_url) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING menu_id, name, description, price, stock, image_url`,
      [name, description || '', parseInt(price), parseInt(stock) || 0, imageUrl || '']
    );
    
    const menu = result.rows[0];
    
    res.status(201).json({
      success: true,
      data: {
        menuId: menu.menu_id,
        name: menu.name,
        description: menu.description,
        price: menu.price,
        stock: menu.stock,
        imageUrl: menu.image_url
      }
    });
  } catch (error) {
    next(error);
  }
};

// 메뉴 수정
const updateMenu = async (req, res, next) => {
  try {
    const menuId = parseInt(req.params.menuId);
    const { name, description, price, stock, imageUrl } = req.body;
    
    // 유효성 검증
    if (!name || !price) {
      return res.status(400).json({
        success: false,
        error: 'Name and price are required'
      });
    }
    
    const result = await query(
      `UPDATE menus 
       SET name = $1, description = $2, price = $3, stock = $4, image_url = $5, updated_at = NOW() 
       WHERE menu_id = $6 
       RETURNING menu_id, name, description, price, stock, image_url`,
      [name, description || '', parseInt(price), parseInt(stock) || 0, imageUrl || '', menuId]
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
        name: menu.name,
        description: menu.description,
        price: menu.price,
        stock: menu.stock,
        imageUrl: menu.image_url
      }
    });
  } catch (error) {
    next(error);
  }
};

// 메뉴 삭제
const deleteMenu = async (req, res, next) => {
  try {
    const menuId = parseInt(req.params.menuId);
    
    // 주문 아이템에서 사용 중인지 확인
    const checkResult = await query(
      'SELECT COUNT(*) as count FROM order_items WHERE menu_id = $1',
      [menuId]
    );
    
    if (parseInt(checkResult.rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete menu that has been ordered'
      });
    }
    
    const result = await query(
      'DELETE FROM menus WHERE menu_id = $1 RETURNING menu_id',
      [menuId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Menu not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        menuId: result.rows[0].menu_id
      }
    });
  } catch (error) {
    next(error);
  }
};

// 모든 옵션 조회
const getOptions = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT o.option_id, o.menu_id, m.name AS menu_name, o.name, o.price
       FROM options o
       JOIN menus m ON o.menu_id = m.menu_id
       ORDER BY o.menu_id, o.option_id`
    );

    const options = result.rows.map(row => ({
      optionId: row.option_id,
      menuId: row.menu_id,
      menuName: row.menu_name,
      name: row.name,
      price: row.price
    }));

    res.json({
      success: true,
      data: options
    });
  } catch (error) {
    next(error);
  }
};

// 옵션 추가
const createOption = async (req, res, next) => {
  try {
    const { menuId, name, price } = req.body;

    if (!menuId || !Number.isInteger(Number(menuId))) {
      return res.status(400).json({
        success: false,
        error: '유효한 메뉴 ID가 필요합니다'
      });
    }

    if (!name || price === undefined) {
      return res.status(400).json({
        success: false,
        error: '옵션명과 가격은 필수입니다'
      });
    }

    const parsedMenuId = Number(menuId);
    const parsedPrice = Number(price);

    if (!Number.isInteger(parsedPrice) || parsedPrice < 0) {
      return res.status(400).json({
        success: false,
        error: '가격은 0 이상의 정수여야 합니다'
      });
    }

    const menuResult = await query(
      'SELECT menu_id, name FROM menus WHERE menu_id = $1',
      [parsedMenuId]
    );

    if (menuResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '메뉴를 찾을 수 없습니다'
      });
    }

    const result = await query(
      'INSERT INTO options (menu_id, name, price) VALUES ($1, $2, $3) RETURNING option_id, menu_id, name, price',
      [parsedMenuId, name, parsedPrice]
    );

    const option = result.rows[0];

    res.status(201).json({
      success: true,
      data: {
        optionId: option.option_id,
        menuId: option.menu_id,
        menuName: menuResult.rows[0].name,
        name: option.name,
        price: option.price
      }
    });
  } catch (error) {
    next(error);
  }
};

// 옵션 수정
const updateOption = async (req, res, next) => {
  try {
    const optionId = Number(req.params.optionId);

    if (!Number.isInteger(optionId)) {
      return res.status(400).json({
        success: false,
        error: '유효한 옵션 ID가 필요합니다'
      });
    }
    const { menuId, name, price } = req.body;

    if (!menuId || !Number.isInteger(Number(menuId))) {
      return res.status(400).json({
        success: false,
        error: '유효한 메뉴 ID가 필요합니다'
      });
    }

    if (!name || price === undefined) {
      return res.status(400).json({
        success: false,
        error: '옵션명과 가격은 필수입니다'
      });
    }

    const parsedMenuId = Number(menuId);
    const parsedPrice = Number(price);

    if (!Number.isInteger(parsedPrice) || parsedPrice < 0) {
      return res.status(400).json({
        success: false,
        error: '가격은 0 이상의 정수여야 합니다'
      });
    }

    const menuResult = await query(
      'SELECT menu_id, name FROM menus WHERE menu_id = $1',
      [parsedMenuId]
    );

    if (menuResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '메뉴를 찾을 수 없습니다'
      });
    }

    const result = await query(
      'UPDATE options SET menu_id = $1, name = $2, price = $3 WHERE option_id = $4 RETURNING option_id, menu_id, name, price',
      [parsedMenuId, name, parsedPrice, optionId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '옵션을 찾을 수 없습니다'
      });
    }

    const option = result.rows[0];

    res.json({
      success: true,
      data: {
        optionId: option.option_id,
        menuId: option.menu_id,
        menuName: menuResult.rows[0].name,
        name: option.name,
        price: option.price
      }
    });
  } catch (error) {
    next(error);
  }
};

// 옵션 삭제
const deleteOption = async (req, res, next) => {
  try {
    const optionId = parseInt(req.params.optionId);
    
    // 주문 아이템 옵션에서 사용 중인지 확인
    const checkResult = await query(
      'SELECT COUNT(*) as count FROM order_item_options WHERE option_id = $1',
      [optionId]
    );
    
    if (parseInt(checkResult.rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete option that has been used in orders'
      });
    }
    
    const result = await query(
      'DELETE FROM options WHERE option_id = $1 RETURNING option_id',
      [optionId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Option not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        optionId: result.rows[0].option_id
      }
    });
  } catch (error) {
    next(error);
  }
};

// 옵션 프리셋 조회
const getOptionPresets = async (req, res, next) => {
  try {
    const presetsResult = await query(
      `SELECT preset_id, name, description, created_at, updated_at
       FROM option_presets
       ORDER BY preset_id`
    );

    const optionsResult = await query(
      `SELECT preset_option_id, preset_id, name, price, display_order
       FROM option_preset_options
       ORDER BY preset_id, display_order, preset_option_id`
    );

    const optionMap = optionsResult.rows.reduce((acc, row) => {
      if (!acc[row.preset_id]) {
        acc[row.preset_id] = [];
      }
      acc[row.preset_id].push({
        optionPresetOptionId: row.preset_option_id,
        name: row.name,
        price: row.price,
        displayOrder: row.display_order
      });
      return acc;
    }, {});

    const presets = presetsResult.rows.map(row => ({
      presetId: row.preset_id,
      name: row.name,
      description: row.description || '',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      options: optionMap[row.preset_id] || []
    }));

    res.json({
      success: true,
      data: presets
    });
  } catch (error) {
    next(error);
  }
};

// 옵션 프리셋 생성
const createOptionPreset = async (req, res, next) => {
  const client = await getClient();

  try {
    const { name, description = '', options = [] } = req.body;

    if (!name || typeof name !== 'string') {
      return res.status(400).json({
        success: false,
        error: '프리셋 이름은 필수입니다'
      });
    }

    if (!Array.isArray(options) || options.length === 0) {
      return res.status(400).json({
        success: false,
        error: '하나 이상의 옵션이 필요합니다'
      });
    }

    for (const option of options) {
      if (!option.name || typeof option.name !== 'string') {
        return res.status(400).json({
          success: false,
          error: '모든 옵션에 이름이 필요합니다'
        });
      }
      if (!Number.isInteger(Number(option.price)) || Number(option.price) < 0) {
        return res.status(400).json({
          success: false,
          error: '옵션 가격은 0 이상의 정수여야 합니다'
        });
      }
    }

    await client.query('BEGIN');

    const presetResult = await client.query(
      `INSERT INTO option_presets (name, description)
       VALUES ($1, $2)
       RETURNING preset_id, name, description, created_at, updated_at`,
      [name.trim(), description.trim()]
    );

    const presetId = presetResult.rows[0].preset_id;

    for (let index = 0; index < options.length; index++) {
      const option = options[index];
      await client.query(
        `INSERT INTO option_preset_options (preset_id, name, price, display_order)
         VALUES ($1, $2, $3, $4)`,
        [presetId, option.name.trim(), Number(option.price), index]
      );
    }

    await client.query('COMMIT');

    const createdPreset = {
      presetId,
      name: presetResult.rows[0].name,
      description: presetResult.rows[0].description || '',
      createdAt: presetResult.rows[0].created_at,
      updatedAt: presetResult.rows[0].updated_at,
      options: options.map((option, index) => ({
        optionPresetOptionId: null,
        name: option.name.trim(),
        price: Number(option.price),
        displayOrder: index
      }))
    };

    res.status(201).json({
      success: true,
      data: createdPreset
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

// 옵션 프리셋 수정
const updateOptionPreset = async (req, res, next) => {
  const client = await getClient();

  try {
    const presetId = Number(req.params.presetId);
    const { name, description = '', options = [] } = req.body;

    if (!Number.isInteger(presetId) || presetId < 1) {
      return res.status(400).json({
        success: false,
        error: '유효한 프리셋 ID가 필요합니다'
      });
    }

    if (!name || typeof name !== 'string') {
      return res.status(400).json({
        success: false,
        error: '프리셋 이름은 필수입니다'
      });
    }

    if (!Array.isArray(options) || options.length === 0) {
      return res.status(400).json({
        success: false,
        error: '하나 이상의 옵션이 필요합니다'
      });
    }

    for (const option of options) {
      if (!option.name || typeof option.name !== 'string') {
        return res.status(400).json({
          success: false,
          error: '모든 옵션에 이름이 필요합니다'
        });
      }
      if (!Number.isInteger(Number(option.price)) || Number(option.price) < 0) {
        return res.status(400).json({
          success: false,
          error: '옵션 가격은 0 이상의 정수여야 합니다'
        });
      }
    }

    await client.query('BEGIN');

    const presetResult = await client.query(
      `UPDATE option_presets
       SET name = $1, description = $2, updated_at = NOW()
       WHERE preset_id = $3
       RETURNING preset_id, name, description, created_at, updated_at`,
      [name.trim(), description.trim(), presetId]
    );

    if (presetResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: '프리셋을 찾을 수 없습니다'
      });
    }

    await client.query('DELETE FROM option_preset_options WHERE preset_id = $1', [presetId]);

    for (let index = 0; index < options.length; index++) {
      const option = options[index];
      await client.query(
        `INSERT INTO option_preset_options (preset_id, name, price, display_order)
         VALUES ($1, $2, $3, $4)`,
        [presetId, option.name.trim(), Number(option.price), index]
      );
    }

    await client.query('COMMIT');

    const updatedPreset = {
      presetId,
      name: presetResult.rows[0].name,
      description: presetResult.rows[0].description || '',
      createdAt: presetResult.rows[0].created_at,
      updatedAt: presetResult.rows[0].updated_at,
      options: options.map((option, index) => ({
        optionPresetOptionId: null,
        name: option.name.trim(),
        price: Number(option.price),
        displayOrder: index
      }))
    };

    res.json({
      success: true,
      data: updatedPreset
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

// 옵션 프리셋 삭제
const deleteOptionPreset = async (req, res, next) => {
  try {
    const presetId = Number(req.params.presetId);

    if (!Number.isInteger(presetId) || presetId < 1) {
      return res.status(400).json({
        success: false,
        error: '유효한 프리셋 ID가 필요합니다'
      });
    }

    const result = await query(
      'DELETE FROM option_presets WHERE preset_id = $1 RETURNING preset_id',
      [presetId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '프리셋을 찾을 수 없습니다'
      });
    }

    res.json({
      success: true,
      data: { presetId }
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
  updateOrderStatus,
  createMenu,
  updateMenu,
  deleteMenu,
  getOptions,
  createOption,
  updateOption,
  deleteOption,
  getOptionPresets,
  createOptionPreset,
  updateOptionPreset,
  deleteOptionPreset
};
