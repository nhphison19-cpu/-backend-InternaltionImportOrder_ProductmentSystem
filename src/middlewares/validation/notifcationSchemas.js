// src/middlewares/validation/notifcationSchemas.js
const { z } = require('zod');

// ─── Enums ────────────────────────────────────────────────────────────────────
const NotificationTypeEnum = z.enum([
  'ORDER_CREATED',
  'ORDER_UPDATED',
  'ORDER_CANCELLED',
  'SHIPMENT_DISPATCHED',
  'SHIPMENT_DELIVERED',
  'PAYMENT_RECEIVED',
  'PAYMENT_FAILED',
  'INVENTORY_LOW',
  'IMPORT_ORDER_APPROVED',
  'IMPORT_DOCUMENT_UPLOADED',
  'CUSTOMS_CLEARED',
  'SYSTEM_ALERT',
]);

const NotificationStatusEnum = z.enum(['UNREAD', 'READ', 'ARCHIVED']);

const NotificationPriorityEnum = z.enum(['LOW', 'NORMAL', 'HIGH', 'CRITICAL']);

// ─── Base notification fields ─────────────────────────────────────────────────
const baseNotificationSchema = z.object({
  title: z
    .string({ required_error: 'Title is required' })
    .min(1, 'Title cannot be empty')
    .max(255, 'Title must be at most 255 characters'),

  message: z
    .string({ required_error: 'Message is required' })
    .min(1, 'Message cannot be empty')
    .max(2000, 'Message must be at most 2000 characters'),

  type: NotificationTypeEnum,

  priority: NotificationPriorityEnum.default('NORMAL'),

  // Optional recipient — if omitted the service broadcasts or uses the auth token user
  recipientId: z
    .string()
    .cuid2('Invalid recipient ID')
    .optional(),

  // Optional reference to the related entity (order, shipment, …)
  entityId: z
    .string()
    .cuid2('Invalid entity ID')
    .optional(),

  entityType: z
    .string()
    .max(100)
    .optional(),

  metadata: z
    .record(z.unknown())
    .optional(),

  // Schedule delivery for a future time (ISO-8601)
  scheduledAt: z
    .string()
    .datetime({ message: 'scheduledAt must be a valid ISO-8601 datetime' })
    .optional(),
});

// ─── Create ───────────────────────────────────────────────────────────────────
const createNotificationSchema = z.object({
  body: baseNotificationSchema,
});

// ─── Bulk create ──────────────────────────────────────────────────────────────
const createBulkNotificationSchema = z.object({
  body: z.object({
    notifications: z
      .array(baseNotificationSchema)
      .min(1, 'At least one notification is required')
      .max(100, 'Cannot send more than 100 notifications at once'),
  }),
});

// ─── Update status ────────────────────────────────────────────────────────────
const updateNotificationStatusSchema = z.object({
  params: z.object({
    id: z.string().cuid2('Invalid notification ID'),
  }),
  body: z.object({
    status: NotificationStatusEnum,
  }),
});

// ─── Mark many as read ────────────────────────────────────────────────────────
const markManyReadSchema = z.object({
  body: z.object({
    ids: z
      .array(z.string().cuid2('Invalid notification ID'))
      .min(1, 'At least one ID is required')
      .max(200, 'Cannot update more than 200 notifications at once'),
  }),
});

// ─── Get by ID ────────────────────────────────────────────────────────────────
const getNotificationByIdSchema = z.object({
  params: z.object({
    id: z.string().cuid2('Invalid notification ID'),
  }),
});

// ─── List / filter ────────────────────────────────────────────────────────────
const listNotificationsSchema = z.object({
  query: z
    .object({
      status: NotificationStatusEnum.optional(),
      type: NotificationTypeEnum.optional(),
      priority: NotificationPriorityEnum.optional(),
      recipientId: z.string().cuid2().optional(),
      page: z
        .string()
        .regex(/^\d+$/, 'page must be a positive integer')
        .transform(Number)
        .refine((n) => n >= 1, 'page must be >= 1')
        .default('1'),
      limit: z
        .string()
        .regex(/^\d+$/, 'limit must be a positive integer')
        .transform(Number)
        .refine((n) => n >= 1 && n <= 100, 'limit must be between 1 and 100')
        .default('20'),
      startDate: z.string().datetime().optional(),
      endDate: z.string().datetime().optional(),
    })
    .refine(
      (data) =>
        !data.startDate ||
        !data.endDate ||
        new Date(data.startDate) <= new Date(data.endDate),
      { message: 'startDate must be before or equal to endDate', path: ['startDate'] }
    ),
});

// ─── Delete ───────────────────────────────────────────────────────────────────
const deleteNotificationSchema = z.object({
  params: z.object({
    id: z.string().cuid2('Invalid notification ID'),
  }),
});

// ─── Queue job payload (internal — used by BullMQ producer) ──────────────────
const notificationJobSchema = z.object({
  notificationId: z.string().cuid2(),
  recipientId: z.string().cuid2(),
  channel: z.enum(['IN_APP', 'EMAIL', 'SMS', 'PUSH']).default('IN_APP'),
  retryCount: z.number().int().min(0).default(0),
  payload: baseNotificationSchema,
});

module.exports = {
  NotificationTypeEnum,
  NotificationStatusEnum,
  NotificationPriorityEnum,
  createNotificationSchema,
  createBulkNotificationSchema,
  updateNotificationStatusSchema,
  markManyReadSchema,
  getNotificationByIdSchema,
  listNotificationsSchema,
  deleteNotificationSchema,
  notificationJobSchema,
};