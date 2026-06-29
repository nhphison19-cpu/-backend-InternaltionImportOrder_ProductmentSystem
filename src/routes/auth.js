const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const prisma = require('../config/prisma');
const { asyncHandler } = require('../middlewares/asyncHandler');
const  { loginLimiter, refreshLimiter } = require('../middlewares/rateLimiters')


const { success, created, paginated, sendError } = require('../utils/helpers/responseHelper'); 
const {
  issueTokenPair,
  rotateRefreshToken,
  revokeRefreshToken,
} = require('../services/tokenService');

router.post(
  '/login', 
  loginLimiter
  ,
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return sendError(res, { message: 'Email and password are required', statusCode: 422 });
    }

    const employee = await prisma.employee.findUnique({ where: { email } });
  
    if (!employee || !(await bcrypt.compare(password, employee.password))) {
      return sendError(res, { message: 'Invalid credentials', statusCode: 401 });
    }

    const { accessToken, refreshToken } = await issueTokenPair(employee, {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return success(res, { 
      message: 'Login successful', 
      data: {
        accessToken,
        user: { id: employee.id, email: employee.email, role: employee.role }
      }
    });
  })
);

router.post(
  '/refresh', 
  refreshLimiter
  ,
  asyncHandler(async (req, res) => {
    const incoming = req.cookies?.refreshToken || req.body.refreshToken;
    if (!incoming) {
      return sendError(res, { message: 'Refresh token missing', statusCode: 401 });
    }

    const { accessToken, refreshToken } = await rotateRefreshToken(incoming, {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return success(res, { message: 'Token refreshed successfully', data: { accessToken } });
  })
);

router.post(
  '/logout',
  asyncHandler(async (req, res) => {
    const incoming = req.cookies?.refreshToken || req.body.refreshToken;
    if (incoming) {
      await revokeRefreshToken(incoming);
    }
    res.clearCookie('refreshToken');
    return success(res, { message: 'Logged out successfully' });
  })
);

module.exports = router;