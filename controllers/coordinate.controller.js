const express = require('express')
const log = require('../utility/logger')
const database = require('../config/database')
const utility = require('../utility/utility')
const validator = require('../utility/validator')
const mw = require('../middlewares/check')
const rateLimit = require('express-rate-limit')
const config = require('../config/config')
const { Coordinate } = require('../models/coordinate.model')

// Create Method