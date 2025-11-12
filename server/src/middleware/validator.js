const { AppError } = require('./errorHandler');

// 주문 생성 요청 검증
const validateCreateOrder = (req, res, next) => {
  const { items } = req.body;

  // items 배열 검증
  if (!items || !Array.isArray(items) || items.length === 0) {
    return next(new AppError('주문 항목이 비어있습니다', 400));
  }

  // 각 아이템 검증
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    
    if (!item.menuId || typeof item.menuId !== 'number') {
      return next(new AppError(`유효하지 않은 메뉴 ID입니다 (항목 ${i + 1})`, 400));
    }

    if (!item.quantity || typeof item.quantity !== 'number' || item.quantity < 1) {
      return next(new AppError(`수량은 1 이상이어야 합니다 (항목 ${i + 1})`, 400));
    }

    if (item.options && !Array.isArray(item.options)) {
      return next(new AppError(`옵션은 배열이어야 합니다 (항목 ${i + 1})`, 400));
    }

    // 옵션 검증
    if (item.options) {
      for (let j = 0; j < item.options.length; j++) {
        const option = item.options[j];
        if (!option.optionId || typeof option.optionId !== 'number') {
          return next(new AppError(`유효하지 않은 옵션 ID입니다 (항목 ${i + 1}, 옵션 ${j + 1})`, 400));
        }
      }
    }
  }

  next();
};

// 주문 상태 변경 요청 검증
const validateUpdateOrderStatus = (req, res, next) => {
  const { status } = req.body;
  const validStatuses = ['pending', 'received', 'inProgress', 'completed'];

  if (!status) {
    return next(new AppError('상태 값이 필요합니다', 400));
  }

  if (!validStatuses.includes(status)) {
    return next(new AppError(`유효하지 않은 상태입니다. 허용 값: ${validStatuses.join(', ')}`, 400));
  }

  next();
};

// 재고 수정 요청 검증
const validateUpdateStock = (req, res, next) => {
  const { stock } = req.body;

  if (stock === undefined || stock === null) {
    return next(new AppError('재고 값이 필요합니다', 400));
  }

  if (typeof stock !== 'number' || stock < 0) {
    return next(new AppError('재고는 0 이상의 숫자여야 합니다', 400));
  }

  next();
};

// ID 파라미터 검증
const validateIdParam = (paramName) => {
  return (req, res, next) => {
    const id = parseInt(req.params[paramName]);
    
    if (isNaN(id) || id < 1) {
      return next(new AppError(`유효하지 않은 ${paramName}입니다`, 400));
    }

    req.params[paramName] = id;
    next();
  };
};

module.exports = {
  validateCreateOrder,
  validateUpdateOrderStatus,
  validateUpdateStock,
  validateIdParam
};
