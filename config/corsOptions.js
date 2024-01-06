/* eslint-disable */
const allowedOrigins = [ 
    process.env.CLIENT_DEV_ORIGIN,
    process.env.CLIENT_PRO_ORIGIN,
    process.env.CLIENT_PRO_ORIGIN_2,
]

const corsOptions = {
    origin: (origin, callback) => {
        if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
            callback(null, true)
        } else {
            callback(new Error('Not allowed by CORS'))
        }
    },
    credentials: true,
    optionsSuccessStatus: 200
}

module.exports = corsOptions 