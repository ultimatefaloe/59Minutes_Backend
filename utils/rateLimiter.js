import rateLimit from 'express-rate-limit';

// Create the limiter ONCE at module load
export const rateLimiter = rateLimit({
    windowMS: 15 * 60 * 1000,
    max: 5,
    message: "Too many reset requests, try again later."
});