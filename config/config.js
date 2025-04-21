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
<<<<<<< HEAD
        encodedusername: process.env.DB_USERNAME,
        encodedpassword: process.env.DB_PASSWORD
=======
        connection_string: process.env.CONNECTION_URI
>>>>>>> 604592b9fc9aa067abdd55e6c5fd8b444e501ada
    }
}
