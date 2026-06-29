const { FakeRedis } = require('../mocks/fakeRedis');

const mockFakeRedis = new FakeRedis();

jest.mock('../../config/redisConfig', () => ({
  RedisClient: mockFakeRedis,
}));

jest.mock('../../config/prisma', () => ({
  importOrder: { findUnique: jest.fn() },
  shipment: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

const prisma = require('../../config/prisma');
const ShipmentService = require('../../services/ShipmentService');

describe('ShipmentService (Redis caching)', () => {
  beforeEach(() => {
    mockFakeRedis._reset();
    jest.clearAllMocks();
  });

  describe('getDetail', () => {
    it('caches the shipment detail lookup', async () => {
      prisma.shipment.findUnique.mockResolvedValue({ id: 's1', orderId: 'o1' });

      await ShipmentService.getDetail('s1');
      await ShipmentService.getDetail('s1');

      expect(prisma.shipment.findUnique).toHaveBeenCalledTimes(1);
    });
  });

  describe('createShipment', () => {
    it('invalidates the by-order and list caches after creating a shipment', async () => {
      await mockFakeRedis.set('shipment:order:o1', JSON.stringify([]));

      prisma.importOrder.findUnique.mockResolvedValue({ id: 'o1' });
      prisma.shipment.create.mockResolvedValue({ id: 's1', orderId: 'o1' });

      await ShipmentService.createShipment('o1', { trackingNumber: 'TRK1' });

      expect(await mockFakeRedis.get('shipment:order:o1')).toBeNull();
    });

    it('throws AppError(404) when the order does not exist', async () => {
      prisma.importOrder.findUnique.mockResolvedValue(null);
      await expect(ShipmentService.createShipment('missing', {})).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('updateShipment', () => {
    it('invalidates detail + by-order caches after an update', async () => {
      await mockFakeRedis.set('shipment:s1', JSON.stringify({ id: 's1' }));
      await mockFakeRedis.set('shipment:order:o1', JSON.stringify([]));

      prisma.shipment.findUnique.mockResolvedValue({ id: 's1', orderId: 'o1' });
      prisma.shipment.update.mockResolvedValue({ id: 's1', status: 'IN_TRANSIT' });

      await ShipmentService.updateShipment('s1', { status: 'IN_TRANSIT' });

      expect(await mockFakeRedis.get('shipment:s1')).toBeNull();
      expect(await mockFakeRedis.get('shipment:order:o1')).toBeNull();
    });
  });
});
