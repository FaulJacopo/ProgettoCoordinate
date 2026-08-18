const log = require('./logger')
const password_validator = require('password-validator')
const email_validator = require('validator')
const password_schema = new password_validator()
const email_schema = new password_validator()

password_schema
.is().min(8)
.is().max(32)
.has().lowercase()
.has().uppercase()
.has().digits(2)
.has().not().spaces()

email_schema.usingPlugin(email_validator.isEmail)

// Utility Functions

function betweenChars(word, chars) {
    return ((word.length > 0) && (word.length < parseInt(chars)))
}

// Returns if param is undefined
function isU(param) {
    return ((param === undefined) || (param === NaN)) 
}

function isBetween(param, min, max) {
    return ((param >= min) && (param <= max))
}

// Method To Export

exports.registration = function(name, surname, email, password, confirm_password, terms) {
    log.Debug(`Checking if all registration parameters are correct!`)

    if (isU(name) || isU(surname) || isU(email) || isU(password) || isU(confirm_password) || isU(terms))
        return false
    if (password != confirm_password)
        return false
    if (!(betweenChars(name, 256) && betweenChars(surname, 256) && betweenChars(email, 256) && betweenChars(password, 256)))
        return false
    if (!email_schema.validate(email))
        return false
    if (!password_schema.validate(password))
        return false
    if (terms == "false")
        return false

    return true
}

exports.contactUs = function(name, email, company, phone) {
    log.Debug(`Checking if all contact us parameters are correct!`)

    if (isU(name) || isU(email) || isU(company) || isU(phone))
        return false
    if (!(betweenChars(name, 256) && betweenChars(email, 256) && betweenChars(company, 256) && betweenChars(phone, 256)))
        return false
    if (!email_schema.validate(email))
        return false

    return true
} 

exports.password = function(password, confirm) {
    log.Debug(`Checking if password and confirm are correct (the two are equivalent and satisfy options)`)

    if (password != confirm)
        return false
    if (!password_schema.validate(password))
        return false

    return true
}