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

function calculateCRC32(content) {
    let checksum = 0xffffffff
    for (const byte of content) {
        checksum = crc32_table[(checksum ^ byte) & 0xff] ^ (checksum >>> 8)
    }
    return (checksum ^ 0xffffffff) >>> 0
}

function getZipDateTime(date = new Date()) {
    const year = Math.max(date.getFullYear(), 1980)
    return {
        time: (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2),
        date: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate(),
    }
}

function createZipArchive(files) {
    const local_parts = []
    const central_parts = []
    const zip_date_time = getZipDateTime()
    let local_offset = 0

    files.forEach(file => {
        const file_name = Buffer.from(file.name, 'utf8')
        const content = Buffer.from(file.content, 'utf8')
        const compressed_content = zlib.deflateRawSync(content)
        const checksum = calculateCRC32(content)
        const local_header = Buffer.alloc(30)

        local_header.writeUInt32LE(0x04034b50, 0)
        local_header.writeUInt16LE(20, 4)
        local_header.writeUInt16LE(0x0800, 6)
        local_header.writeUInt16LE(8, 8)
        local_header.writeUInt16LE(zip_date_time.time, 10)
        local_header.writeUInt16LE(zip_date_time.date, 12)
        local_header.writeUInt32LE(checksum, 14)
        local_header.writeUInt32LE(compressed_content.length, 18)
        local_header.writeUInt32LE(content.length, 22)
        local_header.writeUInt16LE(file_name.length, 26)
        local_header.writeUInt16LE(0, 28)

        const central_header = Buffer.alloc(46)
        central_header.writeUInt32LE(0x02014b50, 0)
        central_header.writeUInt16LE(20, 4)
        central_header.writeUInt16LE(20, 6)
        central_header.writeUInt16LE(0x0800, 8)
        central_header.writeUInt16LE(8, 10)
        central_header.writeUInt16LE(zip_date_time.time, 12)
        central_header.writeUInt16LE(zip_date_time.date, 14)
        central_header.writeUInt32LE(checksum, 16)
        central_header.writeUInt32LE(compressed_content.length, 20)
        central_header.writeUInt32LE(content.length, 24)
        central_header.writeUInt16LE(file_name.length, 28)
        central_header.writeUInt16LE(0, 30)
        central_header.writeUInt16LE(0, 32)
        central_header.writeUInt16LE(0, 34)
        central_header.writeUInt16LE(0, 36)
        central_header.writeUInt32LE(0, 38)
        central_header.writeUInt32LE(local_offset, 42)

        local_parts.push(local_header, file_name, compressed_content)
        central_parts.push(central_header, file_name)
        local_offset += local_header.length + file_name.length + compressed_content.length
    })

    const central_directory = Buffer.concat(central_parts)
    const end_record = Buffer.alloc(22)
    end_record.writeUInt32LE(0x06054b50, 0)
    end_record.writeUInt16LE(0, 4)
    end_record.writeUInt16LE(0, 6)
    end_record.writeUInt16LE(files.length, 8)
    end_record.writeUInt16LE(files.length, 10)
    end_record.writeUInt32LE(central_directory.length, 12)
    end_record.writeUInt32LE(local_offset, 16)
    end_record.writeUInt16LE(0, 20)

    return Buffer.concat([...local_parts, central_directory, end_record])
}

function escapeXml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&apos;')
}

function sanitizeFileName(value, fallback) {
    const sanitized_value = String(value ?? '')
        .trim()
        .replace(/[^a-z0-9._-]+/gi, '-')
        .replace(/^-+|-+$/g, '')
    return sanitized_value || fallback
}

function buildCellKML(cell_id, coordinates) {
    let content = utility.resetFileContent()

    coordinates.forEach(coordinate => {
        const scale = coordinate.power < -120 ? 1 : coordinate.power < -105 ? 1.5 : 2
        const color = /^#[0-9a-f]{6}$/i.test(coordinate.color || '') ? coordinate.color : '#ff0000'
        content += `
<Placemark>
    <Style>
        <IconStyle>
            <color>${utility.changeToKMLColor(color)}</color>
            <scale>${scale}</scale>
            <Icon>
                <href>http://maps.google.com/mapfiles/kml/shapes/placemark_circle.png</href>
            </Icon>
        </IconStyle>
    </Style>
    <name>${escapeXml(cell_id)}</name>
    <description>CellID: ${escapeXml(coordinate.cell_id)} / MCC: ${escapeXml(coordinate.MCC)} / MNC: ${escapeXml(coordinate.MNC)} / Power: ${escapeXml(coordinate.power)}</description>
    <TimeStamp><when>2026-08-11T17:24:00Z</when></TimeStamp>
    <Point><coordinates>${escapeXml(coordinate.longitude)},${escapeXml(coordinate.latitude)}</coordinates></Point>
</Placemark>`
    })

    return `${content}</Folder></Document></kml>`
}

exports.createCoordinate = async (req, res) => {
    try {
        const { text_id, lat, lng, case_id, cell_id, power, MCC, MNC, color } = req.body
        log.Info(`[COORDINATE CONTROLLER] - Requested method to create coordinate - Passing through the Coordinate Service`)

        const coordinates = await coordinateService.createCoordinate(text_id, lat, lng, case_id, cell_id, power, MCC, MNC, color)
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

            created_coordinates.push({ latitude: coord.latitude, longitude: coord.longitude, text_identifier: coord.text_identifier || "unknown", cell_id, case_id: req.session.case.id, power: coord.power || null, MCC: coord.MCC || null, MNC: coord.MNC || null, color })
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
            temp_file_content += `
<Placemark>
    <Style>
        <IconStyle>
            <color>${utility.changeToKMLColor(coordinate.color)}</color>
            <scale>${scale}</scale>
            <Icon>
                // <href>https://map.geo.admin.ch/api/icons/sets/default/icons/001-marker@1x-255,0,0.png</href>
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

            let content = temp_file_content
            temp_file_content = utility.resetFileContent()
    
            return res.status(200).send(content);
        }


    } catch (error) {
        log.Error(`[COORDINATE CONTROLLER] - Error while exporting file KML: ${error}`)
        return res.status(500).json({ error: `Errore durante l'esportazione del file KML.` })
    }
}


exports.exportFileKMLByCellIdLegacy = async (req, res) => {
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
            if ((temp_files_content.coordinate.cell_id).length == 0) temp_files_content.coordinate.cell_id = utility.resetFileContent()
            temp_files_content.coordinate.cell_id += `
<Placemark>
    <Style>
        <IconStyle>
            <color>${utility.changeToKMLColor(coordinate.color)}</color>
            <scale>${scale}</scale>
            <Icon>
                // <href>https://map.geo.admin.ch/api/icons/sets/default/icons/001-marker@1x-255,0,0.png</href>
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
            temp_files_content.forEach(temp_files => {
                temp_files += `</Folder></Document></kml>`

                const filename = `${req.session.case.title.replace(' ', '-')}${new Date().toISOString().replace(/[:.]/g, '-')}.kml`;

                res.setHeader('Content-Type', 'application/vnd.google-earth.kml+xml; charset=utf-8');
                res.setHeader('Content-Disposition', `attachment; filename="${filename}"` );

                let content = temp_file_content
                temp_file_content = utility.resetFileContent()

                return res.status(200).send(content);
            })
        }
        return false

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
            name: `cell-${sanitizeFileName(cell_id, 'senza-id')}.kml`,
            content: buildCellKML(cell_id, cell_coordinates),
        }))
        const archive = createZipArchive(files)
        const case_title = sanitizeFileName(req.session.case.title, 'coordinate')
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
