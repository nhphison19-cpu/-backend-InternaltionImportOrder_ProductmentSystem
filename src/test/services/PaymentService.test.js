const { FakeRedis } = require('../mocks/fakeRedis');

const mockFakeRedis = new FakeRedis();

jest.mock('../../config/redisConfig', () => ({
  RedisClient: mockFakeRedis,
}));

jest.mock('../../config/prisma', () => {
  const client = {
    importOrder: { findUnique: jest.fn(), update: jest.fn() },
    payment: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };
  client.$transaction = jest.fn((fn) => fn(client));
  return client;
});

const prisma = require('../../config/prisma');
const PaymentService = require('../../services/PaymentService');

describe('PaymentService (Redis caching)', () => {
  beforeEach(() => {
    mockFakeRedis._reset();
    jest.clearAllMocks();
    prisma.payment.findMany.mockResolvedValue([]);
    prisma.importOrder.findUnique.mockResolvedValue({ id: 'o1', totalAmount: 100 });
    prisma.importOrder.update.mockResolvedValue({ id: 'o1', paymentStatus: 'UNPAID' });
  });

  describe('getDetail', () => {
    it('caches the payment detail lookup', async () => {
      prisma.payment.findUnique.mockResolvedValue({ id: 'p1', orderId: 'o1' });

      await PaymentService.getDetail('p1');
      await PaymentService.getDetail('p1');

      expect(prisma.payment.findUnique).toHaveBeenCalledTimes(1);
    });
  });

  describe('createPayment', () => {
    it('invalidates the by-order cache after creating a payment', async () => {
      await mockFakeRedis.set('payment:order:o1', JSON.stringify([]));

      prisma.payment.create.mockResolvedValue({ id: 'p1', orderId: 'o1', amount: 50 });

      await PaymentService.createPayment('o1', { amount: 50 });

      expect(await mockFakeRedis.get('payment:order:o1')).toBeNull();
    });
  });

  describe('markPaid', () => {
    it('invalidates detail + by-order caches after marking a payment as paid', async () => {
      await mockFakeRedis.set('payment:p1', JSON.stringify({ id: 'p1' }));
      await mockFakeRedis.set('payment:order:o1', JSON.stringify([]));

      prisma.payment.findUnique.mockResolvedValue({ id: 'p1', orderId: 'o1' });
      prisma.payment.update.mockResolvedValue({ id: 'p1', status: 'PAID', orderId: 'o1' });

      await PaymentService.markPaid('p1');

      expect(await mockFakeRedis.get('payment:p1')).toBeNull();
      expect(await mockFakeRedis.get('payment:order:o1')).toBeNull();
    });
  });
});
