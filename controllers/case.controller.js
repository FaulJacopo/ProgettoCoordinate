const express = require('express')
const log = require('../utility/logger')
const database = require('../config/database')
const utility = require('../utility/utility')
const validator = require('../utility/validator')
const mw = require('../middlewares/check')
const rateLimit = require('express-rate-limit')
const config = require('../config/config')
const caseService = require('../services/case.service')

// Create Method

exports.createCase = async (title, reference, analyst) => {
    try {
        log.Info(`[CASE CONTROLLER] - Requested method to create case - Passing through the Case Service`)

        let cases = await caseService.createCase(title, reference, analyst)
        return cases

    } catch (error) {
        log.Error(`[CASE CONTROLLER] - Error while creating the case`)
        return false
    }
}

exports.getCases = async () => {
    try {   
        log.Info(`[CASE CONTROLLER] - Requested method to get cases - Passing through the Case Service`)

        let cases = await caseService.getCases()
        return cases
        
    } catch (error) {
        log.Error(`[CASE CONTROLLER] - Error while getting cases`)
        return false
    }
}