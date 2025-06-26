import express from 'express';
import userService from './userService.js';
import Middleware from '../Middleware/middleware.js';

export const userRoutes = (router) => {
    const userRouter = express();

    router.use('/users', userRouter);

   
}
