import express from 'express';
import config from '../config/config.js';
import { defaultRoutes } from './default.routes.js';
import { userRoutes } from './user.routes.js';
import { productRoute } from './product.routes.js';
import { vendorRoute } from './vendor.routes.js';
import { categoryRoute } from './category.routes.js';

export default () => {
    const router = express.Router();

    if (config.switch.cat){
        categoryRoute(router)
    };

    if (config.switch.user){
        userRoutes(router)
    };

    if(config.switch.product){
        productRoute(router)
    };

    if(config.switch.vendor){
        vendorRoute(router)
    };

    if (config.switch.default){
        defaultRoutes(router);
    };

    return router;
}