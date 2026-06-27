const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const prisma = require('../config/prisma');

const ACCESS_SECRET = process.env.ACCESS_TOKEN;
const REFRESH_SECRET = process.env.REFRESH_TOKEN;
const ACCESS_TTL = process.env.ACCESS_TOKEN_TTL || '15m';
const REFRESH_TTL_DAYS = Number(process.env.REFRESH_TOKEN_TTL_DAYS || 30);

if (!ACCESS_SECRET || !REFRESH_SECRET) {
  throw new Error('CRITICAL: ACCESS_TOKEN and REFRESH_TOKEN must be defined in .env file');
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function signAccessToken(employee) {
  return jwt.sign(
    { sub: employee.id, role: employee.role, email: employee.email },
    ACCESS_SECRET,
    { expiresIn: ACCESS_TTL }
  );
}

function signRefreshToken(employee) {
  return jwt.sign({ sub: employee.id }, REFRESH_SECRET, { expiresIn: `${REFRESH_TTL_DAYS}d` });
}

async function issueTokenPair(employee, meta = {}) {
  const accessToken = signAccessToken(employee);
  const refreshToken = signRefreshToken(employee);

  const expiresAt = new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({
    data: {
      tokenHash: hashToken(refreshToken),
      employeeId: employee.id,
      expiresAt,
      userAgent: meta.userAgent || null,
      ipAddress: meta.ipAddress || null,
    },
  });

  return { accessToken, refreshToken };
}

async function rotateRefreshToken(oldRefreshToken, meta = {}) {
  let payload;
  try {
    payload = jwt.verify(oldRefreshToken, REFRESH_SECRET);
  } catch (err) {
    throw Object.assign(new Error('Invalid or expired refresh token'), { statusCode: 401 });
  }

  const tokenHash = hashToken(oldRefreshToken);
  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });

  if (!stored || stored.revoked) {
    if (stored) {
      await prisma.refreshToken.updateMany({
        where: { employeeId: stored.employeeId },
        data: { revoked: true },
      });
    }
    throw Object.assign(new Error('Refresh token has been revoked due to reuse detection'), { statusCode: 401 });
  }

  if (stored.expiresAt < new Date()) {
    throw Object.assign(new Error('Refresh token expired'), { statusCode: 401 });
  }

  const employee = await prisma.employee.findUnique({ where: { id: payload.sub } });
  if (!employee) {
    throw Object.assign(new Error('Employee no longer exists'), { statusCode: 401 });
  }

  await prisma.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } });

  return issueTokenPair(employee, meta);
}

async function revokeRefreshToken(refreshToken) {
  const tokenHash = hashToken(refreshToken);
  await prisma.refreshToken.updateMany({ where: { tokenHash }, data: { revoked: true } });
}

async function revokeAllForEmployee(employeeId) {
  await prisma.refreshToken.updateMany({ where: { employeeId }, data: { revoked: true } });
}

module.exports = {
  signAccessToken,
  issueTokenPair,
  rotateRefreshToken,
  revokeRefreshToken,
  revokeAllForEmployee,
  hashToken,
};