const NotifcationService = require('../services/NotifcationService')
const { asyncHandler } = require('../middlewares/asyncHandler')
const { success, paginated } = require('../utils/helpers/responseHelper')

class NotificationController {

    getMyNotifications = asyncHandler(async (req, res) => {
        const { page = 1, limit = 10, isRead, type } = req.query
        const result = await NotifcationService.getMyNotifications(req.user.id, {
            page,
            limit,
            isRead: isRead === undefined ? undefined : isRead === 'true' || isRead === true,
            type,
        })
        return paginated(res, {
            message: 'notifications list',
            data: result.data,
            page: result.page,
            limit: result.limit,
            total: result.total,
        })
    })

    getUnreadCount = asyncHandler(async (req, res) => {
        const count = await NotifcationService.getUnreadCount(req.user.id)
        return success(res, { message: 'unread notification count', data: { count } })
    })

    markAsRead = asyncHandler(async (req, res) => {
        const result = await NotifcationService.markAsRead(req.params.id, req.user.id)
        return success(res, { message: 'notification marked as read', data: result })
    })

    markAllAsRead = asyncHandler(async (req, res) => {
        const result = await NotifcationService.markAllAsRead(req.user.id)
        return success(res, { message: 'all notifications marked as read', data: result })
    })

    deleteNotification = asyncHandler(async (req, res) => {
        const result = await NotifcationService.deleteNotification(req.params.id, req.user.id)
        return success(res, { message: 'notification deleted', data: result })
    })
}

module.exports = new NotificationController()
