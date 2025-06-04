import express from 'express';
import config from '../config/config.js';
import { defaultRoutes } from './default.routes.js';
import { userRoutes } from './user.routes.js';
import { productRoutes } from './product.routes.js';
import { vendorRoutes } from './vendor.routes.js';
import { categoryRoutes } from './category.routes.js';

export default () => {
    const router = express.Router();

    if (config.switch.cat){
        categoryRoutes(router)
    };

    if (config.switch.user){
        userRoutes(router)
    };

    if(config.switch.product){
        productRoutes(router)
    };

    if(config.switch.vendor){
        vendorRoutes(router)
    };

    if (config.switch.default){
        defaultRoutes(router);
    };

    return router;
}