const { FakeRedis } = require('../mocks/fakeRedis');

const mockFakeRedis = new FakeRedis();

jest.mock('../../config/redisConfig', () => ({
  RedisClient: mockFakeRedis,
  RedisBullMQ: mockFakeRedis,
}));

jest.mock('../../config/prisma', () => ({
  employee: {
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  refreshToken: {
    deleteMany: jest.fn(),
  },
  $transaction: jest.fn((ops) => Promise.all(ops)),
}));

jest.mock('../../services/tokenService', () => ({
  revokeAllForEmployee: jest.fn(),
}));

const prisma = require('../../config/prisma');
const EmployeeService = require('../../services/EmployeeService');

describe('EmployeeService (Redis caching)', () => {
  beforeEach(() => {
    mockFakeRedis._reset();
    jest.clearAllMocks();
  });

  describe('getEmployeeById', () => {
    it('fetches from the database and populates the cache on a miss', async () => {
      prisma.employee.findUnique.mockResolvedValue({ id: 'e1', name: 'Alice' });

      const result = await EmployeeService.getEmployeeById('e1');

      expect(result).toEqual({ id: 'e1', name: 'Alice' });
      expect(prisma.employee.findUnique).toHaveBeenCalledTimes(1);
      expect(await mockFakeRedis.get('employee:e1')).toBe(JSON.stringify({ id: 'e1', name: 'Alice' }));
    });

    it('serves subsequent calls from cache', async () => {
      prisma.employee.findUnique.mockResolvedValue({ id: 'e1', name: 'Alice' });

      await EmployeeService.getEmployeeById('e1');
      await EmployeeService.getEmployeeById('e1');

      expect(prisma.employee.findUnique).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateEmployee', () => {
    it('does not throw "getEmployeeById is not defined" and invalidates the cache', async () => {
      prisma.employee.findUnique.mockResolvedValue({ id: 'e1', name: 'Alice' });
      prisma.employee.update.mockResolvedValue({ id: 'e1', name: 'Alice Updated' });
      await mockFakeRedis.set('employee:e1', JSON.stringify({ id: 'e1', name: 'Alice' }));

      const result = await EmployeeService.updateEmployee('e1', { name: 'Alice Updated' });

      expect(result).toEqual({ id: 'e1', name: 'Alice Updated' });
      expect(await mockFakeRedis.get('employee:e1')).toBeNull();
    });
  });

  describe('deleteEmployee', () => {
    it('removes the employee and invalidates the cache', async () => {
      prisma.employee.findUnique.mockResolvedValue({ id: 'e1', name: 'Alice' });
      await mockFakeRedis.set('employee:e1', JSON.stringify({ id: 'e1', name: 'Alice' }));

      await EmployeeService.deleteEmployee('e1');

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(await mockFakeRedis.get('employee:e1')).toBeNull();
    });
  });
});
