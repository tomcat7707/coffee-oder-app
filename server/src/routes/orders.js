const express = require('express');
const router = express.Router();
const { createOrder, getOrderById } = require('../controllers/orderController');
const { validateCreateOrder, validateIdParam } = require('../middleware/validator');

// POST /api/orders - 주문 생성
router.post('/', validateCreateOrder, createOrder);

// GET /api/orders/:orderId - 주문 상세 조회
router.get('/:orderId', validateIdParam('orderId'), getOrderById);

module.exports = router;
