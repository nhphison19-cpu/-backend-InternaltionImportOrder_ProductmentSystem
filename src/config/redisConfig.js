// src/config/redisConfig.js
const Redis = require('ioredis');

let redisConnection = null;

/**
 * Returns a shared ioredis connection for use with BullMQ.
 * BullMQ requires ioredis; it does NOT work with the `redis` (node-redis) client.
 *
 * The connection is a lazy singleton — created once and reused by all queues/workers.
 * BullMQ will clone this connection internally so you should NOT call .quit()
 * on it directly; use the queue/worker .close() methods instead.
 */
const getRedisConnection = () => {
  if (!redisConnection) {
    redisConnection = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: Number(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      db: Number(process.env.REDIS_DB) || 0,

      maxRetriesPerRequest: null,

      retryStrategy: (times) => Math.min(times * 500, 30_000),

      keepAlive: 10_000,

      enableReadyCheck: false,
    });

    redisConnection.on('connect', () =>
      console.log('[Redis] Connected to Redis')
    );
    redisConnection.on('ready', () =>
      console.log('[Redis] Redis connection ready')
    );
    redisConnection.on('error', (err) =>
      console.error('[Redis] Connection error:', err.message)
    );
    redisConnection.on('reconnecting', (delay) =>
      console.warn(`[Redis] Reconnecting in ${delay} ms …`)
    );
    redisConnection.on('close', () =>
      console.warn('[Redis] Connection closed')
    );
  }

  return redisConnection;
};


const closeRedisConnection = async () => {
  if (redisConnection) {
    await redisConnection.quit();
    redisConnection = null;
    console.log('[Redis] Connection closed gracefully');
  }
};

module.exports = { getRedisConnection, closeRedisConnection };
