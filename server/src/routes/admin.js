const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/adminController');
const {
  validateIdParam,
  validateUpdateStock,
  validateUpdateOrderStatus,
  validateOptionPresetPayload
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

// 메뉴 관리
// POST /api/admin/menus - 메뉴 추가
router.post('/menus', createMenu);

// PUT /api/admin/menus/:menuId - 메뉴 수정
router.put('/menus/:menuId', validateIdParam('menuId'), updateMenu);

// DELETE /api/admin/menus/:menuId - 메뉴 삭제
router.delete('/menus/:menuId', validateIdParam('menuId'), deleteMenu);

// 옵션 관리
// GET /api/admin/options - 모든 옵션 조회
router.get('/options', getOptions);

// POST /api/admin/options - 옵션 추가
router.post('/options', createOption);

// PUT /api/admin/options/:optionId - 옵션 수정
router.put('/options/:optionId', validateIdParam('optionId'), updateOption);

// DELETE /api/admin/options/:optionId - 옵션 삭제
router.delete('/options/:optionId', validateIdParam('optionId'), deleteOption);

// 옵션 프리셋 관리
router.get('/option-presets', getOptionPresets);
router.post('/option-presets', validateOptionPresetPayload, createOptionPreset);
router.put('/option-presets/:presetId', validateIdParam('presetId'), validateOptionPresetPayload, updateOptionPreset);
router.delete('/option-presets/:presetId', validateIdParam('presetId'), deleteOptionPreset);

module.exports = router;
