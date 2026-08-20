require('dotenv').config();
const express = require('express')
const path = require('path')
const hbs = require('hbs')
const log = require('./utility/logger')
const session = require('express-session')
const cookieParser = require('cookie-parser')
const utility = require('./utility/utility')
const helmet = require('helmet')
const cors = require('cors')
const rateLimit = require('express-rate-limit')
const { initializeDatabase } = require('./config/database')
const config = require('./config/config')

const routerCoordinate = require('./routes/coordinate.routes')
const routerCases = require('./routes/cases.routes')
const routerAuth = require('./routes/auth.routes')

//const csrfProtection = csrfDSC()
const app = express()

app.use(express.static('public'))
app.use('/vendor/leaflet-area-selection', express.static(path.join(__dirname, 'node_modules/@bopen/leaflet-area-selection/dist')))
app.use(cookieParser())

//app.use(csrfProtection)
// app.use(cors(config.cors))
// app.use(helmet())
// app.use(helmet.contentSecurityPolicy(config.helmet))

app.set('view engine', 'hbs')
hbs.registerPartials(__dirname + '/views/partials')
hbs.registerHelper({
    eq: (a, b) => a == b,
    eqS: (a, b) => a.trim() == b.trim(),
    neq: (a, b) => a !== b,
    addOne: (a) => a + 1,
    subOne: (a) => a - 1,
    or: (a, b) => a || b,
    and: (a, b) => a && b,
    not: (a) => !a,
    length: (a) => a.length,
    getType: (a) => utility.typeNames[a],
    formatDate: (a) => (new Date(a)).toLocaleDateString(),
    formatTime: (a) => (new Date(a)).toLocaleTimeString(),
    firstLetter: (a, b) => a[0] + b[0],
})

app.use(session(config.session))
app.use(express.json())
app.use(express.urlencoded({ limit: 500*1024*1024, extended: true }))

app.use(function (req, res, next) {
    // res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    //res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
    res.setHeader("Origin-Agent-Cluster", "?1");
    next()
})

app.use(function (err, req, res, next) {
    log.Error(`An error occured => ${err}`)
})

app.use('/coordinates', routerCoordinate)
app.use('/cases', routerCases)
app.use('/', routerAuth)

app.use((req, res) => {
    res.status(404).render('utility/notfound')
})

app.listen(process.env.PORT, async () => {
    await initializeDatabase()
    log.Info(`Server Running at ${process.env.PORT}`)
})
