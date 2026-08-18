const { DataTypes } = require('sequelize');
const bcrypt = require('sequelize-bcrypt')
const sequelize = require('../config/sequelize');
const log = require('../utility/logger');

const Coordinate = sequelize.define('coordinate', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    text_identifier: DataTypes.STRING,
    latitude: DataTypes.STRING,
    longitude: DataTypes.STRING,
    case_id: DataTypes.INTEGER,
    position: DataTypes.INTEGER,
}, { charset: 'utf8', collate: 'utf8_general_ci'})

async function syncCoordinateTable() {
    try {
        await Coordinate.sync();
    } catch (error) {
        log.Error('Failed to create or sync Coordinate table (Sequelize):', error);
        throw error;
    }
}
  
module.exports = {
    Coordinate,
    syncCoordinateTable,
};