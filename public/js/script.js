
let coordinates = [];
let coordinate_view = $('#coordinate-list')

function addCoordinate(form) {
    const lat = form.latitude.value;
    const lng = form.longitude.value;
    const text_identifier = form.description.value;

    if (lat && lng) {
        const coordinate = { lat: parseFloat(lat), lng: parseFloat(lng), text_identifier: text_identifier };
        coordinates.push(coordinate);
        updateMap(coordinates.length - 1);
        updateViewCoordinate();
        form.reset();
    }
}

function updateMap(coordinate_index) {
    const latitude = getCoordinateValue(coordinates[coordinate_index], 'lat', 'latitude');
    const longitude = getCoordinateValue(coordinates[coordinate_index], 'lng', 'longitude');
    const popupContent = `
        <div style="min-width: 180px;">
        <strong>${coordinates[coordinate_index].text_identifier}</strong><br>
        Latitude: ${latitude ?? '-'}<br>
        Longitude: ${longitude ?? '-'}<br>
        </div>
    `;

    L.marker([latitude, longitude]).addTo(map).bindPopup(popupContent);
}

function getCoordinateValue(coordinate, short_name, database_name) {
    return coordinate[short_name] ?? coordinate[database_name];
}

function formatCoordinate(value) {
    const numeric_value = Number(value);
    return Number.isFinite(numeric_value) ? numeric_value.toFixed(6) : '-';
}

function updateViewCoordinate() {
    coordinate_view.empty();

    if (coordinates.length === 0) {
        coordinate_view.append(
            $('<li>', {
                class: 'px-5 py-6 text-center text-sm text-slate-400',
                text: 'Nessuna coordinata aggiunta'
            })
        );
        return;
    }

    coordinates.forEach((element, index) => {
        const latitude = getCoordinateValue(element, 'lat', 'latitude');
        const longitude = getCoordinateValue(element, 'lng', 'longitude');
        const identifier = element.text_identifier?.trim() || 'Senza identificativo';

        const list_item = $('<li>', {
            class: 'flex items-start gap-3 px-5 py-4 transition hover:bg-slate-50'
        });

        const number = $('<span>', {
            class: 'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-sm font-bold text-red-700',
            text: index + 1
        });

        const content = $('<div>', { class: 'min-w-0 flex-1' });
        const title = $('<p>', {
            class: 'truncate text-sm font-semibold text-slate-900',
            text: identifier
        });

        const coordinate_data = $('<dl>', {
            class: 'mt-2 grid grid-cols-2 gap-x-4 gap-y-1'
        });

        const latitude_group = $('<div>', { class: 'min-w-0' }).append(
            $('<dt>', { class: 'text-xs font-medium text-slate-400', text: 'Latitudine' }),
            $('<dd>', {
                class: 'mt-0.5 truncate font-mono text-xs font-medium text-slate-600',
                text: formatCoordinate(latitude)
            })
        );

        const longitude_group = $('<div>', { class: 'min-w-0' }).append(
            $('<dt>', { class: 'text-xs font-medium text-slate-400', text: 'Longitudine' }),
            $('<dd>', {
                class: 'mt-0.5 truncate font-mono text-xs font-medium text-slate-600',
                text: formatCoordinate(longitude)
            })
        );

        coordinate_data.append(latitude_group, longitude_group);
        content.append(title, coordinate_data);
        list_item.append(number, content);
        coordinate_view.append(list_item);
    });
}

function loadFromCSV() {
    
}

function saveCaseCoordinates() {
    coordinates.forEach((element, index) => {
        $.post('/coordinates/save-coordinate', { lat: element.lat, lng: element.lng, position: index, text_id: element.text_id }, async function(res) {
            if (res.error) {
                showErrorNotification(res.error)
                window.location.href = res.redirect
            } else {
                console.log(`Coordinate ${index + 1} salvata con successo!`)
            }
        })
    })
}

// Search if the coordinates are already present in the database and load them on the map.

function getCoordinatesByCase() {
    $.post('/coordinates/get-coordinates-by-selected-case', {}, async function(res) {
        if (res.error) {
            showErrorNotification(res.error)
            window.location.href = res.redirect
        } else {
            coordinates = JSON.parse(res.coordinates)
            updateViewCoordinate()
            coordinates.forEach((_, index) => updateMap(index))
        }
    })
}
