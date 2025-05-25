import { config } from 'dotenv';

// Load environment variables from .env file
config();

export default {
    port: process.env.PORT || 4000,

    api: {
        routes: `/api`,
    },

    switch: {
        default: true,
        cat: true,
        user: true,
        product: true,
        vendor: true,
    },

    mongo: {
        DB_USERNAME: process.env.DB_USERNAME,
        DB_PASSWORD: process.env.DB_PASSWORD
    },

    mail: {
        SMTP_HOST: process.env.SMTP_HOST ,
        SMTP_PORT: process.env.SMTP_PORT ,
        FROM_EMAIL: process.env.FROM_EMAIL ,
        SMTP_USER: process.env.SMTP_USER,
        SMTP_PASS: process.env.SMTP_PASS ,
        SMTP_SECURE: process.env.SMTP_SECURE ,
    },

    jwt: {
        JWT_PRIVATE_KEY: process.env.JWT_PRIVATE_KEY
    },

    env: {
        NODE_ENV: process.env.NODE_ENV
    }
};
