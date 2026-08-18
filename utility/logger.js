
const log = require('node-file-logger')

const options = {
    timeZone: 'Europe/Zurich',
    folderPath: '../logs/',
    dateBasedFileNaming: true,
    fileNamePrefix: 'Logs_',
    fileNameExtension: '.log',    
    dateFormat: 'DD-MM-YYYY',
    timeFormat: 'hh:mm:ss',
}

log.SetUserOptions(options)

module.exports = log
