// src/services/NotifcationService.js
const prisma = require('../config/prisma');
const { AppError } = require('../middlewares/errorHandler');

/**
 * NotifcationService
 *
 * Model Prisma thực tế:
 *   Notification { id, title, message, type, priority, employeeId, isRead,
 *                  readAt, referenceId, referenceType, url, createdAt }
 *
 * Việc gửi qua kênh ngoài (EMAIL / SMS / PUSH) là "best-effort": nếu gửi lỗi,
 * không được làm fail luồng nghiệp vụ chính (tạo đơn, thanh toán, ...).
 */

const VALID_CHANNELS = ['IN_APP', 'EMAIL', 'SMS', 'PUSH'];

// ─── External dispatchers (stub - tích hợp provider thật ở đây) ───────────────
async function dispatchEmail(notification) {
  // TODO: tích hợp nodemailer / SES
  console.log(`[Notification] EMAIL -> employee ${notification.employeeId}: ${notification.title}`);
}

async function dispatchSms(notification) {
  // TODO: tích hợp Twilio / SMS provider
  console.log(`[Notification] SMS -> employee ${notification.employeeId}: ${notification.title}`);
}

async function dispatchPush(notification) {
  // TODO: tích hợp FCM / APNs
  console.log(`[Notification] PUSH -> employee ${notification.employeeId}: ${notification.title}`);
}

async function dispatchExternalChannels(notification, channels = []) {
  const jobs = channels
    .filter((c) => c !== 'IN_APP')
    .map(async (channel) => {
      try {
        if (channel === 'EMAIL') await dispatchEmail(notification);
        else if (channel === 'SMS') await dispatchSms(notification);
        else if (channel === 'PUSH') await dispatchPush(notification);
      } catch (err) {
        console.error(`[Notification] Failed to dispatch ${channel}:`, err.message);
      }
    });
  await Promise.all(jobs);
}

// ─── Core service methods ──────────────────────────────────────────────────────

const createNotification = async (payload) => {
  const {
    employeeId,
    title,
    message,
    type,
    priority = 'MEDIUM',
    referenceId,
    referenceType,
    url,
    channels = ['IN_APP'],
  } = payload || {};

  if (!employeeId) throw new AppError('employeeId is required', 400);
  if (!title) throw new AppError('title is required', 400);
  if (!message) throw new AppError('message is required', 400);
  if (!type) throw new AppError('type is required', 400);

  const invalidChannel = channels.find((c) => !VALID_CHANNELS.includes(c));
  if (invalidChannel) {
    throw new AppError(`Invalid channel: ${invalidChannel}`, 400);
  }

  const notification = await prisma.notification.create({
    data: { title, message, type, priority, employeeId, referenceId, referenceType, url },
  });

  // Best-effort, không chặn / không throw lên trên
  dispatchExternalChannels(notification, channels).catch(() => {});

  return notification;
};

const createNotificationForMany = async (employeeIds, payload) => {
  if (!Array.isArray(employeeIds) || employeeIds.length === 0) {
    throw new AppError('employeeIds must be a non-empty array', 400);
  }

  const { title, message, type, priority = 'MEDIUM', referenceId, referenceType, url, channels = ['IN_APP'] } = payload || {};
  if (!title || !message || !type) {
    throw new AppError('title, message and type are required', 400);
  }

  const created = await prisma.$transaction(
    employeeIds.map((employeeId) =>
      prisma.notification.create({
        data: { title, message, type, priority, employeeId, referenceId, referenceType, url },
      })
    )
  );

  await Promise.all(created.map((n) => dispatchExternalChannels(n, channels).catch(() => {})));

  return created;
};

const getMyNotifications = async (employeeId, { page = 1, limit = 10, isRead, type } = {}) => {
  if (!employeeId) throw new AppError('employeeId is required', 400);

  const p = Math.max(parseInt(page) || 1, 1);
  const l = Math.min(Math.max(parseInt(limit) || 10, 1), 100);

  const where = { employeeId };
  if (isRead !== undefined) where.isRead = isRead;
  if (type) where.type = type;

  const [data, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      skip: (p - 1) * l,
      take: l,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.notification.count({ where }),
  ]);

  return { data, total, page: p, limit: l };
};

const getUnreadCount = async (employeeId) => {
  if (!employeeId) throw new AppError('employeeId is required', 400);
  return prisma.notification.count({ where: { employeeId, isRead: false } });
};

const markAsRead = async (id, employeeId) => {
  const notification = await prisma.notification.findUnique({ where: { id } });
  if (!notification) throw new AppError('Notification is not found', 404);
  if (notification.employeeId !== employeeId) {
    throw new AppError('Bạn không có quyền với notification này', 403);
  }
  if (notification.isRead) return notification;

  return prisma.notification.update({
    where: { id },
    data: { isRead: true, readAt: new Date() },
  });
};

const markAllAsRead = async (employeeId) => {
  if (!employeeId) throw new AppError('employeeId is required', 400);
  const { count } = await prisma.notification.updateMany({
    where: { employeeId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
  return { updated: count };
};

const deleteNotification = async (id, employeeId) => {
  const notification = await prisma.notification.findUnique({ where: { id } });
  if (!notification) throw new AppError('Notification is not found', 404);
  if (notification.employeeId !== employeeId) {
    throw new AppError('Bạn không có quyền với notification này', 403);
  }
  return prisma.notification.delete({ where: { id } });
};

module.exports = {
  VALID_CHANNELS,
  createNotification,
  createNotificationForMany,
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  dispatchEmail,
  dispatchSms,
  dispatchPush,
};
