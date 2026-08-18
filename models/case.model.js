const { DataTypes } = require('sequelize');
const bcrypt = require('sequelize-bcrypt')
const sequelize = require('../config/sequelize');
const log = require('../utility/logger');

const Case = sequelize.define('case', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    title: DataTypes.STRING,
    reference: DataTypes.STRING,
    analyst: DataTypes.STRING,
}, { charset: 'utf8', collate: 'utf8_general_ci'})

async function syncCaseTable() {
    try {
        await Case.sync();
    } catch (error) {
        log.Error('Failed to create or sync Case table (Sequelize):', error);
        throw error;
    }
}
  
module.exports = {
    Case,
    syncCaseTable,
};