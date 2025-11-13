const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { getAllMenus, getMenuById, uploadMenuImage } = require('../controllers/menuController');
const { validateIdParam } = require('../middleware/validator');

// Multer 설정 - 이미지 저장
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../../ui/public/images/menus'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'menu-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB 제한
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('이미지 파일만 업로드 가능합니다 (jpeg, jpg, png, gif, webp)'));
    }
  }
});

// GET /api/menus - 전체 메뉴 목록 조회
router.get('/', getAllMenus);

// GET /api/menus/:menuId - 특정 메뉴 상세 조회
router.get('/:menuId', validateIdParam('menuId'), getMenuById);

// POST /api/menus/:menuId/image - 메뉴 이미지 업로드
router.post('/:menuId/image', validateIdParam('menuId'), upload.single('image'), uploadMenuImage);

module.exports = router;
