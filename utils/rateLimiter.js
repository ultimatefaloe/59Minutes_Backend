import rateLimit from 'express-rate-limit'

export const rateLimiter = () => rateLimit({
    windowMS: 15 * 60 * 1000,
    max: 5,
    message: "Too many reset requests, try again later."
});