import rateLimit from 'express-rate-limit';

// Simple rate limits for brute-force login protection.
// One limiter for many attacks in a short period of time and another limiter for a slower attack.

const loginRateLimiterHigh = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // Limit each IP to 5 login requests per 5 minutes
  message: 'Too many login attempts from this IP, please try again after 5 minutes.',
});

const loginRateLimiterSlow = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 15, // Limit each IP to 15 login requests per 1 hour
  message: 'Too many login attempts from this IP, please try again after an hour.',
});

export { loginRateLimiterHigh, loginRateLimiterSlow };
