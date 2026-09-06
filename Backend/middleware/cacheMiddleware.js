// TODO: MANUAL SETUP REQUIRED — See manual_setup.md in root directory (Section 3: Redis Setup)
// Caching middleware automatically caches GET endpoint responses in Redis with configurable TTLs.
// If Redis is not connected, cache middleware acts as a standard no-op pass-through.

const { getCache, setCache, deleteCachePattern } = require('../config/redis');

/**
 * Express middleware to cache response of GET endpoints in Redis.
 * @param {number} ttlSeconds - Cache TTL in seconds (default: 300 / 5 mins)
 * @param {function} keyGenerator - Optional function (req) => customCacheKey
 */
const cacheMiddleware = (ttlSeconds = 300, keyGenerator = null) => {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const key = keyGenerator
      ? keyGenerator(req)
      : `cache:${req.baseUrl}${req.path}:${JSON.stringify(req.query)}`;

    try {
      const cachedData = await getCache(key);
      if (cachedData) {
        res.setHeader('X-Cache', 'HIT');
        return res.status(200).json(cachedData);
      }

      // Intercept res.json to save response to cache before sending
      const originalJson = res.json.bind(res);
      res.json = (body) => {
        // Only cache successful 200 responses
        if (res.statusCode === 200) {
          setCache(key, body, ttlSeconds).catch(() => {});
        }
        res.setHeader('X-Cache', 'MISS');
        return originalJson(body);
      };

      next();
    } catch (err) {
      // On any cache error, proceed without caching
      next();
    }
  };
};

/**
 * Express middleware to invalidate matching Redis cache keys after a mutation (POST, PUT, DELETE).
 * @param {string|string[]} patterns - Redis key pattern(s) to delete (e.g. 'cache:/api/events*')
 */
const clearCache = (patterns) => {
  return async (req, res, next) => {
    const patternArray = Array.isArray(patterns) ? patterns : [patterns];

    // Intercept res.json to clear cache after successful response
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        patternArray.forEach((pattern) => {
          deleteCachePattern(pattern).catch(() => {});
        });
      }
      return originalJson(body);
    };

    next();
  };
};

module.exports = {
  cacheMiddleware,
  clearCache,
};
