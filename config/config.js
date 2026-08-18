
exports.loginLimit = {
    max: 10, 
    windowMs: 15 * 60 * 1000,
    standardHeaders: true, 
    legacyHeaders: false,
    handler: (req, res, next, options) => {
        res.status(202).json({
          error: 'Hai superato il numero massimo di tentativi. Riprova tra 15 minuti.'
        })
    }
}

// exports.helmet = {
//     directives: {
//         defaultSrc: ["'self'"],

//         scriptSrc: [
//             "'self'",
//             "https://unpkg.com",
//         ],

//         styleSrc: [
//             "'self'",
//             "https://cdnjs.cloudflare.com",
//             "'unsafe-inline'"
//         ],

//         imgSrc: [
//             "'self'",
//             "data:",
//             "blob:",
//             "https://*.tile.openstreetmap.org",
//             "https://tile.openstreetmap.org"
//         ],

//         connectSrc: [
//             "'self'",
//             "https://*.tile.openstreetmap.org",
//             "https://tile.openstreetmap.org"
//         ],

//         fontSrc: [
//             "'self'",
//             "https://cdnjs.cloudflare.com"
//         ],

//         objectSrc: ["'none'"],
//         mediaSrc: ["'self'"],
//         frameSrc: ["'self'"],

//         workerSrc: [
//             "'self'",
//             "blob:"
//         ],

//         scriptSrcAttr: ["'none'"]
//     }
// };

exports.session = {
    secret: "my_super_secret_key",
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        secure: false,
        sameSite: 'strict'
    }
}

/**
    const allowedOrigins = ['http://localhost:8000', 'http://172.28.126.70:8000']
    
    exports.cors = {
        origin: function (origin, callback) {
        if (!origin) return callback(null, true)
            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            } else {
                return callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true,
    }
*/
    