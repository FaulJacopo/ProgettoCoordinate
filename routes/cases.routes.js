const express = require('express')
const log = require('../utility/logger')
const utility = require('../utility/utility')
const validator = require('../utility/validator')
const mw = require('../middlewares/check')
const rateLimit = require('express-rate-limit')
const config = require('../config/config')
const router = express.Router()

const caseController = require('../controllers/case.controller')
const caseService = require('../services/case.service')

router.post('/get-cases',  caseController.getCases)
router.post('/get-case-by-id',  caseController.getCaseById)
router.post('/get-case-by-url',  caseController.getCaseByUrl)
router.post('/create-case',  caseController.createCase)
router.post('/update-case',  caseController.updateCase)
router.post('/delete-case',  caseController.deleteCase)

router.get('/:url', async (req, res) => {
    try {
        log.Info(`[CASE ROUTER] - Requested route "/:url"`)

        let sel_case = await caseService.getCaseByUrl(req.params.url)
        
        if (!sel_case) {
            log.Error(`[CASE ROUTER] - Case not found for URL: ${req.params.url}`)
            return res.status(404).json({ error: 'Caso non trovato.', redirect: '/'})
        }

        req.session.case = sel_case

        return res.render('case', { case: sel_case })

    } catch (error) {
        log.Error(`[CASE ROUTER] - Error while getting case by URL: ${error}`)
        return res.status(500).json({ error: 'Errore durante il recupero del caso.', redirect: '/'})
    }
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
