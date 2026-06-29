/**
 * Lightweight in-memory fake of the ioredis client used in tests.
 * Supports the subset of commands used by cacheHelper / services:
 * get, set (with 'EX' ttl), del, keys.
 */
class FakeRedis {
  constructor() {
    this.store = new Map();
  }

  async get(key) {
    return this.store.has(key) ? this.store.get(key) : null;
  }

  async set(key, value, ...args) {
    // supports set(key, value, 'EX', seconds)
    this.store.set(key, value);
    return 'OK';
  }

  async del(...keys) {
    let count = 0;
    for (const key of keys) {
      if (this.store.delete(key)) count++;
    }
    return count;
  }

  async keys(pattern) {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return Array.from(this.store.keys()).filter((k) => regex.test(k));
  }

  // helpers for assertions in tests
  _reset() {
    this.store.clear();
  }
}

module.exports = { FakeRedis };
