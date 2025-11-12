const { query } = require('../config/database');

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
      imageUrl: menu.image_url,
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
      imageUrl: menu.image_url,
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

module.exports = {
  getAllMenus,
  getMenuById
};
