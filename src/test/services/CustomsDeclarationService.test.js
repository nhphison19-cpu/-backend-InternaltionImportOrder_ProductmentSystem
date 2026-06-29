const { FakeRedis } = require('../mocks/fakeRedis');

const mockFakeRedis = new FakeRedis();

jest.mock('../../config/redisConfig', () => ({
  RedisClient: mockFakeRedis,
}));

jest.mock('../../config/prisma', () => ({
  importOrder: { findUnique: jest.fn() },
  customsDeclaration: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
}));

const prisma = require('../../config/prisma');
const CustomsDeclarationService = require('../../services/CustomsDeclarationService');

describe('CustomsDeclarationService (Redis caching)', () => {
  beforeEach(() => {
    mockFakeRedis._reset();
    jest.clearAllMocks();
  });

  describe('getDetail', () => {
    it('caches the declaration detail lookup', async () => {
      prisma.customsDeclaration.findUnique.mockResolvedValue({ id: 'c1', orderId: 'o1' });

      await CustomsDeclarationService.getDetail('c1');
      await CustomsDeclarationService.getDetail('c1');

      expect(prisma.customsDeclaration.findUnique).toHaveBeenCalledTimes(1);
    });
  });

  describe('createDeclaration', () => {
    it('invalidates the by-order cache after creating a declaration', async () => {
      await mockFakeRedis.set('customsDeclaration:order:o1', JSON.stringify([]));

      prisma.importOrder.findUnique.mockResolvedValue({ id: 'o1' });
      prisma.customsDeclaration.findUnique.mockResolvedValue(null);
      prisma.customsDeclaration.create.mockResolvedValue({ id: 'c1', orderId: 'o1' });

      await CustomsDeclarationService.createDeclaration('o1', { declarationNo: 'DEC1', declaredValue: 100 });

      expect(await mockFakeRedis.get('customsDeclaration:order:o1')).toBeNull();
    });

    it('throws AppError(400) when the declaration number already exists', async () => {
      prisma.importOrder.findUnique.mockResolvedValue({ id: 'o1' });
      prisma.customsDeclaration.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(
        CustomsDeclarationService.createDeclaration('o1', { declarationNo: 'DEC1' })
      ).rejects.toMatchObject({ statusCode: 400 });
    });
  });
});
