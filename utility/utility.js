const log = require('./logger')
const nodemailer = require('nodemailer')
const database = require('../config/database')
const validator = require('../utility/validator')
const { createCanvas } = require('canvas')
const zlib = require('zlib')

const crc32_table = Array.from({ length: 256 }, (_, table_index) => {
    let checksum = table_index
    for (let bit = 0; bit < 8; bit++) {
        checksum = (checksum & 1) ? (0xedb88320 ^ (checksum >>> 1)) : (checksum >>> 1)
    }
    return checksum >>> 0
})

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

exports.changeToKMLColor = (hex_color) => {
    hex = hex_color.replace('#', '');

    const r = hex.substring(0, 2);
    const g = hex.substring(2, 4);
    const b = hex.substring(4, 6);

    return `ff${b}${g}${r}`;
}

exports.createMarkerIcon = (color, marker_shape = 'circle') => {
    const canvas = createCanvas(32, 32)
    const context = canvas.getContext('2d')
    const marker_color = /^#[0-9a-f]{6}$/i.test(color || '') ? color : '#ff0000'
    const normalized_shape = marker_shape === 'triangle' ? 'triangle' : 'circle'

    context.beginPath()
    if (normalized_shape === 'triangle') {
        context.moveTo(16, 2)
        context.lineTo(30, 30)
        context.lineTo(2, 30)
        context.closePath()
    } else {
        context.arc(16, 16, 14, 0, 2 * Math.PI)
    }

    context.fillStyle = marker_color
    context.fill()

    return canvas.toDataURL('image/png')
}

exports.createCircle = (color) => {
    return exports.createMarkerIcon(color, 'circle')
}

exports.resetFileContent = () => {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<kml xmlns="http://earth.google.com/kml/2.1">
<Document>
<Style id="globalCustomColor">
    <IconStyle>
    <color>ff0000ff</color> <!-- Change to your preferred AABBGGRR color -->
    </IconStyle>
    <LineStyle>
    <color>ff0000ff</color> <!-- Changes lines if your placemarks have paths -->
    </LineStyle>
    <PolyStyle>
    <color>ff0000ff</color> <!-- Changes fills if your placemarks are shapes -->
    </PolyStyle>
</Style>
<Folder><name>Cells</name>`
}

exports.calculateCRC32 = (content) => {
    let checksum = 0xffffffff
    for (const byte of content) {
        checksum = crc32_table[(checksum ^ byte) & 0xff] ^ (checksum >>> 8)
    }
    return (checksum ^ 0xffffffff) >>> 0
}

exports.getZipDateTime = (date = new Date()) => {
    const year = Math.max(date.getFullYear(), 1980)
    return {
        time: (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2),
        date: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate(),
    }
}

exports.createZipArchive = (files) => {
    const local_parts = []
    const central_parts = []
    const zip_date_time = exports.getZipDateTime()
    let local_offset = 0

    files.forEach(file => {
        const file_name = Buffer.from(file.name, 'utf8')
        const content = Buffer.from(file.content, 'utf8')
        const compressed_content = zlib.deflateRawSync(content)
        const checksum = exports.calculateCRC32(content)
        const local_header = Buffer.alloc(30)

        local_header.writeUInt32LE(0x04034b50, 0)
        local_header.writeUInt16LE(20, 4)
        local_header.writeUInt16LE(0x0800, 6)
        local_header.writeUInt16LE(8, 8)
        local_header.writeUInt16LE(zip_date_time.time, 10)
        local_header.writeUInt16LE(zip_date_time.date, 12)
        local_header.writeUInt32LE(checksum, 14)
        local_header.writeUInt32LE(compressed_content.length, 18)
        local_header.writeUInt32LE(content.length, 22)
        local_header.writeUInt16LE(file_name.length, 26)
        local_header.writeUInt16LE(0, 28)

        const central_header = Buffer.alloc(46)
        central_header.writeUInt32LE(0x02014b50, 0)
        central_header.writeUInt16LE(20, 4)
        central_header.writeUInt16LE(20, 6)
        central_header.writeUInt16LE(0x0800, 8)
        central_header.writeUInt16LE(8, 10)
        central_header.writeUInt16LE(zip_date_time.time, 12)
        central_header.writeUInt16LE(zip_date_time.date, 14)
        central_header.writeUInt32LE(checksum, 16)
        central_header.writeUInt32LE(compressed_content.length, 20)
        central_header.writeUInt32LE(content.length, 24)
        central_header.writeUInt16LE(file_name.length, 28)
        central_header.writeUInt16LE(0, 30)
        central_header.writeUInt16LE(0, 32)
        central_header.writeUInt16LE(0, 34)
        central_header.writeUInt16LE(0, 36)
        central_header.writeUInt32LE(0, 38)
        central_header.writeUInt32LE(local_offset, 42)

        local_parts.push(local_header, file_name, compressed_content)
        central_parts.push(central_header, file_name)
        local_offset += local_header.length + file_name.length + compressed_content.length
    })

    const central_directory = Buffer.concat(central_parts)
    const end_record = Buffer.alloc(22)
    end_record.writeUInt32LE(0x06054b50, 0)
    end_record.writeUInt16LE(0, 4)
    end_record.writeUInt16LE(0, 6)
    end_record.writeUInt16LE(files.length, 8)
    end_record.writeUInt16LE(files.length, 10)
    end_record.writeUInt32LE(central_directory.length, 12)
    end_record.writeUInt32LE(local_offset, 16)
    end_record.writeUInt16LE(0, 20)

    return Buffer.concat([...local_parts, central_directory, end_record])
}

exports.escapeXml = (value) => {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&apos;')
}

exports.sanitizeFileName = (value, fallback) => {
    const sanitized_value = String(value ?? '')
        .trim()
        .replace(/[^a-z0-9._-]+/gi, '-')
        .replace(/^-+|-+$/g, '')
    return sanitized_value || fallback
}

exports.buildCellKML = (cell_id, coordinates) => {
    let content = exports.resetFileContent()

    coordinates.forEach(coordinate => {
        const scale = coordinate.power < -120 ? 1 : coordinate.power < -105 ? 1.5 : 2
        const color = /^#[0-9a-f]{6}$/i.test(coordinate.color || '') ? coordinate.color : '#ff0000'
        const marker_shape = coordinate.marker_shape === 'triangle' ? 'triangle' : 'circle'
        content += `
<Placemark>
    <Style>
        <IconStyle>
            <scale>${scale}</scale>
            <Icon>
                <href>${exports.createMarkerIcon(color, marker_shape)}</href>
            </Icon>
        </IconStyle>
    </Style>
    <name>${exports.escapeXml(cell_id)}</name>
    <description>CellID: ${exports.escapeXml(coordinate.cell_id)} / MCC: ${exports.escapeXml(coordinate.MCC)} / MNC: ${exports.escapeXml(coordinate.MNC)} / Power: ${exports.escapeXml(coordinate.power)}</description>
    <TimeStamp><when>2026-08-11T17:24:00Z</when></TimeStamp>
    <Point><coordinates>${exports.escapeXml(coordinate.longitude)},${exports.escapeXml(coordinate.latitude)}</coordinates></Point>
</Placemark>`
    })

    return `${content}</Folder></Document></kml>`
}
