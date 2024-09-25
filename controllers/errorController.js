const AppError = require('../utils/appError');

const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = err => {
  const message = `Duplicate field value:${JSON.stringify(err.keyValue)}`;
  return new AppError(message, 400);
};

const handleValidationError = err => {
  const errorKeys = Object.keys(err.errors);
  let res = [];
  errorKeys.forEach(element => {
    res.push(err.errors[element].message);
  });
  //   const message = `Duplicate field value:${JSON.stringify(err.keyValue)}`;
  return new AppError(JSON.stringify(res), 400);
};

const sendDevError = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    stack: err.stack,
    message: err.message
  });
};

const sendProductionError = (err, res) => {
  if (err.isOperational) {
    res
      .status(err.statusCode)
      .json({ status: err.status, message: err.message });
  } else {
    res.status(500).json({
      status: err,
      message: 'Something went wrong!'
    });
  }
};

const handleJsonWebTokenError = err =>
  new AppError('Invalid Token. Please login again.', 401);

const handleTokenExpiredError = err =>
  new AppError('Your has Token Expired. Please Login Again.', 401);

const errorMiddleware = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendDevError(err, res);
  } else {
    let error = err;

    if (err.name === 'CastError') {
      error = handleCastErrorDB(error);
    }

    if (err.errorResponse?.code === 11000) {
      error = handleDuplicateFieldsDB(error);
    }

    if (err.name === 'ValidationError') {
      error = handleValidationError(error);
    }

    if (error.name === 'JsonWebTokenError') {
      error = handleJsonWebTokenError(error);
    }

    if (error.name === 'TokenExpiredError') {
      error = handleTokenExpiredError(error);
    }

    sendProductionError(error, res);
  }
};

module.exports = errorMiddleware;
