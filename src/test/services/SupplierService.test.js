const { FakeRedis } = require('../mocks/fakeRedis');

const mockFakeRedis = new FakeRedis();

jest.mock('../../config/redisConfig', () => ({
  RedisClient: mockFakeRedis,
  RedisBullMQ: mockFakeRedis,
}));

jest.mock('../../config/prisma', () => ({
  supplier: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
}));

const prisma = require('../../config/prisma');
const SupplierService = require('../../services/SupplierService');

describe('SupplierService (Redis caching)', () => {
  beforeEach(() => {
    mockFakeRedis._reset();
    jest.clearAllMocks();
  });

  describe('getDetails', () => {
    it('caches supplier detail lookups', async () => {
      prisma.supplier.findUnique.mockResolvedValue({ id: 's1', name: 'ACME' });

      await SupplierService.getDetails('s1');
      await SupplierService.getDetails('s1');

      expect(prisma.supplier.findUnique).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateSupplier', () => {
    it('invalidates the supplier detail + list caches', async () => {
      await mockFakeRedis.set('supplier:s1', JSON.stringify({ id: 's1', name: 'Old' }));
      await mockFakeRedis.set('supplier:list:1:10:', JSON.stringify({ data: [] }));

      prisma.supplier.findUnique.mockResolvedValue({ id: 's1', name: 'Old' });
      prisma.supplier.update.mockResolvedValue({ id: 's1', name: 'New' });

      await SupplierService.updateSupplier('s1', { name: 'New' });

      expect(await mockFakeRedis.get('supplier:s1')).toBeNull();
      expect(await mockFakeRedis.get('supplier:list:1:10:')).toBeNull();
    });
  });
});
