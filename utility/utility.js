const log = require('./logger')
const nodemailer = require('nodemailer')
const database = require('../config/database')
const validator = require('../utility/validator')

const transporter = nodemailer.createTransport({
    host: 'mail.ticinoposta.ch',
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASS,
    },
})

exports.sendEmail = function (to, subject, text) {
    log.Info(`Preparing Options to Send Email!`)

    const mailOptions = {
        from: process.env.EMAIL,
        to: to,
        subject: subject,
        text: `${text}`
    }

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error(error)
            return false
        }
        log.Info(`Email Successfully sent!`)
    })
}

exports.removeFromArray = function (arr, question_id) {
    const index_to_delete = arr.findIndex(item => item.id === parseInt(question_id))
    if (index_to_delete > -1)
        arr.splice(index_to_delete, 1)
    return arr
}

exports.arrayMove = function (arr, from, to) {
    var element = arr[from]
    arr.splice(from, 1)
    arr.splice(to, 0, element)
    return arr
}

exports.getDate = function(sel_date) {
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth() + 1;
    var yyyy = today.getFullYear();

    if (dd < 10) {
        dd = '0' + dd
    } 

    if (mm < 10) {
        mm = '0' + mm
    } 

    today = dd + '/' + mm + '/' + yyyy;
    return today
}

exports.returnCategoryData = function(categories) {
    let categories_array = [];

    for (let i = 0; i < categories.length; i++) {
        categories_array.push({
            id: categories[i].id,
            name: categories[i].name,
            created_at: categories[i].createdAt,
        })
    }

    return categories_array;
}

exports.returnClientData = function(clients) {
    let clients_array = [];

    for (let i = 0; i < clients.length; i++) {
        clients_array.push({
            id: clients[i].id,
            name: clients[i].name,
            surname: clients[i].surname,
            address: clients[i].address,
            city: clients[i].city,
            phone: clients[i].phone,
            email: clients[i].email,
            password: clients[i].password,
            total: clients[i].total,
            created_at: clients[i].createdAt,
        })
    }

    return clients_array;
}

exports.returnProductData = function(products) {
    let products_array = [];

    for (let i = 0; i < products.length; i++) {
        products_array.push({
            id: products[i].id,
            name: products[i].name,
            description: products[i].description,
            category_id: products[i].category_id,
            price_s: products[i].price_s,
            price_n: products[i].price_n,
            price_f: products[i].price_f,
            img_url: products[i].img_url,
            created_at: products[i].createdAt,
        })
    }

    return products_array;
}

exports.returnDoughData = function (doughs) {
    let doughs_array = [];

    for (let i = 0; i < doughs.length; i++) {
        doughs_array.push({
            id: doughs[i].id,
            dough: doughs[i].dough,
            supply: doughs[i].supply,
            from: doughs[i].from,
            created_at: doughs[i].createdAt,
        })
    }

    return doughs_array;
}

exports.returnProductOrderData = function (product_orders) {
    let product_order_array = [];

    for (let i = 0; i < doughs.length; i++) {
        product_order_array.push({
            id: product_orders[i].id,
            product_id: product_orders[i].product_id,
            order_id: product_orders[i].order_id,
            dough_id: product_orders[i].dough_id,
            additions: product_orders[i].additions,
            total: product_orders[i].total,
            quantity: product_orders[i].quantity,
            size: product_orders[i].size,
            created_at: doughs[i].createdAt,
        })
    }

    return product_order_array;
}

exports.returnOrderData = function (orders) {
    let order_array = [];

    for (let i = 0; i < doughs.length; i++) {
        order_array.push({
            id: orders[i].id,
            time: orders[i].time,
            status: orders[i].status,
            notes: orders[i].notes,
            take_away: orders[i].take_away,
            client_id: orders[i].client_id,
            created_at: orders[i].createdAt,
        })
    }

    return product_order_array;
}

exports.returnOptionData = function (options) {
    let options_array = [];

    for (let i = 0; i < options.length; i++) {
        options_array.push({
            id: options[i].id,
            option: options[i].option,
            supply: options[i].supply,
            category_id: options[i].category_id,
            created_at: options[i].createdAt,
        })
    }

    return options_array;
}

exports.returnOpeningTimeData = function (opening_times) {
    let opening_time_array = [];

    for (let i = 0; i < opening_times.length; i++) {
        opening_time_array.push({
            id: opening_times[i].id,
            day: opening_times[i].day,
            times: opening_times[i].times,
            open: opening_times[i].open,
            created_at: opening_times[i].createdAt,
        })
    }

    return opening_time_array;
}

exports.returnNoteData = function (notes) {
    let note_array = [];

    for (let i = 0; i < notes.length; i++) {
        note_array.push({
            id: notes[i].id,
            allergens: notes[i].allergens,
            from: notes[i].from,
            created_at: notes[i].createdAt,
        })
    }

    return note_array;
}

exports.parseExcelNumber = (value) => {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : NaN
    }

    if (typeof value !== 'string') {
        return NaN
    }

    let normalized = value.trim().replace(/[\s\u00a0']/g, '')
    if (normalized === '') {
        return NaN
    }

    const lastComma = normalized.lastIndexOf(',')
    const lastDot = normalized.lastIndexOf('.')

    if (lastComma !== -1 && lastDot !== -1) {
        const decimalSeparator = lastComma > lastDot ? ',' : '.'
        const thousandsSeparator = decimalSeparator === ',' ? '.' : ','
        normalized = normalized.split(thousandsSeparator).join('')

        if (decimalSeparator === ',') {
            normalized = normalized.replace(',', '.')
        }
    } else if (lastComma !== -1) {
        const parts = normalized.split(',')
        const decimalPart = parts.pop()
        normalized = `${parts.join('')}.${decimalPart}`
    }

    return Number(normalized)
}