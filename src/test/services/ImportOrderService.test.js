const { FakeRedis } = require('../mocks/fakeRedis');

const mockFakeRedis = new FakeRedis();

jest.mock('../../config/redisConfig', () => ({
  RedisClient: mockFakeRedis,
  RedisBullMQ: mockFakeRedis,
}));

jest.mock('../../config/prisma', () => ({
  importOrder: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
  },
  $transaction: jest.fn((fn) => fn(mockPrismaTx)),
}));

const mockPrismaTx = {
  importOrder: { findUnique: jest.fn(), update: jest.fn() },
};

jest.mock('../../services/InventoryService', () => ({
  receiveOrder: jest.fn(),
}));

const prisma = require('../../config/prisma');
const ImportOrderService = require('../../services/ImportOrderService');

describe('ImportOrderService (Redis caching)', () => {
  beforeEach(() => {
    mockFakeRedis._reset();
    jest.clearAllMocks();
  });

  describe('getById', () => {
    it('caches the order detail lookup', async () => {
      prisma.importOrder.findUnique.mockResolvedValue({ id: 'o1', status: 'DRAFT' });

      await ImportOrderService.getById('o1');
      await ImportOrderService.getById('o1');

      expect(prisma.importOrder.findUnique).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateIO', () => {
    it('invalidates the order cache and list cache after an update', async () => {
      await mockFakeRedis.set('importOrder:o1', JSON.stringify({ id: 'o1' }));
      await mockFakeRedis.set('importOrder:list:1:10:::', JSON.stringify({ data: [] }));

      prisma.importOrder.findUnique.mockResolvedValue({ id: 'o1', status: 'DRAFT' });
      prisma.importOrder.update.mockResolvedValue({ id: 'o1', notes: 'updated' });

      await ImportOrderService.updateIO('o1', { notes: 'updated' });

      expect(await mockFakeRedis.get('importOrder:o1')).toBeNull();
      expect(await mockFakeRedis.get('importOrder:list:1:10:::')).toBeNull();
    });

    it('rejects edits when the order is no longer in DRAFT status', async () => {
      prisma.importOrder.findUnique.mockResolvedValue({ id: 'o1', status: 'APPROVED' });

      await expect(ImportOrderService.updateIO('o1', { notes: 'x' })).rejects.toMatchObject({
        statusCode: 400,
      });
    });
  });
});
