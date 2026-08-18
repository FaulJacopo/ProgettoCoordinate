const logger = require('../utility/logger');
require('dotenv').config({ quiet: true });
const mysql = require('mysql2/promise');
const sequelize = require('./sequelize');

const { syncCaseTable } = require('../models/case.model')
const { syncCoordinateTable } = require('../models/coordinate.model')

async function initializeDatabase() {
  let connection;
  let dbJustCreated = false;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      multipleStatements: true
    });
    const [rows] = await connection.query(`SHOW DATABASES LIKE "${process.env.DB_NAME}"`);
    if (rows.length === 0) {
      await connection.query(`CREATE DATABASE ${process.env.DB_NAME}`);
      logger.Info(`Database ${process.env.DB_NAME} created (was missing).`);
      dbJustCreated = true;
    }
  } catch (error) {
    logger.Error('DB bootstrap failed (creation/check error):', error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.end();
      } catch (e) {
        logger.Warn('Could not close DB connection cleanly.', e);
      }
    }
  }
  if (dbJustCreated) {
      try {
          await syncCaseTable();
          await syncCoordinateTable();
      } catch (error) {
          logger.Error('Error during tables sync:', error);
          throw error;
      }
  }
}

module.exports = {
  initializeDatabase
};