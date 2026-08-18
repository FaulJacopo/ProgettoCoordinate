const express = require('express')
const log = require('../utility/logger')
const utility = require('../utility/utility')
const validator = require('../utility/validator')
const mw = require('../middlewares/check')
const rateLimit = require('express-rate-limit')
const config = require('../config/config')
const router = express.Router()

const coordinateController = require('../controllers/coordinate.controller')

router.post('/get-coordinates',  coordinateController.getCoordinates)
router.post('/get-coordinate-by-id',  coordinateController.getCoordinateById)
router.post('/get-coordinate-by-case-id',  coordinateController.getCoordinateByCaseId)
router.post('/create-coordinate',  coordinateController.createCoordinate)

module.exports = router