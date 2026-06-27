const jwt = require('jsonwebtoken');
const { AppError } = require('./errorHandler');
const prisma = require('../config/prisma');

const ACCESS_SECRET = process.env.ACCESS_TOKEN;

async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new AppError('Missing or malformed Authorization header', 401);
    }

    const token = header.slice(7);
    const payload = jwt.verify(token, ACCESS_SECRET);

    const employee = await prisma.employee.findUnique({ where: { id: payload.sub } });
    if (!employee) throw new AppError('Employee account no longer exists', 401);

    req.user = employee;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') return next(new AppError('Access token expired', 401));
    if (err.name === 'JsonWebTokenError') return next(new AppError('Invalid access token', 401));
    next(err);
  }
}

function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) return next(new AppError('Not authenticated', 401));
    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError(`Role '${req.user.role}' is not permitted to perform this action`, 403));
    }
    next();
  };
}

module.exports = { authenticate, authorize };