import express from 'express';
import cors from 'cors';
import multer from 'multer';
import routes from "../../Routes/routes.js";
import config from "../../config/config.js";

export const setupRoutes = (app) => {
  const router = routes();

  // CORS must be at the top before any routes
  app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
  }));

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use(express.static('public'));
  app.use('/static', express.static('public'));
  app.use('/uploads', express.static('uploads'));
  app.use('/images', express.static('images'));
  app.use('/files', express.static('files'));

  app.use(config.api.routes, router);
};
