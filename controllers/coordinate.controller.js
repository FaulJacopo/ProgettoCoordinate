const express = require('express')
const log = require('../utility/logger')
const database = require('../config/database')
const utility = require('../utility/utility')
const validator = require('../utility/validator')
const mw = require('../middlewares/check')
const rateLimit = require('express-rate-limit')
const config = require('../config/config')

const coordinateService = require('../services/coordinate.service')

// Create Method

exports.createCoordinate = async (x, y, caseId) => {
    try {
        log.Info(`[COORDINATE CONTROLLER] - Requested method to create coordinate - Passing through the Coordinate Service`)

        let coordinate = await coordinateService.createCoordinate(x, y, caseId)
        return coordinate

    } catch (error) {
        log.Error(`[COORDINATE CONTROLLER] - Error while creating the coordinate`)
        return false
    }
}


exports.getCoordinates = async () => {
    try {
        log.Info(`[COORDINATE CONTROLLER] - Requested method to get coordinates - Passing through the Coordinate Service`)

        let coordinates = await coordinateService.getCoordinates()
        return coordinates

    } catch (error) {
        log.Error(`[COORDINATE CONTROLLER] - Error while getting the coordinate`)
        return false
    }
}


exports.getCoordinateById = async (id) => {
    try {
        log.Info(`[COORDINATE CONTROLLER] - Requested method to get coordinate by ID - Passing through the Coordinate Service`)

        let coordinate = await coordinateService.getCoordinateById(id)
        return coordinate

    } catch (error) {
        log.Error(`[COORDINATE CONTROLLER] - Error while getting the coordinate`)
        return false
    }
}


exports.getCoordinateByCaseId = async (caseId) => {
    try {
        log.Info(`[COORDINATE CONTROLLER] - Requested method to get coordinate by case ID - Passing through the Coordinate Service`)

        let coordinate = await coordinateService.getCoordinateByCaseId(caseId)
        return coordinate

    } catch (error) {
        log.Error(`[COORDINATE CONTROLLER] - Error while getting the coordinate`)
        return false
    }
}

exports.updateCoordinate = async (id, x, y) => {
    try {
        log.Info(`[COORDINATE CONTROLLER] - Requested method to update coordinate - Passing through the Coordinate Service`)
        
        let coordinate = await coordinateService.updateCoordinate(id, x, y)
        return coordinate

    } catch (error) {
        log.Error(`[COORDINATE CONTROLLER] - Error while updating the coordinate`)
        return false
    }
}


exports.deleteCoordinate = async (id) => {
    try {
        log.Info(`[COORDINATE CONTROLLER] - Requested method to delete coordinate - Passing through the Coordinate Service`)

        let coordinate = await coordinateService.deleteCoordinate(id)
        return coordinate

    } catch (error) {
        log.Error(`[COORDINATE CONTROLLER] - Error while deleting the coordinate`)
        return false
    }
}