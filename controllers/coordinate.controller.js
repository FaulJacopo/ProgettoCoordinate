const log = require('../utility/logger')
const coordinateService = require('../services/coordinate.service')

exports.createCoordinate = async (req, res) => {
    try {
        const { text_id, lat, lng, case_id, position } = req.body
        log.Info(`[COORDINATE CONTROLLER] - Requested method to create coordinate - Passing through the Coordinate Service`)

        const coordinates = await coordinateService.createCoordinate(text_id, lat, lng, case_id, position)
        if (coordinates === false || coordinates === undefined) {
            return res.status(500).json({ error: 'Errore durante la creazione della coordinata.' })
        }

        return res.json({ coordinates: JSON.stringify(coordinates) })
    } catch (error) {
        log.Error(`[COORDINATE CONTROLLER] - Error while creating the coordinate: ${error}`)
        return res.status(500).json({ error: 'Errore durante la creazione della coordinata.' })
    }
}

exports.getCoordinates = async (req, res) => {
    try {
        log.Info(`[COORDINATE CONTROLLER] - Requested method to get coordinates - Passing through the Coordinate Service`)

        const coordinates = await coordinateService.getCoordinates()
        if (coordinates === false) {
            return res.status(500).json({ error: 'Errore durante il recupero delle coordinate.' })
        }

        return res.json({ coordinates: JSON.stringify(coordinates) })
    } catch (error) {
        log.Error(`[COORDINATE CONTROLLER] - Error while getting the coordinates: ${error}`)
        return res.status(500).json({ error: 'Errore durante il recupero delle coordinate.' })
    }
}

exports.getCoordinateById = async (req, res) => {
    try {
        const { id } = req.body
        log.Info(`[COORDINATE CONTROLLER] - Requested method to get coordinate by ID - Passing through the Coordinate Service`)

        const coordinate = await coordinateService.getCoordinateById(id)
        if (coordinate === false) {
            return res.status(404).json({ error: 'Coordinata non trovata.' })
        }

        return res.json(coordinate)
    } catch (error) {
        log.Error(`[COORDINATE CONTROLLER] - Error while getting the coordinate: ${error}`)
        return res.status(500).json({ error: 'Errore durante il recupero della coordinata.' })
    }
}

exports.getCoordinateByCaseId = async (req, res) => {
    try {
        const { case_id } = req.body
        log.Info(`[COORDINATE CONTROLLER] - Requested method to get coordinate by case ID - Passing through the Coordinate Service`)

        const coordinates = await coordinateService.getCoordinateByCaseId(case_id)
        if (coordinates === false) {
            return res.status(404).json({ error: 'Coordinate non trovate.' })
        }

        return res.json({ coordinates: JSON.stringify(coordinates) })
    } catch (error) {
        log.Error(`[COORDINATE CONTROLLER] - Error while getting the coordinates: ${error}`)
        return res.status(500).json({ error: 'Errore durante il recupero delle coordinate.' })
    }
}

exports.updateCoordinate = async (req, res) => {
    try {
        const { id, text_id, lat, lng, position } = req.body
        log.Info(`[COORDINATE CONTROLLER] - Requested method to update coordinate - Passing through the Coordinate Service`)

        const coordinate = await coordinateService.updateCoordinate(id, text_id, lat, lng, position)
        if (coordinate === false || coordinate === undefined) {
            return res.status(404).json({ error: 'Coordinata non trovata o non aggiornata.' })
        }

        return res.json(coordinate)
    } catch (error) {
        log.Error(`[COORDINATE CONTROLLER] - Error while updating the coordinate: ${error}`)
        return res.status(500).json({ error: 'Errore durante l\'aggiornamento della coordinata.' })
    }
}

exports.deleteCoordinate = async (req, res) => {
    try {
        const { id } = req.body
        log.Info(`[COORDINATE CONTROLLER] - Requested method to delete coordinate - Passing through the Coordinate Service`)

        const coordinates = await coordinateService.deleteCoordinate(id)
        if (coordinates === false || coordinates === undefined) {
            return res.status(404).json({ error: 'Coordinata non trovata o non eliminata.' })
        }

        return res.json({ coordinates: JSON.stringify(coordinates) })
    } catch (error) {
        log.Error(`[COORDINATE CONTROLLER] - Error while deleting the coordinate: ${error}`)
        return res.status(500).json({ error: 'Errore durante l\'eliminazione della coordinata.' })
    }
}

exports.saveCoordinate = async (req, res) => {
    try {
        const { text_id, lat, lng, position } = req.body
        log.Info(`[COORDINATE CONTROLLER] - Requested method to create coordinate - Passing through the Coordinate Service`)

        const coordinates = await coordinateService.createCoordinate(text_id, lat, lng, req.session.case.id, position)
        if (coordinates === false || coordinates === undefined) {
            return res.status(500).json({ error: 'Errore durante la creazione della coordinata.' })
        }

        return res.json({ coordinates: JSON.stringify(coordinates) })
    } catch (error) {
        log.Error(`[COORDINATE CONTROLLER] - Error while creating the coordinate: ${error}`)
        return res.status(500).json({ error: 'Errore durante la creazione della coordinata.' })
    }
}