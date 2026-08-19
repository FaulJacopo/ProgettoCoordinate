
let coordinates = [];
let coordinate_view = $('#coordinate-list')
let coordinate_markers = [];
let is_saving_coordinates = false;
let area_filtered_coordinates = null;
const selected_cell_ids = new Set();
const button = document.getElementById('import-excel');
const fileInput = document.getElementById('excel-file');
const cellFilterPanel = document.getElementById('cell-filter-panel');
const cellFilterList = document.getElementById('cell-filter-list');
const clearCellFiltersButton = document.getElementById('clear-cell-filters');

clearCellFiltersButton?.addEventListener('click', () => {
    selected_cell_ids.clear();
    renderCellFilters();
    applyCellFilters();
});

button?.addEventListener('click', () => {
    fileInput.click();
});

fileInput?.addEventListener('change', async () => {
    const file = fileInput.files[0];

    if (!file) {
        return;
    }

    const formData = new FormData();
    formData.append('excel', file);

    try {

        const response = await fetch('/coordinates/import', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (!response.ok) {
            showErrorNotification(result.error || 'Errore durante l\'importazione del file.');
            return;
        }

        if (coordinates.length != 0) {
            coordinates = coordinates.concat(JSON.parse(result.coordinates))
        } else
            coordinates = JSON.parse(result.coordinates);
        refreshCoordinates();

    } catch (error) {
        showErrorNotification(error.message || 'Errore durante l\'importazione del file.');
    } finally {
        fileInput.value = '';
    }
});

function addCoordinate(form) {
    const lat = form.latitude.value;
    const lng = form.longitude.value;
    const text_identifier = form.description.value;
    const cell_id = Number(form.cell_id.value);
    const power = Number(form.power.value);
    const MCC = form.MCC.value || null;
    const MNC = form.MNC.value || null;

    if (lat && lng && Number.isInteger(cell_id)) {
        const coordinate = { id: -1, latitude: parseFloat(lat), longitude: parseFloat(lng), text_identifier: text_identifier, cell_id, power, MCC, MNC };
        coordinates.push(coordinate);
        updateMap(coordinates.length - 1);
        updateViewCoordinate();
        renderCellFilters();
        applyCellFilters();
        form.reset();
    }
}

function updateMap(coordinate_index) {
    const coordinate = coordinates[coordinate_index];
    const latitude = getCoordinateValue(coordinate, 'lat', 'latitude');
    const longitude = getCoordinateValue(coordinate, 'lng', 'longitude');
    const marker_color = cellIdToColor(coordinate.cell_id);
    const marker_size = (coordinate.power < -120) ? 16 : (coordinate.power < -105) ? 26 : 35;

    const marker_icon = L.divIcon({
        className: 'cell-marker-icon',
        html: `<span class="cell-marker" style="--marker-color: ${marker_color}; --marker-size: ${marker_size}px;"></span>`,
        iconSize: [marker_size, marker_size],
        iconAnchor: [marker_size / 2, marker_size / 2],
        popupAnchor: [0, -marker_size / 2]
    });

    const popupContent = `
        <div style="min-width: 180px;">
            <strong>${coordinate.text_identifier}</strong><br>
            Latitude: ${latitude ?? '-'}<br>
            Longitude: ${longitude ?? '-'}<br>
            Cell ID: ${coordinate.cell_id ?? '-'}<br>
            Power: ${coordinate.power ?? '-'}<br>
            MCC: ${coordinate.MCC ?? '-'}<br>
            MNC: ${coordinate.MNC ?? '-'}
        </div>`;

    const marker = L.marker([latitude, longitude], { icon: marker_icon }).bindPopup(popupContent);
    coordinate_markers.push({ marker, cell_id: String(coordinate.cell_id), coordinate });
    marker.addTo(map);
}

function refreshCoordinates() {
    coordinate_markers.forEach(({ marker }) => map.removeLayer(marker));
    coordinate_markers = [];

    coordinates.forEach((_, index) => updateMap(index));
    updateViewCoordinate();
    renderCellFilters();
    applyCellFilters();
}

function getUniqueCellIds() {
    return [...new Set(coordinates
        .map(coordinate => coordinate.cell_id)
        .filter(cell_id => cell_id !== null && cell_id !== undefined)
        .map(String))]
        .sort((first, second) => Number(first) - Number(second));
}

function renderCellFilters() {
    const cell_ids = getUniqueCellIds();
    const available_cell_ids = new Set(cell_ids);

    for (const selected_cell_id of selected_cell_ids) {
        if (!available_cell_ids.has(selected_cell_id)) {
            selected_cell_ids.delete(selected_cell_id);
        }
    }

    cellFilterList.replaceChildren();
    cellFilterPanel.classList.toggle('hidden', cell_ids.length === 0);
    clearCellFiltersButton.classList.toggle('hidden', selected_cell_ids.size === 0);

    cell_ids.forEach(cell_id => {
        const marker_color = cellIdToColor(cell_id);
        const is_selected = selected_cell_ids.has(cell_id);
        const badge = document.createElement('button');

        badge.type = 'button';
        badge.className = 'cell-filter-badge';
        badge.textContent = cell_id;
        badge.setAttribute('aria-pressed', String(is_selected));
        badge.style.setProperty('--cell-color', marker_color);
        badge.style.setProperty('--cell-contrast', getContrastColor(marker_color));
        badge.addEventListener('click', () => toggleCellFilter(cell_id));
        cellFilterList.appendChild(badge);
    });
}

function toggleCellFilter(cell_id) {
    if (selected_cell_ids.has(cell_id)) {
        selected_cell_ids.delete(cell_id);
    } else {
        selected_cell_ids.add(cell_id);
    }

    renderCellFilters();
    applyCellFilters();
}

function applyCellFilters() {
    coordinate_markers.forEach(({ marker, cell_id, coordinate }) => {
        const matches_cell_filter = selected_cell_ids.size === 0 || selected_cell_ids.has(cell_id);
        const matches_area_filter = area_filtered_coordinates === null || area_filtered_coordinates.has(coordinate);
        const should_be_visible = matches_cell_filter && matches_area_filter;
        const is_visible = map.hasLayer(marker);

        if (should_be_visible && !is_visible) {
            marker.addTo(map);
        } else if (!should_be_visible && is_visible) {
            map.removeLayer(marker);
        }
    });
}

function cellIdToColor(cell_id) {
    let hash = Number(cell_id) >>> 0;

    hash ^= hash >>> 16;
    hash = Math.imul(hash, 0x7feb352d);
    hash ^= hash >>> 15;
    hash = Math.imul(hash, 0x846ca68b);
    hash ^= hash >>> 16;

    const hue = (hash >>> 0) % 360;
    const saturation = 72 + ((hash >>> 8) % 9);
    const lightness = 42 + ((hash >>> 16) % 7);
    return hslToHex(hue, saturation, lightness);
}

function hslToHex(hue, saturation, lightness) {
    const normalized_saturation = saturation / 100;
    const normalized_lightness = lightness / 100;
    const chroma = (1 - Math.abs(2 * normalized_lightness - 1)) * normalized_saturation;
    const intermediate = chroma * (1 - Math.abs((hue / 60) % 2 - 1));
    const offset = normalized_lightness - chroma / 2;
    let red = 0;
    let green = 0;
    let blue = 0;

    if (hue < 60) [red, green, blue] = [chroma, intermediate, 0];
    else if (hue < 120) [red, green, blue] = [intermediate, chroma, 0];
    else if (hue < 180) [red, green, blue] = [0, chroma, intermediate];
    else if (hue < 240) [red, green, blue] = [0, intermediate, chroma];
    else if (hue < 300) [red, green, blue] = [intermediate, 0, chroma];
    else [red, green, blue] = [chroma, 0, intermediate];

    return `#${[red, green, blue]
        .map(channel => Math.round((channel + offset) * 255).toString(16).padStart(2, '0'))
        .join('')}`;
}

function getContrastColor(hex_color) {
    const red = parseInt(hex_color.slice(1, 3), 16);
    const green = parseInt(hex_color.slice(3, 5), 16);
    const blue = parseInt(hex_color.slice(5, 7), 16);
    const luminance = (red * 299 + green * 587 + blue * 114) / 1000;
    return luminance > 150 ? '#0f172a' : '#ffffff';
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
        const marker_color = cellIdToColor(element.cell_id);

        const list_item = $('<li>', {
            class: 'flex items-start gap-3 px-5 py-4 transition hover:bg-slate-50'
        });

        const number = $('<span>', {
            class: 'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white',
            text: index + 1
        }).css('background-color', marker_color);

        const content = $('<div>', { class: 'min-w-0 flex-1' });
        const title = $('<p>', {
            class: 'truncate text-sm font-semibold text-slate-900',
            text: identifier
        });

        const coordinate_data = $('<dl>', {
            class: 'mt-2 grid grid-cols-3 gap-x-4 gap-y-1'
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

        const cell_id_group = $('<div>', { class: 'min-w-0' }).append(
            $('<dt>', { class: 'text-xs font-medium text-slate-400', text: 'Cell ID' }),
            $('<dd>', {
                class: 'mt-0.5 truncate font-mono text-xs font-medium text-slate-600',
                text: element.cell_id ?? '-'
            })
        );

        const power_group = $('<div>', { class: 'min-w-0' }).append(
            $('<dt>', { class: 'text-xs font-medium text-slate-400', text: 'Power' }),
            $('<dd>', {
                class: 'mt-0.5 truncate font-mono text-xs font-medium text-slate-600',
                text: element.power ?? '-'
            })
        );

        const MCC_group = $('<div>', { class: 'min-w-0' }).append(
            $('<dt>', { class: 'text-xs font-medium text-slate-400', text: 'MCC' }),
            $('<dd>', {
                class: 'mt-0.5 truncate font-mono text-xs font-medium text-slate-600',
                text: element.MCC ?? '-'
            })
        );

        const MNC_group = $('<div>', { class: 'min-w-0' }).append(
            $('<dt>', { class: 'text-xs font-medium text-slate-400', text: 'MNC' }),
            $('<dd>', {
                class: 'mt-0.5 truncate font-mono text-xs font-medium text-slate-600',
                text: element.MNC ?? '-'
            })
        );

        coordinate_data.append(latitude_group, longitude_group, cell_id_group, power_group, MCC_group, MNC_group);
        content.append(title, coordinate_data);
        list_item.append(number, content);
        coordinate_view.append(list_item);
    });
}

function filterCoordinatesByLatLong(areaCoordinates) {
    if (!Array.isArray(areaCoordinates) || areaCoordinates.length < 3) {
        return [];
    }

    const polygon = areaCoordinates
        .map(coordinate => ({ latitude: Number(coordinate.latitude), longitude: Number(coordinate.longitude) }))
        .filter(coordinate => Number.isFinite(coordinate.latitude) && Number.isFinite(coordinate.longitude));

    if (polygon.length < 3) {
        return [];
    }

    function isPointInsidePolygon(latitude, longitude) {
        let inside = false;

        for ( let current = 0, previous = polygon.length - 1; current < polygon.length; previous = current++ ) {
            const currentLatitude = polygon[current].latitude;
            const currentLongitude = polygon[current].longitude;
            const previousLatitude = polygon[previous].latitude;
            const previousLongitude = polygon[previous].longitude;

            const intersects = (currentLatitude > latitude) !== (previousLatitude > latitude) && longitude < ((previousLongitude - currentLongitude) * (latitude - currentLatitude)) / (previousLatitude - currentLatitude) + currentLongitude;

            if (intersects) {
                inside = !inside;
            }
        }

        return inside;
    }

    return coordinates.filter(coordinate => {
        const latitude = Number(coordinate.latitude ?? coordinate.lat);
        const longitude = Number(coordinate.longitude ?? coordinate.lng);

        return (Number.isFinite(latitude) && Number.isFinite(longitude) && isPointInsidePolygon(latitude, longitude));
    });
}

function showFilteredCells(filtered_coordinates) {
    area_filtered_coordinates = Array.isArray(filtered_coordinates)
        ? new Set(filtered_coordinates)
        : null;

    applyCellFilters();
}

async function saveCaseCoordinates() {
    let temp_coordinates = coordinates.filter(el => el.id == -1)
    let payload_range = 250
    let times = Math.ceil(temp_coordinates.length / payload_range)

    for (let i = 0; i < times; i++) {
        $.post('/coordinates/save-coordinate', { coordinates: JSON.stringify(temp_coordinates.slice(i * payload_range, (i + 1) * payload_range)) }, async function(res) {
            if (res.error) {
                showErrorNotification(res.error)
                window.location.href = res.redirect
            } else {
                console.log(`Coordinate salvate con successo!`)
            }
        })
    }
}

// Search if the coordinates are already present in the database and load them on the map.

function getCoordinatesByCase() {
    $.post('/coordinates/get-coordinates-by-selected-case', {}, async function(res) {
        if (res.error) {
            showErrorNotification(res.error)
            window.location.href = res.redirect
        } else {
            coordinates = JSON.parse(res.coordinates)
            refreshCoordinates()
        }
    })
}

$(document).ready(function() {
    if (typeof map !== 'undefined' && cellFilterPanel) {
        getCoordinatesByCase()
    }
})
