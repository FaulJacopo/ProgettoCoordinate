const fs = require('fs')
const zlib = require('zlib')
const utility = require('../utility/utility')
const log = require('../utility/logger')
const coordinateService = require('../services/coordinate.service')

let temp_file_content = ``
let temp_files_content = {}
const cell_id_export_batches = new Map()

const crc32_table = Array.from({ length: 256 }, (_, table_index) => {
    let checksum = table_index
    for (let bit = 0; bit < 8; bit++) {
        checksum = (checksum & 1) ? (0xedb88320 ^ (checksum >>> 1)) : (checksum >>> 1)
    }
    return checksum >>> 0
})

exports.createCoordinate = async (req, res) => {
    try {
        const { text_id, lat, lng, case_id, cell_id, power, MCC, MNC, color } = req.body
        const marker_shape = req.body.marker_shape === 'triangle' ? 'triangle' : 'circle'
        log.Info(`[COORDINATE CONTROLLER] - Requested method to create coordinate - Passing through the Coordinate Service`)

        const coordinates = await coordinateService.createCoordinate(text_id, lat, lng, case_id, cell_id, power, MCC, MNC, color, marker_shape)
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

exports.deleteCoordinatesByCaseId = async (req, res) => {
    try {
        log.Info(`[COORDINATE CONTROLLER] - Requested method to delete coordinate - Passing through the Coordinate Service`)

        const coordinates = await coordinateService.deleteCoordinatesByCaseId(req.session.case.id)
        if (coordinates === false || coordinates === undefined) {
            return res.status(404).json({ error: 'Coordinata non trovata o non eliminata.' })
        }

        return res.json({ coordinates: JSON.stringify(coordinates) })
    } catch (error) {
        log.Error(`[COORDINATE CONTROLLER] - Error while deleting the coordinate: ${error}`)
        return res.status(500).json({ error: 'Errore durante l\'eliminazione della coordinata.' })
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

exports.updateColorByCellId = async (req, res) => {
    try {
        const cell_id = Number(req.body.cell_id)
        const color = String(req.body.color || '').toLowerCase()
        const case_id = req.session.case?.id

        if (!Number.isInteger(cell_id) || !/^#[0-9a-f]{6}$/.test(color)) {
            return res.status(400).json({ error: 'Cell ID o colore non valido.' })
        }

        if (!case_id) {
            return res.status(400).json({ error: 'Nessun caso selezionato.' })
        }

        log.Info(`[COORDINATE CONTROLLER] - Requested color update by cell ID - Passing through the Coordinate Service`)
        const updated_coordinates = await coordinateService.updateColorByCellId(case_id, cell_id, color)

        if (updated_coordinates === false) {
            return res.status(500).json({ error: 'Errore durante il salvataggio del colore.' })
        }

        return res.json({ updated_coordinates, color })
    } catch (error) {
        log.Error(`[COORDINATE CONTROLLER] - Error while updating color by cell ID: ${error}`)
        return res.status(500).json({ error: 'Errore durante il salvataggio del colore.' })
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

            const color = /^#[0-9a-f]{6}$/i.test(coord.color || '')
                ? coord.color.toLowerCase()
                : null
            const marker_shape = coord.marker_shape === 'triangle' ? 'triangle' : 'circle'

            created_coordinates.push({ latitude: coord.latitude, longitude: coord.longitude, text_identifier: coord.text_identifier || "unknown", cell_id, case_id: req.session.case.id, power: coord.power || null, MCC: coord.MCC || null, MNC: coord.MNC || null, color, marker_shape })
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
            let scale = (coordinate.power < -120) ? 1 : (coordinate.power < -105) ? 1.5 : 2;
            const color = /^#[0-9a-f]{6}$/i.test(coordinate.color || '') ? coordinate.color : '#ff0000'
            const marker_shape = coordinate.marker_shape === 'triangle' ? 'triangle' : 'circle'
            temp_file_content += `
<Placemark>
    <Style>
        <IconStyle>
            <scale>${scale}</scale>
            <Icon>
                <href>${utility.createMarkerIcon(color, marker_shape)}</href>
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

            let content = temp_file_content
            temp_file_content = utility.resetFileContent()
    
            return res.status(200).send(content);
        }
    } catch (error) {
        log.Error(`[COORDINATE CONTROLLER] - Error while exporting file KML: ${error}`)
        return res.status(500).json({ error: `Errore durante l'esportazione del file KML.` })
    }
}

exports.exportFileKMLByCellId = async (req, res) => {
    const export_key = `${req.sessionID || 'anonymous'}:${req.session.case?.id || 'no-case'}`

    try {
        const { coordinates_to_export, status } = req.body
        const is_last_batch = JSON.parse(status) === true || JSON.parse(status) === 'true'
        const coordinate_list = Array.isArray(coordinates_to_export)
            ? coordinates_to_export
            : JSON.parse(coordinates_to_export)

        if (!Array.isArray(coordinate_list) || coordinate_list.length === 0) {
            return res.status(400).json({ error: 'Nessuna coordinata da esportare.' })
        }

        if (!req.session.case) {
            return res.status(400).json({ error: 'Nessun caso selezionato.' })
        }

        const now = Date.now()
        for (const [key, batch] of cell_id_export_batches) {
            if (now - batch.updated_at > 30 * 60 * 1000) {
                cell_id_export_batches.delete(key)
            }
        }

        const export_batch = cell_id_export_batches.get(export_key) || { coordinates: [] }
        export_batch.coordinates.push(...coordinate_list)
        export_batch.updated_at = now
        cell_id_export_batches.set(export_key, export_batch)

        if (!is_last_batch) {
            return res.status(200).json({ message: 'Batch aggiunto all\'esportazione.' })
        }

        const coordinates_by_cell_id = new Map()
        export_batch.coordinates.forEach(coordinate => {
            const cell_id = String(coordinate.cell_id ?? 'senza-cell-id')
            if (!coordinates_by_cell_id.has(cell_id)) {
                coordinates_by_cell_id.set(cell_id, [])
            }
            coordinates_by_cell_id.get(cell_id).push(coordinate)
        })

        const files = [...coordinates_by_cell_id.entries()].map(([cell_id, cell_coordinates]) => ({
            name: `cell-${utility.sanitizeFileName(cell_id, 'senza-id')}.kml`,
            content: utility.buildCellKML(cell_id, cell_coordinates),
        }))
        const archive = utility.createZipArchive(files)
        const case_title = utility.sanitizeFileName(req.session.case.title, 'coordinate')
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
        const filename = `${case_title}-per-cell-id-${timestamp}.zip`

        cell_id_export_batches.delete(export_key)
        res.setHeader('Content-Type', 'application/zip')
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
        res.setHeader('Content-Length', archive.length)
        return res.status(200).send(archive)
        
    } catch (error) {
        cell_id_export_batches.delete(export_key)
        log.Error(`[COORDINATE CONTROLLER] - Error while exporting KML files by cell ID: ${error}`)
        return res.status(500).json({ error: `Errore durante l'esportazione dei file KML.` })
    }
}
