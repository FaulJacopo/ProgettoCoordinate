const express = require('express')
const log = require('../utility/logger')
const utility = require('../utility/utility')
const validator = require('../utility/validator')
const mw = require('../middlewares/check')
const rateLimit = require('express-rate-limit')
const config = require('../config/config')
const router = express.Router()

const loginLimiter = rateLimit(config.loginLimit)

router.get('/coordinates', async (req, res) => {
    try {
        log.Info(`[AUTH ROUTER] - Requested route "/"`)
        return res.render('case')
    } catch {
        log.Fatal(`[AUTH ROUTER] - Somehing went wrong getting dashboard`)
    }
    return res.status(200).json({ error: 'La Dashboard non è disponibile!'})
}) 

router.get('/', async (req, res) => {
    try {
        log.Info(`[AUTH ROUTER] - Requested route "/"`)
        return res.render('index')
    } catch {
        log.Fatal(`[AUTH ROUTER] - Somehing went wrong getting dashboard`)
    }
    return res.status(200).json({ error: 'La Dashboard non è disponibile!'})
}) 

module.exports = router