import express from 'express';
import cors from 'cors'
import routes from "../../Routes/routes.js";
import config from "../../config/config.js";

export const setupRoutes = (app) => {

    const router = routes();

    app.use(cors())

    app.use(express.json());
    app.use(express.urlencoded({extended: true}));

    app.use(config.api.routes, router);

}