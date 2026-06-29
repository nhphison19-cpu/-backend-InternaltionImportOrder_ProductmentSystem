const { FakeRedis } = require('./mocks/fakeRedis');

const mockFakeRedis = new FakeRedis();

jest.mock('../config/redisConfig', () => ({
  RedisClient: mockFakeRedis,
  RedisBullMQ: mockFakeRedis,
}));

const {
  getOrSetCache,
  setCache,
  deleteCache,
  deleteCacheByPattern,
  invalidateUserCache,
} = require('../utils/helpers/cacheHelper');

describe('cacheHelper', () => {
  beforeEach(() => {
    mockFakeRedis._reset();
  });

  describe('getOrSetCache', () => {
    it('calls the fetcher and caches the result on a cache miss', async () => {
      const fetcher = jest.fn().mockResolvedValue({ id: 1, name: 'Product A' });

      const result = await getOrSetCache('product:1', fetcher);

      expect(fetcher).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ id: 1, name: 'Product A' });
      expect(await mockFakeRedis.get('product:1')).toBe(JSON.stringify({ id: 1, name: 'Product A' }));
    });

    it('returns the cached value without calling the fetcher on a cache hit', async () => {
      await mockFakeRedis.set('product:1', JSON.stringify({ id: 1, name: 'Cached Product' }));
      const fetcher = jest.fn();

      const result = await getOrSetCache('product:1', fetcher);

      expect(fetcher).not.toHaveBeenCalled();
      expect(result).toEqual({ id: 1, name: 'Cached Product' });
    });

    it('does not cache when the fetcher returns null/undefined', async () => {
      const fetcher = jest.fn().mockResolvedValue(null);

      const result = await getOrSetCache('product:404', fetcher);

      expect(result).toBeNull();
      expect(await mockFakeRedis.get('product:404')).toBeNull();
    });

    it('propagates errors thrown by the fetcher without caching anything', async () => {
      const fetcher = jest.fn().mockRejectedValue(new Error('not found'));

      await expect(getOrSetCache('product:err', fetcher)).rejects.toThrow('not found');
      expect(await mockFakeRedis.get('product:err')).toBeNull();
    });
  });

  describe('setCache / deleteCache', () => {
    it('stores and removes a single key', async () => {
      await setCache('warehouse:1', { id: 1 });
      expect(await mockFakeRedis.get('warehouse:1')).toBe(JSON.stringify({ id: 1 }));

      await deleteCache('warehouse:1');
      expect(await mockFakeRedis.get('warehouse:1')).toBeNull();
    });
  });

  describe('deleteCacheByPattern', () => {
    it('removes every key matching the pattern', async () => {
      await mockFakeRedis.set('product:list:1:10:', '[]');
      await mockFakeRedis.set('product:list:2:10:', '[]');
      await mockFakeRedis.set('product:1', '{}');

      await deleteCacheByPattern('product:list:*');

      expect(await mockFakeRedis.get('product:list:1:10:')).toBeNull();
      expect(await mockFakeRedis.get('product:list:2:10:')).toBeNull();
      expect(await mockFakeRedis.get('product:1')).toBe('{}');
    });

    it('does nothing when no keys match', async () => {
      await expect(deleteCacheByPattern('nothing:matches:*')).resolves.not.toThrow();
    });
  });

  describe('invalidateUserCache', () => {
    it('deletes the auth:user cache key for the given id', async () => {
      await mockFakeRedis.set('auth:user:42', '{"id":42}');

      await invalidateUserCache(42);

      expect(await mockFakeRedis.get('auth:user:42')).toBeNull();
    });
  });
});
