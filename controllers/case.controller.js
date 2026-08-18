const log = require('../utility/logger')
const caseService = require('../services/case.service')

exports.createCase = async (req, res) => {
    try {
        const { title, reference, analyst } = req.body
        log.Info(`[CASE CONTROLLER] - Requested method to create case - Passing through the Case Service`)

        const cases = await caseService.createCase(title, reference, analyst)
        if (cases === false || cases === undefined) {
            return res.status(500).json({ error: 'Errore durante la creazione del caso.' })
        }

        return res.json({ cases: JSON.stringify(cases) })
    } catch (error) {
        log.Error(`[CASE CONTROLLER] - Error while creating the case: ${error}`)
        return res.status(500).json({ error: 'Errore durante la creazione del caso.' })
    }
}

exports.getCases = async (req, res) => {
    try {
        log.Info(`[CASE CONTROLLER] - Requested method to get cases - Passing through the Case Service`)

        const cases = await caseService.getCases()
        if (cases === false) {
            return res.status(500).json({ error: 'Errore durante il recupero dei casi.' })
        }

        return res.json({ cases: JSON.stringify(cases) })
    } catch (error) {
        log.Error(`[CASE CONTROLLER] - Error while getting cases: ${error}`)
        return res.status(500).json({ error: 'Errore durante il recupero dei casi.' })
    }
}

exports.getCaseById = async (req, res) => {
    try {
        const { case_id } = req.body
        log.Info(`[CASE CONTROLLER] - Requested method to get case by ID - Passing through the Case Service`)

        const selectedCase = await caseService.getCaseById(case_id)
        if (selectedCase === false) {
            return res.status(404).json({ error: 'Caso non trovato.' })
        }

        return res.json(selectedCase)
    } catch (error) {
        log.Error(`[CASE CONTROLLER] - Error while getting case by ID: ${error}`)
        return res.status(500).json({ error: 'Errore durante il recupero del caso.' })
    }
}

exports.getCaseByUrl = async (req, res) => {
    try {
        const { url } = req.body
        log.Info(`[CASE CONTROLLER] - Requested method to get case by URL - Passing through the Case Service`)

        const selectedCase = await caseService.getCaseByUrl(url)
        if (selectedCase === false) {
            return res.status(404).json({ error: 'Caso non trovato.' })
        }

        return res.json(selectedCase)
    } catch (error) {
        log.Error(`[CASE CONTROLLER] - Error while getting case by URL: ${error}`)
        return res.status(500).json({ error: 'Errore durante il recupero del caso.' })
    }
}

exports.updateCase = async (req, res) => {
    try {
        const { case_id, title, reference, analyst } = req.body
        log.Info(`[CASE CONTROLLER] - Requested method to update case - Passing through the Case Service`)

        const updatedCase = await caseService.updateCase(case_id, title, reference, analyst)
        if (updatedCase === false || updatedCase === undefined) {
            return res.status(404).json({ error: 'Caso non trovato o non aggiornato.' })
        }

        return res.json({ cases: JSON.stringify(updatedCase) })
    } catch (error) {
        log.Error(`[CASE CONTROLLER] - Error while updating case: ${error}`)
        return res.status(500).json({ error: 'Errore durante l\'aggiornamento del caso.' })
    }
}

exports.deleteCase = async (req, res) => {
    try {
        const { case_id } = req.body
        log.Info(`[CASE CONTROLLER] - Requested method to delete case - Passing through the Case Service`)

        const cases = await caseService.deleteCase(case_id)
        if (cases === false || cases === undefined) {
            return res.status(404).json({ error: 'Caso non trovato o non eliminato.' })
        }

        return res.json({ cases: JSON.stringify(cases) })
    } catch (error) {
        log.Error(`[CASE CONTROLLER] - Error while deleting case: ${error}`)
        return res.status(500).json({ error: 'Errore durante l\'eliminazione del caso.' })
    }
}
