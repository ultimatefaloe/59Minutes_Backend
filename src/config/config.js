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
        connection_string: process.env.CONNECTION_URI
    }
}