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

exports.getCaseById = async (case_id) => {
    try {
        log.Info(`[CASE CONTROLLER] - Requested method to get case by ID - Passing through the Case Service`)

        let sel_case = await caseService.getCaseById(case_id)
        return sel_case
    } catch (error) {
        log.Error(`[CASE CONTROLLER] - Error while getting case by ID: ${error}`)
        return false
    }
}

exports.getCaseByUrl = async (url) => {
    try {
        log.Info(`[CASE CONTROLLER] - Requested method to get case by URL - Passing through the Case Service`)

        let sel_case = await caseService.getCaseByUrl(url)
        return sel_case
    } catch (error) {
        log.Error(`[CASE CONTROLLER] - Error while getting case by URL: ${error}`)
        return false
    }
}

exports.getCaseByCaseId = async (case_id) => {
    try {
        log.Info(`[CASE CONTROLLER] - Requested method to get case by Case ID - Passing through the Case Service`)

        let sel_case = await caseService.getCaseByCaseId(case_id)
        return sel_case
    } catch (error) {
        log.Error(`[CASE CONTROLLER] - Error while getting case by Case ID: ${error}`)
        return false
    }
}

exports.updateCase = async (case_id, title, reference, analyst) => {
    try {
        log.Info(`[CASE CONTROLLER] - Requested method to update case - Passing through the Case Service`) 

        let updated_case = await caseService.updateCase(case_id, title, reference, analyst)
        return updated_case
    } catch (error) {
        log.Error(`[CASE CONTROLLER] - Error while updating case: ${error}`)
        return false
    }
}

exports.deleteCase = async (case_id) => {
    try {
        log.Info(`[CASE CONTROLLER] - Requested method to delete case - Passing through the Case Service`)

        let deleted_case = await caseService.deleteCase(case_id)
        return deleted_case
    } catch (error) {
        log.Error(`[CASE CONTROLLER] - Error while deleting case: ${error}`)
        return false
    }
}