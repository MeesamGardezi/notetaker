/**
 * Rate Limiter Middleware
 * Limits request rates to prevent abuse
 */

const rateLimit = require('express-rate-limit');
const { AppError } = require('./errorHandler');

// Create a store with IP as the key
class MemoryStore {
  constructor() {
    this.store = new Map();
    this.interval = setInterval(() => this.resetExpiredKeys(), 60000); // Clean up every minute
  }

  resetExpiredKeys() {
    const now = Date.now();
    for (const [key, data] of this.store.entries()) {
      if (data.resetTime <= now) {
        this.store.delete(key);
      }
    }
  }

  // Increment the counter for a key
  increment(key, windowMs) {
    const now = Date.now();
    if (!this.store.has(key)) {
      this.store.set(key, {
        count: 1,
        resetTime: now + windowMs
      });
      return 1;
    }

    const data = this.store.get(key);
    // Reset if we're past the window
    if (data.resetTime <= now) {
      this.store.set(key, {
        count: 1,
        resetTime: now + windowMs
      });
      return 1;
    }

    // Increment within the window
    data.count += 1;
    return data.count;
  }

  // Get the current count for a key
  get(key) {
    if (!this.store.has(key)) {
      return 0;
    }
    const data = this.store.get(key);
    const now = Date.now();
    return data.resetTime > now ? data.count : 0;
  }

  // Delete a key
  delete(key) {
    return this.store.delete(key);
  }

  // Clear all keys
  clear() {
    this.store.clear();
  }

  // Clean up resources when no longer needed
  shutdown() {
    clearInterval(this.interval);
  }
}

// Generic rate limiter factory
const createRateLimiter = (options) => {
  const store = new MemoryStore();
  
  return rateLimit({
    windowMs: options.windowMs || 60 * 1000, // Default: 1 minute
    max: options.max || 100, // Default: 100 requests per windowMs
    message: options.message || { error: 'Too many requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => options.keyGenerator ? options.keyGenerator(req) : req.ip,
    handler: (req, res, next, options) => {
      next(new AppError(options.message.error, 429));
    },
    store: {
      increment: (key) => Promise.resolve(store.increment(key, options.windowMs || 60 * 1000)),
      decrement: (key) => Promise.resolve(store.get(key) > 0 ? store.increment(key, -1) : 0),
      resetKey: (key) => Promise.resolve(store.delete(key)),
      resetAll: () => Promise.resolve(store.clear())
    }
  });
};

// Specific rate limiters for different routes
exports.loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per IP per 15 minutes
  message: { error: 'Too many login attempts, please try again later' },
  keyGenerator: (req) => `${req.ip}-login`
});

exports.registerLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 registration attempts per IP per hour
  message: { error: 'Too many registration attempts, please try again later' },
  keyGenerator: (req) => `${req.ip}-register`
});

exports.apiLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute per IP
  message: { error: 'Rate limit exceeded, please slow down your requests' }
});

// Limiter for sensitive operations
exports.sensitiveOpLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 operations per hour
  message: { error: 'Too many sensitive operations, please try again later' }
});