const express = require('express')
const log = require('../utility/logger')
const utility = require('../utility/utility')
const validator = require('../utility/validator')
const mw = require('../middlewares/check')
const rateLimit = require('express-rate-limit')
const config = require('../config/config')
const multer = require('multer');
const XLSX = require('xlsx');
const router = express.Router()

const coordinateController = require('../controllers/coordinate.controller')

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024
    },
    fileFilter: (req, file, cb) => {
        const allowed = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel'
        ];

        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('È consentito solamente un file Excel.'));
        }
    }
});

router.post('/get-coordinates',  coordinateController.getCoordinates)
router.post('/get-coordinate-by-id',  coordinateController.getCoordinateById)
router.post('/get-coordinate-by-case-id',  coordinateController.getCoordinateByCaseId)
router.post('/get-coordinates-by-selected-case', coordinateController.getCoordinatesBySelectedCase)
router.post('/get-unique-cell-ids-by-case-id', coordinateController.getUniqueCellIdsByCaseId)
router.post('/create-coordinate',  coordinateController.createCoordinate)
router.post('/save-coordinate', coordinateController.saveCoordinate)
router.post('/delete-coordinates-by-case-id', coordinateController.deleteCoordinatesByCaseId)
router.post('/update-color-by-cell-id', coordinateController.updateColorByCellId)
router.post('/export-file', coordinateController.exportFileKML)
router.post('/export-file-by-cell', coordinateController.exportFileKMLByCellId)

router.post('/import', upload.single('excel'), async (req, res) => {
    try {
        log.Info(`[COORDINATE ROUTER] - Requested route "/import" to import coordinates from Excel file`)

        if (!req.file) {
            return res.status(400).json({ error: 'Nessun file caricato.' });
        }

        const marker_shape = String(req.body.marker_shape || 'circle').toLowerCase();
        if (!['circle', 'triangle'].includes(marker_shape)) {
            return res.status(400).json({ error: 'Forma marker non valida.' });
        }

        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });

        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        const rows = XLSX.utils.sheet_to_json(sheet);
        const coordinates = [];

        for (const row of rows) {
            const text_identifier = row.Source ?? row.source ?? row.SOURCE
            const latitude = utility.parseExcelNumber(row.N ?? row.latitude ?? row.Latitude ?? row.LATITUDE ?? row.LAT ?? row.lat ?? row.Lat)
            const longitude = utility.parseExcelNumber(row.E ?? row.longitude ?? row.Longitude ?? row.LONGITUDE ?? row.LNG ?? row.lng ?? row.long ?? row.Long)
            const cell_id = utility.parseExcelNumber(row.CellID ?? row.cell_id ?? row['Cell ID'] ?? row.CELL_ID)
            const power = utility.parseExcelNumber(row.Adress ?? row.adress ?? row.Potenza ?? row.potenza ?? row.Power ?? row.power)
            const MCC = utility.parseExcelNumber(row.MCC)
            const MNC = utility.parseExcelNumber(row.MNC)

            if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !Number.isInteger(cell_id)) {
                continue;
            }

            coordinates.push({
                id: -1,
                text_identifier,
                latitude,
                longitude,
                cell_id,
                power: Number.isFinite(power) ? power : null,
                MCC: Number.isFinite(MCC) ? MCC : null,
                MNC: Number.isFinite(MNC) ? MNC : null,
                marker_shape
            });
        }

        if (coordinates.length === 0) {
            return res.status(400).json({
                error: 'Nessuna coordinata valida trovata nel file.'
            });
        }

        res.json({ success: true, imported: coordinates.length, coordinates: JSON.stringify(coordinates) });

    } catch (error) {
        log.Error(`[COORDINATE ROUTER] - Error during Excel file import: ${error.message}`);
        res.status(500).json({ error: `Errore durante l'importazione del file.` });
    }
});

module.exports = router
