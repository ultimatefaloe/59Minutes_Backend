import express from 'express';
import config from '../lib/config.js';
import { defaultRoutes } from './defaultRoutes.js';
import { userRoutes } from './UserRoutes/userRoute.js';

export default () => {
    const router = express.Router();

    if (config.switch.user){
        userRoutes(router)
    }

    if (config.switch.default){
        defaultRoutes(router);
    };

    return router;
}