const { FakeRedis } = require('../mocks/fakeRedis');

const mockFakeRedis = new FakeRedis();

jest.mock('../../config/redisConfig', () => ({
  RedisClient: mockFakeRedis,
}));

jest.mock('../../config/prisma', () => ({
  warehouse: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

const prisma = require('../../config/prisma');
const WarehouseService = require('../../services/WarehouseService');

describe('WarehouseService (Redis caching)', () => {
  beforeEach(() => {
    mockFakeRedis._reset();
    jest.clearAllMocks();
  });

  describe('getDetails', () => {
    it('caches the warehouse detail lookup', async () => {
      prisma.warehouse.findUnique.mockResolvedValue({ id: 'w1', name: 'Main' });

      await WarehouseService.getDetails('w1');
      await WarehouseService.getDetails('w1');

      expect(prisma.warehouse.findUnique).toHaveBeenCalledTimes(1);
    });

    it('throws AppError(404) when not found', async () => {
      prisma.warehouse.findUnique.mockResolvedValue(null);
      await expect(WarehouseService.getDetails('missing')).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('updateWarehouse', () => {
    it('invalidates detail + list caches after an update', async () => {
      await mockFakeRedis.set('warehouse:w1', JSON.stringify({ id: 'w1' }));
      await mockFakeRedis.set('warehouse:list:1:10:', JSON.stringify({ data: [] }));

      prisma.warehouse.findUnique.mockResolvedValue({ id: 'w1', name: 'Old' });
      prisma.warehouse.findFirst.mockResolvedValue(null);
      prisma.warehouse.update.mockResolvedValue({ id: 'w1', name: 'Updated' });

      await WarehouseService.updateWarehouse('w1', { name: 'Updated' });

      expect(await mockFakeRedis.get('warehouse:w1')).toBeNull();
      expect(await mockFakeRedis.get('warehouse:list:1:10:')).toBeNull();
    });
  });
});
