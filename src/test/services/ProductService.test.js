const { FakeRedis } = require('../mocks/fakeRedis');

const mockFakeRedis = new FakeRedis();

jest.mock('../../config/redisConfig', () => ({
  RedisClient: mockFakeRedis,
  RedisBullMQ: mockFakeRedis,
}));

jest.mock('../../config/prisma', () => ({
  product: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

const prisma = require('../../config/prisma');
const ProductService = require('../../services/ProductService');

describe('ProductService (Redis caching)', () => {
  beforeEach(() => {
    mockFakeRedis._reset();
    jest.clearAllMocks();
  });

  describe('getdetail', () => {
    it('hits the database on first call and caches the result', async () => {
      prisma.product.findUnique.mockResolvedValue({ id: '1', name: 'SKU-1' });

      const result = await ProductService.getdetail('1');

      expect(prisma.product.findUnique).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ id: '1', name: 'SKU-1' });
    });

    it('serves the second call from Redis without hitting the database', async () => {
      prisma.product.findUnique.mockResolvedValue({ id: '1', name: 'SKU-1' });

      await ProductService.getdetail('1');
      const result = await ProductService.getdetail('1');

      expect(prisma.product.findUnique).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ id: '1', name: 'SKU-1' });
    });

    it('throws AppError(404) and does not cache when product is missing', async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(ProductService.getdetail('missing')).rejects.toMatchObject({
        statusCode: 404,
      });
      expect(await mockFakeRedis.get('product:missing')).toBeNull();
    });
  });

  describe('updateProduct', () => {
    it('invalidates the product detail and list caches after an update', async () => {
      await mockFakeRedis.set('product:1', JSON.stringify({ id: '1', name: 'Old' }));
      await mockFakeRedis.set('product:list:1:10:', JSON.stringify({ data: [] }));

      prisma.product.findUnique.mockResolvedValue({ id: '1', name: 'Old' });
      prisma.product.update.mockResolvedValue({ id: '1', name: 'New' });

      const updated = await ProductService.updateProduct('1', { name: 'New' });

      expect(updated).toEqual({ id: '1', name: 'New' });
      expect(await mockFakeRedis.get('product:1')).toBeNull();
      expect(await mockFakeRedis.get('product:list:1:10:')).toBeNull();
    });
  });

  describe('deleteProduct', () => {
    it('invalidates caches after a soft delete', async () => {
      await mockFakeRedis.set('product:1', JSON.stringify({ id: '1' }));

      prisma.product.findUnique.mockResolvedValue({ id: '1' });
      prisma.product.delete.mockResolvedValue({ id: '1', deleteAt: new Date() });

      await ProductService.deleteProduct('1');

      expect(await mockFakeRedis.get('product:1')).toBeNull();
    });
  });
});
