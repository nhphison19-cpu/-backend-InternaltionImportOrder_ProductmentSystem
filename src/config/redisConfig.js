require('dotenv').config();
const Redis = require('ioredis');

const REDIS_URL = process.env.REDIS_URL;
if (!REDIS_URL) {
  throw new Error('REDIS_URL is not defined in environment variables');
}

const retryStrategy = (times) => Math.min(times * 200, 2000);

const RedisClient = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: false,
  retryStrategy,
});

const RedisBullMQ = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  retryStrategy,
});

RedisClient.on('connect', () => console.log('[REDIS] cache connected'));
RedisClient.on('error', (e) => console.error('[REDIS] cache error:', e.message));

RedisBullMQ.on('connect', () => console.log('[REDIS] BullMQ connected'));
RedisBullMQ.on('error', (e) => console.error('[REDIS] BullMQ error:', e.message));

const shutdown = async () => {
  console.log('[REDIS] closing connections...');
  await Promise.allSettled([RedisClient.quit(), RedisBullMQ.quit()]);
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

module.exports = { RedisClient, RedisBullMQ };