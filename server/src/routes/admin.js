const express = require('express');
const router = express.Router();
const {
  getStatistics,
  getInventory,
  updateStock,
  getOrders,
  updateOrderStatus
} = require('../controllers/adminController');
const {
  validateIdParam,
  validateUpdateStock,
  validateUpdateOrderStatus
} = require('../middleware/validator');

// GET /api/admin/statistics - 주문 통계
router.get('/statistics', getStatistics);

// GET /api/admin/inventory - 재고 현황
router.get('/inventory', getInventory);

// PATCH /api/admin/inventory/:menuId - 재고 수정
router.patch('/inventory/:menuId', validateIdParam('menuId'), validateUpdateStock, updateStock);

// GET /api/admin/orders - 주문 목록
router.get('/orders', getOrders);

// PATCH /api/admin/orders/:orderId/status - 주문 상태 변경
router.patch('/orders/:orderId/status', validateIdParam('orderId'), validateUpdateOrderStatus, updateOrderStatus);

module.exports = router;
