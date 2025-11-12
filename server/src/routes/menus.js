const express = require('express');
const router = express.Router();
const { getAllMenus, getMenuById } = require('../controllers/menuController');
const { validateIdParam } = require('../middleware/validator');

// GET /api/menus - 전체 메뉴 목록 조회
router.get('/', getAllMenus);

// GET /api/menus/:menuId - 특정 메뉴 상세 조회
router.get('/:menuId', validateIdParam('menuId'), getMenuById);

module.exports = router;
