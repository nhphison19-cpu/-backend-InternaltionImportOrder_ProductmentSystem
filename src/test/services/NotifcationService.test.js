jest.mock('../../config/prisma', () => {
  const client = {
    notification: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };
  client.$transaction = jest.fn((arg) => {
    // service uses $transaction with an array of promises (createNotificationForMany)
    if (Array.isArray(arg)) return Promise.all(arg);
    return arg(client);
  });
  return client;
});

const prisma = require('../../config/prisma');
const NotifcationService = require('../../services/NotifcationService');

describe('NotifcationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createNotification', () => {
    const basePayload = {
      employeeId: 'emp1',
      title: 'Đơn hàng mới',
      message: 'Đơn hàng PO-001 đã được tạo',
      type: 'ORDER_CREATED',
    };

    it('creates a notification with default priority MEDIUM and IN_APP channel', async () => {
      prisma.notification.create.mockResolvedValue({ id: 'n1', ...basePayload, priority: 'MEDIUM' });

      const result = await NotifcationService.createNotification(basePayload);

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: {
          title: basePayload.title,
          message: basePayload.message,
          type: basePayload.type,
          priority: 'MEDIUM',
          employeeId: 'emp1',
          referenceId: undefined,
          referenceType: undefined,
          url: undefined,
        },
      });
      expect(result).toEqual({ id: 'n1', ...basePayload, priority: 'MEDIUM' });
    });

    it('persists referenceId / referenceType / url / priority when provided', async () => {
      prisma.notification.create.mockResolvedValue({ id: 'n2' });

      await NotifcationService.createNotification({
        ...basePayload,
        priority: 'HIGH',
        referenceId: 'order-1',
        referenceType: 'IMPORT_ORDER',
        url: '/orders/order-1',
      });

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          priority: 'HIGH',
          referenceId: 'order-1',
          referenceType: 'IMPORT_ORDER',
          url: '/orders/order-1',
        }),
      });
    });

    it('throws when employeeId is missing', async () => {
      await expect(
        NotifcationService.createNotification({ ...basePayload, employeeId: undefined })
      ).rejects.toMatchObject({ statusCode: 400 });
      expect(prisma.notification.create).not.toHaveBeenCalled();
    });

    it('throws when title is missing', async () => {
      await expect(
        NotifcationService.createNotification({ ...basePayload, title: undefined })
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('throws when an invalid channel is provided', async () => {
      await expect(
        NotifcationService.createNotification({ ...basePayload, channels: ['FAX'] })
      ).rejects.toMatchObject({ statusCode: 400 });
      expect(prisma.notification.create).not.toHaveBeenCalled();
    });

    it('dispatches to external channels without throwing if dispatch fails', async () => {
      prisma.notification.create.mockResolvedValue({ id: 'n3', employeeId: 'emp1', title: 'x' });
      const spy = jest
        .spyOn(NotifcationService, 'dispatchEmail')
        .mockRejectedValue(new Error('SMTP down'));

      await expect(
        NotifcationService.createNotification({ ...basePayload, channels: ['IN_APP', 'EMAIL'] })
      ).resolves.toMatchObject({ id: 'n3' });

      // give the fire-and-forget dispatch a tick to run
      await new Promise((r) => setImmediate(r));
      spy.mockRestore();
    });
  });

  describe('createNotificationForMany', () => {
    it('creates one notification per employeeId via a transaction', async () => {
      prisma.notification.create
        .mockResolvedValueOnce({ id: 'n1', employeeId: 'emp1' })
        .mockResolvedValueOnce({ id: 'n2', employeeId: 'emp2' });

      const result = await NotifcationService.createNotificationForMany(['emp1', 'emp2'], {
        title: 'Cảnh báo tồn kho',
        message: 'Sản phẩm SP001 dưới mức tối thiểu',
        type: 'INVENTORY_LOW',
      });

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.notification.create).toHaveBeenCalledTimes(2);
      expect(result).toEqual([
        { id: 'n1', employeeId: 'emp1' },
        { id: 'n2', employeeId: 'emp2' },
      ]);
    });

    it('throws when employeeIds is empty', async () => {
      await expect(
        NotifcationService.createNotificationForMany([], { title: 't', message: 'm', type: 'SYSTEM' })
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('throws when required fields are missing', async () => {
      await expect(
        NotifcationService.createNotificationForMany(['emp1'], { title: 't' })
      ).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  describe('getMyNotifications', () => {
    it('returns paginated data scoped to the employee', async () => {
      prisma.notification.findMany.mockResolvedValue([{ id: 'n1' }]);
      prisma.notification.count.mockResolvedValue(1);

      const result = await NotifcationService.getMyNotifications('emp1', { page: 2, limit: 5 });

      expect(prisma.notification.findMany).toHaveBeenCalledWith({
        where: { employeeId: 'emp1' },
        skip: 5,
        take: 5,
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual({ data: [{ id: 'n1' }], total: 1, page: 2, limit: 5 });
    });

    it('filters by isRead and type when provided', async () => {
      prisma.notification.findMany.mockResolvedValue([]);
      prisma.notification.count.mockResolvedValue(0);

      await NotifcationService.getMyNotifications('emp1', { isRead: false, type: 'ORDER_CREATED' });

      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { employeeId: 'emp1', isRead: false, type: 'ORDER_CREATED' },
        })
      );
    });

    it('throws when employeeId is missing', async () => {
      await expect(NotifcationService.getMyNotifications()).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  describe('getUnreadCount', () => {
    it('counts unread notifications for the employee', async () => {
      prisma.notification.count.mockResolvedValue(3);

      const count = await NotifcationService.getUnreadCount('emp1');

      expect(prisma.notification.count).toHaveBeenCalledWith({
        where: { employeeId: 'emp1', isRead: false },
      });
      expect(count).toBe(3);
    });
  });

  describe('markAsRead', () => {
    it('marks an unread notification as read', async () => {
      prisma.notification.findUnique.mockResolvedValue({ id: 'n1', employeeId: 'emp1', isRead: false });
      prisma.notification.update.mockResolvedValue({ id: 'n1', isRead: true });

      const result = await NotifcationService.markAsRead('n1', 'emp1');

      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'n1' },
        data: { isRead: true, readAt: expect.any(Date) },
      });
      expect(result).toEqual({ id: 'n1', isRead: true });
    });

    it('is idempotent - returns early if already read', async () => {
      const existing = { id: 'n1', employeeId: 'emp1', isRead: true };
      prisma.notification.findUnique.mockResolvedValue(existing);

      const result = await NotifcationService.markAsRead('n1', 'emp1');

      expect(prisma.notification.update).not.toHaveBeenCalled();
      expect(result).toBe(existing);
    });

    it('throws 404 when notification does not exist', async () => {
      prisma.notification.findUnique.mockResolvedValue(null);

      await expect(NotifcationService.markAsRead('missing', 'emp1')).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it('throws 403 when the notification belongs to another employee', async () => {
      prisma.notification.findUnique.mockResolvedValue({ id: 'n1', employeeId: 'emp2', isRead: false });

      await expect(NotifcationService.markAsRead('n1', 'emp1')).rejects.toMatchObject({
        statusCode: 403,
      });
      expect(prisma.notification.update).not.toHaveBeenCalled();
    });
  });

  describe('markAllAsRead', () => {
    it('marks every unread notification of the employee as read', async () => {
      prisma.notification.updateMany.mockResolvedValue({ count: 4 });

      const result = await NotifcationService.markAllAsRead('emp1');

      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: { employeeId: 'emp1', isRead: false },
        data: { isRead: true, readAt: expect.any(Date) },
      });
      expect(result).toEqual({ updated: 4 });
    });
  });

  describe('deleteNotification', () => {
    it('deletes a notification owned by the employee', async () => {
      prisma.notification.findUnique.mockResolvedValue({ id: 'n1', employeeId: 'emp1' });
      prisma.notification.delete.mockResolvedValue({ id: 'n1' });

      const result = await NotifcationService.deleteNotification('n1', 'emp1');

      expect(prisma.notification.delete).toHaveBeenCalledWith({ where: { id: 'n1' } });
      expect(result).toEqual({ id: 'n1' });
    });

    it('throws 404 when notification does not exist', async () => {
      prisma.notification.findUnique.mockResolvedValue(null);

      await expect(NotifcationService.deleteNotification('missing', 'emp1')).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it('throws 403 when employee does not own the notification', async () => {
      prisma.notification.findUnique.mockResolvedValue({ id: 'n1', employeeId: 'emp2' });

      await expect(NotifcationService.deleteNotification('n1', 'emp1')).rejects.toMatchObject({
        statusCode: 403,
      });
      expect(prisma.notification.delete).not.toHaveBeenCalled();
    });
  });
});
