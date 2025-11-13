const { query } = require('../config/database');

const buildImageUrl = (req, imagePath) => {
  if (!imagePath) {
    return null;
  }

  if (/^https?:\/\//i.test(imagePath)) {
    return imagePath;
  }

  const baseUrl = process.env.ASSET_BASE_URL || `${req.protocol}://${req.get('host')}`;
  return `${baseUrl}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
};

// 전체 메뉴 목록 조회
const getAllMenus = async (req, res, next) => {
  try {
    // 메뉴 조회
    const menusResult = await query(
      'SELECT menu_id, name, description, price, stock, image_url FROM menus ORDER BY menu_id'
    );

    const menus = menusResult.rows;

    // 각 메뉴의 옵션 조회
    for (let menu of menus) {
      const optionsResult = await query(
        'SELECT option_id, name, price FROM options WHERE menu_id = $1 ORDER BY option_id',
        [menu.menu_id]
      );
      menu.options = optionsResult.rows;
    }

    // 응답 형식 변환 (camelCase)
    const formattedMenus = menus.map(menu => ({
      menuId: menu.menu_id,
      name: menu.name,
      description: menu.description,
      price: menu.price,
      stock: menu.stock,
      imageUrl: buildImageUrl(req, menu.image_url),
      options: menu.options.map(opt => ({
        optionId: opt.option_id,
        name: opt.name,
        price: opt.price
      }))
    }));

    res.json({
      success: true,
      data: formattedMenus
    });
  } catch (error) {
    next(error);
  }
};

// 특정 메뉴 상세 조회
const getMenuById = async (req, res, next) => {
  try {
    const menuId = parseInt(req.params.menuId);

    // 메뉴 조회
    const menuResult = await query(
      'SELECT menu_id, name, description, price, image_url FROM menus WHERE menu_id = $1',
      [menuId]
    );

    if (menuResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '메뉴를 찾을 수 없습니다'
      });
    }

    const menu = menuResult.rows[0];

    // 옵션 조회
    const optionsResult = await query(
      'SELECT option_id, name, price FROM options WHERE menu_id = $1 ORDER BY option_id',
      [menuId]
    );

    // 응답 형식 변환
    const formattedMenu = {
      menuId: menu.menu_id,
      name: menu.name,
      description: menu.description,
      price: menu.price,
      imageUrl: buildImageUrl(req, menu.image_url),
      options: optionsResult.rows.map(opt => ({
        optionId: opt.option_id,
        name: opt.name,
        price: opt.price
      }))
    };

    res.json({
      success: true,
      data: formattedMenu
    });
  } catch (error) {
    next(error);
  }
};

// 메뉴 이미지 업로드
const uploadMenuImage = async (req, res, next) => {
  try {
    const menuId = parseInt(req.params.menuId);

    // 파일이 업로드되었는지 확인
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: '이미지 파일을 선택해주세요'
      });
    }

    // 이미지 URL 경로 생성 (프론트엔드에서 접근 가능한 경로)
    const imageUrl = `/images/menus/${req.file.filename}`;

    // 데이터베이스에 이미지 URL 업데이트
    const result = await query(
      'UPDATE menus SET image_url = $1 WHERE menu_id = $2 RETURNING menu_id, name, image_url',
      [imageUrl, menuId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '메뉴를 찾을 수 없습니다'
      });
    }

    const updatedMenu = result.rows[0];

    res.json({
      success: true,
      data: {
        menuId: updatedMenu.menu_id,
        name: updatedMenu.name,
        imageUrl: buildImageUrl(req, updatedMenu.image_url)
      },
      message: '이미지가 성공적으로 업로드되었습니다'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllMenus,
  getMenuById,
  uploadMenuImage
};
