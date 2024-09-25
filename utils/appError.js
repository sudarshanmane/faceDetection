class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status =
      `${statusCode}`.startsWith('4') || `${statusCode}`.startsWith('5')
        ? 'fail'
        : 'success';
    this.isOperational = true; // send only these error to the user

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
