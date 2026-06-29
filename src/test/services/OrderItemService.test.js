const { FakeRedis } = require('../mocks/fakeRedis');

const mockFakeRedis = new FakeRedis();

jest.mock('../../config/redisConfig', () => ({
  RedisClient: mockFakeRedis,
}));

jest.mock('../../config/prisma', () => {
  const client = {
    importOrder: { findUnique: jest.fn(), update: jest.fn() },
    orderItem: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };
  client.$transaction = jest.fn((fn) => fn(client));
  return client;
});

jest.mock('../../services/ImportOrderService', () => ({
  invalidateOrderCache: jest.fn(),
}));

const prisma = require('../../config/prisma');
const { invalidateOrderCache } = require('../../services/ImportOrderService');
const OrderItemService = require('../../services/OrderItemService');

describe('OrderItemService (Redis caching)', () => {
  beforeEach(() => {
    mockFakeRedis._reset();
    jest.clearAllMocks();
    prisma.orderItem.findMany.mockResolvedValue([]);
    prisma.importOrder.update.mockResolvedValue({ id: 'o1', subTotal: 0, totalAmount: 0 });
  });

  describe('getByOrder', () => {
    it('caches the order items lookup', async () => {
      prisma.orderItem.findMany.mockResolvedValue([{ id: 'i1', orderId: 'o1' }]);

      await OrderItemService.getByOrder('o1');
      await OrderItemService.getByOrder('o1');

      expect(prisma.orderItem.findMany).toHaveBeenCalledTimes(1);
    });
  });

  describe('addItem', () => {
    it('invalidates the order-item cache and the parent ImportOrder cache', async () => {
      await mockFakeRedis.set('orderItem:order:o1', JSON.stringify([]));

      prisma.importOrder.findUnique.mockResolvedValue({ id: 'o1', status: 'DRAFT' });
      prisma.orderItem.create.mockResolvedValue({ id: 'i1', orderId: 'o1' });

      await OrderItemService.addItem('o1', { productId: 'p1', quantity: 2, unitPrice: 10 });

      expect(await mockFakeRedis.get('orderItem:order:o1')).toBeNull();
      expect(invalidateOrderCache).toHaveBeenCalledWith('o1');
    });

    it('rejects adding items when the order is not in DRAFT status', async () => {
      prisma.importOrder.findUnique.mockResolvedValue({ id: 'o1', status: 'APPROVED' });

      await expect(
        OrderItemService.addItem('o1', { productId: 'p1', quantity: 1, unitPrice: 10 })
      ).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  describe('removeItem', () => {
    it('invalidates caches using the orderId resolved from the deleted item', async () => {
      await mockFakeRedis.set('orderItem:order:o1', JSON.stringify([]));
      prisma.orderItem.findUnique.mockResolvedValue({ id: 'i1', orderId: 'o1', order: { status: 'DRAFT' } });

      await OrderItemService.removeItem('i1');

      expect(await mockFakeRedis.get('orderItem:order:o1')).toBeNull();
      expect(invalidateOrderCache).toHaveBeenCalledWith('o1');
    });
  });
});
