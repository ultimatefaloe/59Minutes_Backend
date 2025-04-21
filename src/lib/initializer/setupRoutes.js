import express from 'express';
import routes from "../../Routes/routes.js";
import config from "../../config/config.js";
import Middleware from "../../Middleware/auth-require.js"
import cors from 'cors'

export const setupRoutes = (app) => {

    const router = routes();

    app.use(cors())

    app.use(express.json());
    app.use(express.urlencoded({extended: true}));

    app.use(config.api.routes, Middleware.decodeToken());
    
    app.use(config.api.routes, router);

}