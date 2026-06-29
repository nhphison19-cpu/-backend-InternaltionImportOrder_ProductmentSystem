const { FakeRedis } = require('../mocks/fakeRedis');

const mockFakeRedis = new FakeRedis();

jest.mock('../../config/redisConfig', () => ({
  RedisClient: mockFakeRedis,
  RedisBullMQ: mockFakeRedis,
}));

jest.mock('../../config/prisma', () => ({
  inventory: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
}));

const prisma = require('../../config/prisma');
const InventoryService = require('../../services/InventoryService');

describe('InventoryService (Redis caching)', () => {
  beforeEach(() => {
    mockFakeRedis._reset();
    jest.clearAllMocks();
  });

  describe('getOne', () => {
    it('caches the inventory lookup keyed by warehouse + product', async () => {
      prisma.inventory.findUnique.mockResolvedValue({ warehouseId: 'w1', productId: 'p1', quantity: 10 });

      await InventoryService.getOne('w1', 'p1');
      const second = await InventoryService.getOne('w1', 'p1');

      expect(prisma.inventory.findUnique).toHaveBeenCalledTimes(1);
      expect(second.quantity).toBe(10);
    });
  });

  describe('adjustStock', () => {
    it('invalidates the cache for the affected warehouse/product after creating a record', async () => {
      await mockFakeRedis.set('inventory:w1:p1', JSON.stringify({ quantity: 0 }));
      await mockFakeRedis.set('inventory:warehouse:w1', JSON.stringify([]));

      prisma.inventory.findUnique.mockResolvedValue(null);
      prisma.inventory.create.mockResolvedValue({ warehouseId: 'w1', productId: 'p1', quantity: 5 });

      await InventoryService.adjustStock(prisma, { warehouseId: 'w1', productId: 'p1', quantityDelta: 5 });

      expect(await mockFakeRedis.get('inventory:w1:p1')).toBeNull();
      expect(await mockFakeRedis.get('inventory:warehouse:w1')).toBeNull();
    });

    it('throws when subtracting more stock than available', async () => {
      prisma.inventory.findUnique.mockResolvedValue({ warehouseId: 'w1', productId: 'p1', quantity: 2 });

      await expect(
        InventoryService.adjustStock(prisma, { warehouseId: 'w1', productId: 'p1', quantityDelta: -5 })
      ).rejects.toMatchObject({ statusCode: 400 });
    });
  });
});
