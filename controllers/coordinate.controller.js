const fs = require('fs')
const utility = require('../utility/utility')
const log = require('../utility/logger')
const coordinateService = require('../services/coordinate.service')

let temp_file_content = ``

exports.createCoordinate = async (req, res) => {
    try {
        const { text_id, lat, lng, case_id, cell_id, power, MCC, MNC } = req.body
        log.Info(`[COORDINATE CONTROLLER] - Requested method to create coordinate - Passing through the Coordinate Service`)

        const coordinates = await coordinateService.createCoordinate(text_id, lat, lng, case_id, cell_id, power, MCC, MNC)
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

exports.getCoordinatesBySelectedCase = async (req, res) => {
    try {
        log.Info(`[COORDINATE CONTROLLER] - Requested method to get coordinate by selected case - Passing through the Coordinate Service`)

        const coordinates = await coordinateService.getCoordinateByCaseId(req.session.case.id)
        if (coordinates === false) {
            return res.status(404).json({ error: 'Coordinate non trovate.' })
        }

        return res.json({ coordinates: JSON.stringify(coordinates) })
    } catch (error) {
        log.Error(`[COORDINATE CONTROLLER] - Error while getting the coordinates: ${error}`)
        return res.status(500).json({ error: 'Errore durante il recupero delle coordinate.' })
    }
}

exports.getUniqueCellIdsByCaseId = async (req, res) => {
    try {
        log.Info(`[COORDINATE CONTROLLER] - Requested method to get unique cell IDs by case ID - Passing through the Coordinate Service`)

        const cell_ids = await coordinateService.getUniqueCellIdsByCaseId(req.session.case.id)
        if (cell_ids === false) {
            return res.status(404).json({ error: 'Cell ID non trovati.' })
        }

        return res.json({ cell_ids: JSON.stringify(cell_ids) })
    } catch (error) {
        log.Error(`[COORDINATE CONTROLLER] - Error while getting the unique cell IDs: ${error}`)
        return res.status(500).json({ error: 'Errore durante il recupero dei Cell ID unici.' })
    }
}

exports.updateCoordinate = async (req, res) => {
    try {
        const { id, text_id, lat, lng, power } = req.body
        log.Info(`[COORDINATE CONTROLLER] - Requested method to update coordinate - Passing through the Coordinate Service`)

        const coordinate = await coordinateService.updateCoordinate(id, text_id, lat, lng, power)
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
        const { coordinates } = req.body
        log.Info(`[COORDINATE CONTROLLER] - Requested method to create coordinate - Passing through the Coordinate Service`)

        const coordinate_list = JSON.parse(coordinates)
        const created_coordinates = []

        if (!Array.isArray(coordinate_list) || coordinate_list.length === 0) {
            return res.status(400).json({ error: 'Nessuna coordinata da salvare.' })
        }

        for (const coord of coordinate_list.filter(coord => coord.id === -1)) {
            const cell_id = Number(coord.cell_id)
            if (!Number.isInteger(cell_id)) {
                return res.status(400).json({ error: 'Il Cell ID deve essere un numero intero.' })
            }

            created_coordinates.push({ latitude: coord.latitude, longitude: coord.longitude, text_identifier: coord.text_identifier || "unknown", cell_id, case_id: req.session.case.id, power: coord.power || null, MCC: coord.MCC || null, MNC: coord.MNC || null })
        }

        if (created_coordinates.length === 0) {
            return res.json({ coordinates: JSON.stringify([]) })
        }

        const result = await coordinateService.createMultipleCoordinates(created_coordinates)

        if (result === false || result === undefined) {
            return res.status(500).json({ error: 'Errore durante la creazione delle coordinate.' })
        }

        const saved_coordinates = result.map(coordinate => coordinate.get({ plain: true }))
        return res.json({ coordinates: JSON.stringify(saved_coordinates) })

    } catch (error) {
        log.Error(`[COORDINATE CONTROLLER] - Error while creating the coordinate: ${error}`)
        return res.status(500).json({ error: 'Errore durante la creazione della coordinata.' })
    }
}

exports.exportFileKML = async (req, res) => {
    try {
        const { coordinates_to_export, status } = req.body

        const current_status = JSON.parse(status)
        const coordinate_list = Array.isArray(coordinates_to_export)
            ? coordinates_to_export
            : JSON.parse(coordinates_to_export)

        if (temp_file_content.length == 0)
            temp_file_content = utility.resetFileContent()

        if (coordinate_list.length === 0) {
            return res.status(400).json({ error: 'Nessuna coordinata da esportare.' })
        }

        coordinate_list.forEach(coordinate => {
            temp_file_content += `
<Placemark>
    <Style>
        <IconStyle>
            <color>${utility.changeToKMLColor(coordinate.color)}</color>
            <scale>1.8</scale>
            <Icon>
                <href>http://maps.google.com/mapfiles/kml/shapes/placemark_circle.png</href>
            </Icon>
        </IconStyle>
    </Style>
    <name></name>
    <description>CellID: ${coordinate.cell_id} / MCC: ${coordinate.MCC} / MNC: ${coordinate.MNC} / Power: ${coordinate.power}</description>
    <TimeStamp><when>2026-08-11T17:24:00Z</when></TimeStamp>
    <Point><coordinates>${coordinate.longitude},${coordinate.latitude}</coordinates></Point>
</Placemark>`
        });

        if (status == false) {
            return res.status(200).json({ message: `File Aggiornato` })
        }

        if (status == true) {
            temp_file_content += `</Folder></Document></kml>`
    
            const filename = `${req.session.case.title.replace(' ', '-')}${new Date().toISOString().replace(/[:.]/g, '-')}.kml`;
    
            res.setHeader('Content-Type', 'application/vnd.google-earth.kml+xml; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"` );
    
            // fs.appendFile(`/exported-data/${new Date().toISOString()}.kml`, content, err => {
            //     if (err) {
            //         log.Error(`[COORDINATE CONTROLLER] - Error Creating file`)
            //     } else {
            //         // done!
            //         return res.status(200).send()
            //     }
            // });
            let content = temp_file_content
            temp_file_content = utility.resetFileContent()
    
            return res.status(200).send(content);
        }


    } catch (error) {
        log.Error(`[COORDINATE CONTROLLER] - Error while exporting file KML: ${error}`)
        return res.status(500).json({ error: `Errore durante l'esportazione del file KML.` })
    }
}
