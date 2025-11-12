// 커스텀 에러 클래스
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// 에러 핸들러 미들웨어
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    // 개발 환경: 상세 에러 정보 제공
    res.status(err.statusCode).json({
      success: false,
      status: err.status,
      error: err.message,
      stack: err.stack
    });
  } else {
    // 프로덕션 환경: 간단한 에러 메시지
    if (err.isOperational) {
      res.status(err.statusCode).json({
        success: false,
        error: err.message
      });
    } else {
      // 예상하지 못한 에러
      console.error('ERROR 💥:', err);
      res.status(500).json({
        success: false,
        error: '서버 오류가 발생했습니다'
      });
    }
  }
};

module.exports = { AppError, errorHandler };
