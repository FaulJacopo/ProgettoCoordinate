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
    cell_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
}, {
    charset: 'utf8',
    collate: 'utf8_general_ci',
    hooks: {
        beforeUpdate: (coordinate) => {
            if (coordinate.changed('cell_id')) {
                throw new Error('cell_id cannot be changed after coordinate creation');
            }
        },
    },
})

async function syncCoordinateTable() {
    try {
        await Coordinate.sync();

        const queryInterface = sequelize.getQueryInterface();
        const tableName = Coordinate.getTableName();
        const columns = await queryInterface.describeTable(tableName);

        if (columns.position && !columns.cell_id) {
            await queryInterface.renameColumn(tableName, 'position', 'cell_id');
        } else if (columns.position && columns.cell_id) {
            const queryGenerator = queryInterface.queryGenerator;
            const quotedTable = queryGenerator.quoteTable(tableName);
            const quotedCellId = queryGenerator.quoteIdentifier('cell_id');
            const quotedPosition = queryGenerator.quoteIdentifier('position');

            await sequelize.query(
                `UPDATE ${quotedTable} SET ${quotedCellId} = ${quotedPosition} WHERE ${quotedCellId} IS NULL`
            );
            await queryInterface.removeColumn(tableName, 'position');
        } else if (!columns.cell_id) {
            await queryInterface.addColumn(tableName, 'cell_id', {
                type: DataTypes.INTEGER,
                allowNull: false,
            });
        }
    } catch (error) {
        log.Error('Failed to create or sync Coordinate table (Sequelize):', error);
        throw error;
    }
}
  
module.exports = {
    Coordinate,
    syncCoordinateTable,
};
