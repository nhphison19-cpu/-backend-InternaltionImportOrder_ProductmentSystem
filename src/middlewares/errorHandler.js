class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
  }
}

function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;

  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      message: `Duplicate value for field(s): ${err.meta?.target?.join(', ') || 'unknown'}`,
    });
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ success: false, message: 'Record not found' });
  }
  if (err.code === 'P2003') {
    return res.status(409).json({ success: false, message: 'Foreign key constraint failed' });
  }

  if (!err.isOperational) {
    console.error('[UNHANDLED ERROR]', err);
  }

  res.status(statusCode).json({
    success: false,
    message: err.isOperational ? err.message : 'Internal server error',
    ...(err.details ? { details: err.details } : {}),
  });
}

function notFoundHandler(req, res) {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.originalUrl} not found` });
}

module.exports = { AppError, errorHandler, notFoundHandler };