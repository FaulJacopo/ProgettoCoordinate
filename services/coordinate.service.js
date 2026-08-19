const log = require('../utility/logger')
const { Coordinate } = require('../models/coordinate.model')

exports.createCoordinate = async (text_id, lat, lng, case_id, cell_id, power, MCC, MNC) => {
    try {
        log.Info(`[COORDINATE SERVICE] - Requested method to create coordinates`)

        ;(await Coordinate.create({ text_identifier: text_id, latitude: lat, longitude: lng, case_id, cell_id, power, MCC, MNC })).save()
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
            coordinates_array.push({ id: element.id, text_identifier: element.text_identifier, longitude: element.longitude, latitude: element.latitude, case_id: element.case_id, cell_id: element.cell_id, power: element.power, MCC: element.MCC, MNC: element.MNC })
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
        if (!sel_coordinate) {
            return false
        }

        let sel_coordinate_json = { id: sel_coordinate.id, text_identifier: sel_coordinate.text_identifier, longitude: sel_coordinate.longitude, latitude: sel_coordinate.latitude, case_id: sel_coordinate.case_id, cell_id: sel_coordinate.cell_id, power: sel_coordinate.power, MCC: sel_coordinate.MCC, MNC: sel_coordinate.MNC }

        return sel_coordinate_json

    } catch (error) {
        log.Error(`[COORDINATE SERVICE] - Something went wrong getting coordinate by id: ${error}`)
        return false
    }
}

exports.getCoordinateByCaseId = async (case_id) => {
    try {
        log.Info(`[COORDINATE SERVICE] - Requested method to get coordinates by case id`)

        let coordinates = await Coordinate.findAll({ where: { case_id: case_id }, order: [['cell_id', 'DESC']]})
        let coordinates_array = []

        coordinates.forEach(element => {
            coordinates_array.push({ id: element.id, text_identifier: element.text_identifier, longitude: element.longitude, latitude: element.latitude, case_id: element.case_id, cell_id: element.cell_id, power: element.power, MCC: element.MCC, MNC: element.MNC })
        })

        return coordinates_array

    } catch (error) {
        log.Error(`[COORDINATE SERVICE] - Something went wrong getting coordinates by case id: ${error}`)
        return false
    }
}

exports.getUniqueCellIdsByCaseId = async (case_id) => {
    try {
        log.Info(`[COORDINATE SERVICE] - Requested method to get unique cell ids by case id`)

        let unique_cell_ids = await Coordinate.findAll({ where: { case_id: case_id }, attributes: ['cell_id'], group: ['cell_id'] })
        return unique_cell_ids.map(item => item.cell_id)
    } catch (error) {
        log.Error(`[COORDINATE SERVICE] - Something went wrong getting unique cell ids by case id: ${error}`)
        return false
    }
}

exports.updateCoordinate = async (coordinates_id, text_id, lat, lng, power) => {
    try {
        log.Info(`[COORDINATE SERVICE] - Requested method to update coordinates`)

        let sel_coordinate = await Coordinate.findByPk(coordinates_id)
        if (!sel_coordinate) {
            return false
        }

        // Updating
        sel_coordinate.text_identifier = text_id
        sel_coordinate.latitude = lat
        sel_coordinate.longitude = lng
        sel_coordinate.power = power

        await sel_coordinate.save()
        return { id: sel_coordinate.id, text_identifier: sel_coordinate.text_identifier, longitude: sel_coordinate.longitude, latitude: sel_coordinate.latitude, case_id: sel_coordinate.case_id, cell_id: sel_coordinate.cell_id, power: sel_coordinate.power, MCC: sel_coordinate.MCC, MNC: sel_coordinate.MNC }

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

exports.createMultipleCoordinates = async (coordinates) => {
    try {
        log.Info(`[COORDINATE SERVICE] - Requested method to create Multiple Coordinates`)

        if (!Array.isArray(coordinates) || coordinates.length === 0) {
            return []
        }

        return Coordinate.bulkCreate(coordinates)
    } catch (error) {
        log.Error(`[COORDINATE SERVICE] - Something went wrong saving multiple coordinates: ${error}`)
        return false
    }
}
