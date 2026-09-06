// TODO: MANUAL SETUP REQUIRED — See Backend/manual_setup.md (Section 3: Redis Setup)
// Add REDIS_URL to your .env file
// Without Redis, caching is disabled gracefully — server works normally

const Redis = require('ioredis');
const config = require('./config');

let redisClient = null;
let isRedisConnected = false;

const connectRedis = () => {
  try {
    redisClient = new Redis(config.redisUrl, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      retryStrategy: (times) => {
        // Retry up to 3 times with exponential backoff
        if (times > 3) {
          console.warn('[REDIS] Max retries reached. Running without Redis cache.');
          return null; // Stop retrying
        }
        return Math.min(times * 200, 2000); // Wait 200ms, 400ms, 800ms...
      },
    });

    redisClient.on('connect', () => {
      isRedisConnected = true;
      console.log('[REDIS] Connected successfully');
    });

    redisClient.on('error', (err) => {
      isRedisConnected = false;
      console.warn(`[REDIS] Connection error: ${err.message}. Caching disabled.`);
    });

    redisClient.on('close', () => {
      isRedisConnected = false;
    });

    redisClient.connect().catch(() => {
      console.warn('[REDIS] Could not connect. Running without cache.');
    });
  } catch (err) {
    console.warn(`[REDIS] Failed to initialize: ${err.message}. Running without cache.`);
  }
};

// Get the Redis client (returns null if not connected)
const getRedis = () => (isRedisConnected ? redisClient : null);

// ─── REDIS HELPER METHODS ─────────────────────────────────────────

// Set a value with optional TTL (in seconds)
const setCache = async (key, value, ttlSeconds = 300) => {
  const client = getRedis();
  if (!client) return;
  try {
    await client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch (err) {
    console.warn(`[REDIS] setCache error: ${err.message}`);
  }
};

// Get a cached value (returns null if not found or Redis offline)
const getCache = async (key) => {
  const client = getRedis();
  if (!client) return null;
  try {
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.warn(`[REDIS] getCache error: ${err.message}`);
    return null;
  }
};

// Delete a specific cache key
const deleteCache = async (key) => {
  const client = getRedis();
  if (!client) return;
  try {
    await client.del(key);
  } catch (err) {
    console.warn(`[REDIS] deleteCache error: ${err.message}`);
  }
};

// Delete all cache keys matching a pattern (e.g. 'alumni:*')
const deleteCachePattern = async (pattern) => {
  const client = getRedis();
  if (!client) return;
  try {
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(...keys);
    }
  } catch (err) {
    console.warn(`[REDIS] deleteCachePattern error: ${err.message}`);
  }
};

module.exports = {
  connectRedis,
  getRedis,
  setCache,
  getCache,
  deleteCache,
  deleteCachePattern,
};
