const log = require('../utility/logger')
//const database = require('../models/database')

const checkLogin = (req, res, next) => {
    if (req.session.user != null) {
        log.Info(`Login Correct, Access Granted`)
        next()
    } else {
        log.Warn(`Someone Wants To Access Resources Without Login`)
        return res.redirect('/login')
    }
}

const checkLoginAdmin = (req, res, next) => {
    /*try {
        if (req.session.user && req.session.user.is_admin) {
            log.Info(`User logged in with Admin Role, Access Granted`)
            next()
        } else {
            log.Warn(`User Wants To Access Admin Resources Without being an Administrator`)
            return res.redirect('/login')
        }
    } catch {
        log.Warn(`Not logged user tried to access an admin resource!`)
        return res.redirect('/login')
    }*/
   next()
}

exports.checkLogin = checkLogin
exports.checkLoginAdmin = checkLoginAdmin
