const express = require('express')
const log = require('../utility/logger')
const utility = require('../utility/utility')
const validator = require('../utility/validator')
const mw = require('../middlewares/check')
const rateLimit = require('express-rate-limit')
const config = require('../config/config')
const router = express.Router()

const caseController = require('../controllers/case.controller')

router.post('/get-cases',  caseController.getCases)
router.post('/get-case-by-id',  caseController.getCaseById)
router.post('/get-case-by-url',  caseController.getCaseByUrl)
router.post('/get-case-by-case-id',  caseController.getCaseByCaseId)
router.post('/create-case',  caseController.createCase)
router.post('/update-case',  caseController.updateCase)
router.post('/delete-case',  caseController.deleteCase)

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