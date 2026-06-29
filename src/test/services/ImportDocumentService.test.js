const { FakeRedis } = require('../mocks/fakeRedis');

const mockFakeRedis = new FakeRedis();

jest.mock('../../config/redisConfig', () => ({
  RedisClient: mockFakeRedis,
}));

jest.mock('../../config/prisma', () => ({
  importOrder: { findUnique: jest.fn() },
  importDocument: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
}));

const prisma = require('../../config/prisma');
const ImportDocumentService = require('../../services/ImportDocumentService');

describe('ImportDocumentService (Redis caching)', () => {
  beforeEach(() => {
    mockFakeRedis._reset();
    jest.clearAllMocks();
  });

  describe('getDetail', () => {
    it('caches the document detail lookup', async () => {
      prisma.importDocument.findUnique.mockResolvedValue({ id: 'd1', orderId: 'o1' });

      await ImportDocumentService.getDetail('d1');
      await ImportDocumentService.getDetail('d1');

      expect(prisma.importDocument.findUnique).toHaveBeenCalledTimes(1);
    });
  });

  describe('uploadDocument', () => {
    it('invalidates the by-order cache after uploading a document', async () => {
      await mockFakeRedis.set('importDocument:order:o1', JSON.stringify([]));

      prisma.importOrder.findUnique.mockResolvedValue({ id: 'o1' });
      prisma.importDocument.create.mockResolvedValue({ id: 'd1', orderId: 'o1' });

      await ImportDocumentService.uploadDocument('o1', { type: 'INVOICE', fileUrl: 'http://x/y.pdf' });

      expect(await mockFakeRedis.get('importDocument:order:o1')).toBeNull();
    });

    it('throws AppError(404) when the order does not exist', async () => {
      prisma.importOrder.findUnique.mockResolvedValue(null);
      await expect(ImportDocumentService.uploadDocument('missing', {})).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('deleteDocument', () => {
    it('invalidates detail + by-order caches after deletion', async () => {
      await mockFakeRedis.set('importDocument:d1', JSON.stringify({ id: 'd1' }));
      await mockFakeRedis.set('importDocument:order:o1', JSON.stringify([]));

      prisma.importDocument.findUnique.mockResolvedValue({ id: 'd1', orderId: 'o1' });
      prisma.importDocument.delete.mockResolvedValue({ id: 'd1' });

      await ImportDocumentService.deleteDocument('d1');

      expect(await mockFakeRedis.get('importDocument:d1')).toBeNull();
      expect(await mockFakeRedis.get('importDocument:order:o1')).toBeNull();
    });
  });
});
