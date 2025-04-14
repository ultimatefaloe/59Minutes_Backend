export default {
    port: process.env.PORT || 4000,

    api: {
        routes: `/api`,
    },

    switch: {
        default: true,
        user: true,
        product: true,
        vendor: true,
    },

    mongo: {
        connection_string: `mongodb://localhost:27017/?authMechanism=DEFAULT`
    }
}