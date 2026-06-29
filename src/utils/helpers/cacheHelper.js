const {RedisClient} = require('../../config/redisConfig')

const DEFAULT_TTL = 300 // 5 minutes

/**
 * Get a value from cache, or compute + cache it if missing.
 * @param {string} key - cache key
 * @param {Function} fetcher - async function returning the value to cache
 * @param {number} ttl - seconds before the key expires
 */
const getOrSetCache = async (key, fetcher, ttl = DEFAULT_TTL) => {
    const cached = await RedisClient.get(key)
    if (cached) {
        return JSON.parse(cached)
    }

    const fresh = await fetcher()
    if (fresh !== undefined && fresh !== null) {
        await RedisClient.set(key, JSON.stringify(fresh), 'EX', ttl)
    }
    return fresh
}

const setCache = async (key, value, ttl = DEFAULT_TTL) => {
    await RedisClient.set(key, JSON.stringify(value), 'EX', ttl)
}

const deleteCache = async (key) => {
    await RedisClient.del(key)
}


const deleteCacheByPattern = async (pattern) => {
    const keys = await RedisClient.keys(pattern)
    if (keys.length > 0) {
        await RedisClient.del(...keys)
    }
}

const invalidateUserCache = async (userID) =>{
    await RedisClient.del(`auth:user:${userID}`)
}

module.exports = {
    invalidateUserCache,
    getOrSetCache,
    setCache,
    deleteCache,
    deleteCacheByPattern,
}