const express = require("express");

const router = express.Router();

const { authenticate } = require("../middlewares/authMiddleware");

const {
  validateQuery,
  validateParams,
} = require("../middlewares/validate");

const {
  listNotificationsSchema,
  getNotificationByIdSchema,
  deleteNotificationSchema,
} = require("../middlewares/validation/notifcationSchemas");

const NotificationController = require("../controllers/NotifcationController");

router.use(authenticate);

router.get(
  "/",
  validateQuery(listNotificationsSchema),
  NotificationController.getMyNotifications
);

router.get(
  "/unread-count",
  NotificationController.getUnreadCount
);

router.patch(
  "/:id/read",
  validateParams(getNotificationByIdSchema),
  NotificationController.markAsRead
);

router.patch(
  "/read-all",
  NotificationController.markAllAsRead
);

router.delete(
  "/:id",
  validateParams(deleteNotificationSchema),
  NotificationController.deleteNotification
);

module.exports = router;