const log = require('../utility/logger')
const { Coordinate } = require('../models/coordinate.model')

exports.createCoordinate = async (text_id, lat, lng, case_id, position) => {
    try {
        log.Info(`[COORDINATE SERVICE] - Requested method to create coordinates`)

        ;(await Coordinate.create({ text_identifier: text_id, latitude: lat, longitude: lng, case_id, position })).save()
        return this.getCoordinates()

    } catch (error) {
        log.Error(`[COORDINATE SERVICE] - Something went wrong creating coordinate: ${error}`)
        return false
    }
}

exports.getCoordinates = async () => {
    try {
        log.Info(`[COORDINATE SERVICE] - Requested method to get all coordinates`)

        let coordinates = await Coordinate.findAll()
        let coordinates_array = []

        coordinates.forEach(element => {
            coordinates_array.push({ id: element.id, text_identifier: element.text_identifier, longitude: element.longitude, latitude: element.latitude, case_id: element.case_id, position: element.position })
        })

        return coordinates_array

    } catch (error) {
        log.Error(`[COORDINATE SERVICE] - Something went wrong getting coordinates: ${error}`)
        return false
    }
}

exports.getCoordinateById = async (coordinates_id) => {
    try {
        log.Info(`[COORDINATE SERVICE] - Requested method to get coordinates by id`)

        let sel_coordinate = await Coordinate.findByPk(parseInt(coordinates_id))
        let sel_coordinate_json = { id: element.id, text_identifier: element.text_identifier, longitude: element.longitude, latitude: element.latitude, case_id: element.case_id, position: element.position }

        return sel_coordinate_json

    } catch (error) {
        log.Error(`[COORDINATE SERVICE] - Something went wrong getting coordinate by id: ${error}`)
        return false
    }
}

exports.getCoordinateByCaseId = async (case_Id) => {
    try {
        log.Info(`[COORDINATE SERVICE] - Requested method to get coordinates by case id`)

        let coordinates = await Coordinate.findAll({ where: { case_id: case_id }, order: [position, 'DESC']})
        let coordinates_array = []

        coordinates.forEach(element => {
            coordinates_array.push({ id: element.id, text_identifier: element.text_identifier, longitude: element.longitude, latitude: element.latitude, case_id: element.case_id, position: element.position })
        })

        return coordinates_array

    } catch (error) {
        log.Error(`[COORDINATE SERVICE] - Something went wrong getting coordinate by id: ${error}`)
        return false
    }
}

exports.updateCoordinate = async (coordinates_id, text_id, lat, lng, position) => {
    try {
        log.Info(`[COORDINATE SERVICE] - Requested method to update coordinates`)

        let sel_coordinate = await Coordinate.findByPk(coordinates_id)
        let number_coordinate_rows = await Coordinate.count({ case_id: sel_coordinate.case_id })

        position = Math.max(0, Math.min(position, number_coordinate_rows));

        // Updating
        sel_coordinate.text_identifier = text_id
        sel_coordinate.latitude = lat
        sel_coordinate.longitude = lng
        sel_coordinate.position = position

    } catch (error) {
        log.Error(`[COORDINATE SERVICE] - Something went wrong updating coordinate: ${error}`)
        return false
    }
}

exports.deleteCoordinate = async (coordinates_id) => {
    try {
        log.Info(`[COORDINATE SERVICE] - Requested method to delete coordinates`)

        let deleted_coordinate = await Coordinate.destroy({ where: { id: coordinates_id }})
        return this.getCoordinates()

    } catch (error) {
        log.Error(`[COORDINATE SERVICE] - Something went wrong deleting coordinate: ${error}`)
        return false
    }
}