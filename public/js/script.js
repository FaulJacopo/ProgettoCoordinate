let coordinates = [];
let coordinate_view = $('#coordinate-list')
let coordinate_markers = [];
let is_saving_coordinates = false;
let area_filtered_coordinates = null;
let filtered_coordinates = [];
let power_filter_min = null;
let power_filter_max = null;
let power_available_min = null;
let power_available_max = null;
let coordinate_marker_layer = null;
let cell_filter_timeout = null;
let coordinate_list_rendered_count = 0;

const CELL_FILTER_DELAY = 200;
const COORDINATE_LIST_BATCH_SIZE = 50;
const COORDINATE_LIST_SCROLL_THRESHOLD = 160;

const selected_cell_ids = new Set();
const selected_operator_codes = new Set(['01', '02', '03', 'XX']);
const button = document.getElementById('import-excel');
const fileInput = document.getElementById('excel-file');
const cellFilterPanel = document.getElementById('cell-filter-panel');
const cellFilterList = document.getElementById('cell-filter-list');
const clearCellFiltersButton = document.getElementById('clear-cell-filters');
const dataFilterPanel = document.getElementById('data-filter-panel');
const powerFilterMin = document.getElementById('power-filter-min');
const powerFilterMax = document.getElementById('power-filter-max');
const powerFilterValue = document.getElementById('power-filter-value');
const operatorFilterList = document.getElementById('operator-filter-list');
const resetDataFiltersButton = document.getElementById('reset-data-filters');
const cellColorPanel = document.getElementById('cell-color-panel');
const cellColorForm = document.getElementById('cell-color-form');
const cellColorId = document.getElementById('cell-color-id');
const cellColorValue = document.getElementById('cell-color-value');
const coordinateList = document.getElementById('coordinate-list');

clearCellFiltersButton?.addEventListener('click', () => {
    selected_cell_ids.clear();
    renderCellFilters();
    scheduleCellFilters();
});

powerFilterMin?.addEventListener('input', () => {
    power_filter_min = Math.min(Number(powerFilterMin.value), Number(powerFilterMax.value));
    powerFilterMin.value = power_filter_min;
    updatePowerFilterValue();
    scheduleCellFilters();
});

powerFilterMax?.addEventListener('input', () => {
    power_filter_max = Math.max(Number(powerFilterMax.value), Number(powerFilterMin.value));
    powerFilterMax.value = power_filter_max;
    updatePowerFilterValue();
    scheduleCellFilters();
});

operatorFilterList?.addEventListener('change', event => {
    if (!event.target.matches('input[type="checkbox"]')) return;

    selected_operator_codes.clear();
    operatorFilterList.querySelectorAll('input[type="checkbox"]:checked').forEach(input => {
        selected_operator_codes.add(input.value);
    });
    scheduleCellFilters();
});

resetDataFiltersButton?.addEventListener('click', () => {
    power_filter_min = null;
    power_filter_max = null;
    selected_operator_codes.clear();
    ['01', '02', '03', 'XX'].forEach(code => selected_operator_codes.add(code));
    operatorFilterList.querySelectorAll('input[type="checkbox"]').forEach(input => { input.checked = true; });
    renderDataFilters();
    scheduleCellFilters();
});

coordinateList?.addEventListener('scroll', () => {
    const distance_from_bottom = coordinateList.scrollHeight - coordinateList.scrollTop - coordinateList.clientHeight;

    if (distance_from_bottom <= COORDINATE_LIST_SCROLL_THRESHOLD) {
        renderNextCoordinateBatch();
    }
});

cellColorId?.addEventListener('change', () => {
    cellColorValue.value = getCellIdColor(cellColorId.value);
});

cellColorForm?.addEventListener('submit', event => {
    event.preventDefault();
    changeColorByCellId(cellColorForm);
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
    formData.append('marker_shape', getSelectedImportMarkerShape());

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
        showSuccessNotification('File importato con successo.');

    } catch (error) {
        showErrorNotification(error.message || 'Errore durante l\'importazione del file.');
    } finally {
        fileInput.value = '';
    }
});

function addCoordinate(form) {
    const import_marker_shape = getSelectedImportMarkerShape();
    const lat = form.latitude.value;
    const lng = form.longitude.value;
    const text_identifier = form.description.value;
    const cell_id = Number(form.cell_id.value);
    const power = Number(form.power.value);
    const MCC = form.MCC.value || null;
    const MNC = form.MNC.value || null;

    if (lat && lng && Number.isInteger(cell_id)) {
        const coordinate = { id: -1, latitude: parseFloat(lat), longitude: parseFloat(lng), text_identifier: text_identifier, cell_id, power, MCC, MNC, marker_shape: 'circle' };
        coordinates.push(coordinate);
        updateMap(coordinates.length - 1);
        updateViewCoordinate();
        renderCellFilters();
        renderDataFilters();
        applyCellFilters();
        form.reset();
        const selected_shape_input = form.querySelector(`input[name="import_marker_shape"][value="${import_marker_shape}"]`);
        if (selected_shape_input) selected_shape_input.checked = true;
        showSuccessNotification('Coordinata aggiunta con successo.');
    }
}

function normalizeMarkerShape(marker_shape) {
    return marker_shape === 'triangle' ? 'triangle' : 'circle';
}

function getSelectedImportMarkerShape() {
    return normalizeMarkerShape(document.querySelector('input[name="import_marker_shape"]:checked')?.value);
}

function ensureTriangleCanvasSupport() {
    if (L.TriangleMarker) return;

    L.Canvas.include({
        _updateTriangle(layer) {
            if (!this._drawing || layer._empty()) return;

            const point = layer._point;
            const radius = Math.max(Math.round(layer._radius), 1);
            const context = this._ctx;

            context.beginPath();
            context.moveTo(point.x, point.y - radius);
            context.lineTo(point.x + radius, point.y + radius);
            context.lineTo(point.x - radius, point.y + radius);
            context.closePath();
            this._fillStroke(context, layer);
        }
    });

    L.TriangleMarker = L.CircleMarker.extend({
        _updatePath() {
            this._renderer._updateTriangle(this);
        },

        _containsPoint(point) {
            const radius = this._radius + this._clickTolerance();
            const center = this._point;
            const vertices = [
                L.point(center.x, center.y - radius),
                L.point(center.x + radius, center.y + radius),
                L.point(center.x - radius, center.y + radius)
            ];
            const signed_area = (first, second, third) => (
                (first.x - third.x) * (second.y - third.y) -
                (second.x - third.x) * (first.y - third.y)
            );
            const signs = [
                signed_area(point, vertices[0], vertices[1]),
                signed_area(point, vertices[1], vertices[2]),
                signed_area(point, vertices[2], vertices[0])
            ];

            return !(signs.some(value => value < 0) && signs.some(value => value > 0));
        }
    });

    L.triangleMarker = (latlng, options) => new L.TriangleMarker(latlng, options);
}

function updateMap(coordinate_index) {
    const coordinate = coordinates[coordinate_index];
    const latitude = getCoordinateValue(coordinate, 'lat', 'latitude');
    const longitude = getCoordinateValue(coordinate, 'lng', 'longitude');
    const marker_color = getCoordinateColor(coordinate);
    const marker_size = (coordinate.power < -120) ? 16 : (coordinate.power < -105) ? 26 : 35;
    const marker_shape = normalizeMarkerShape(coordinate.marker_shape);

    coordinate.color = marker_color;
    coordinate.marker_shape = marker_shape;
    ensureCoordinateMarkerLayer();
    ensureTriangleCanvasSupport();

    const create_marker = marker_shape === 'triangle' ? L.triangleMarker : L.circleMarker;
    const marker = create_marker([latitude, longitude], {
        radius: marker_size / 2,
        color: '#ffffff',
        weight: 1,
        opacity: 1,
        fillColor: marker_color,
        fillOpacity: 1,
        bubblingMouseEvents: false
    });

    const open_popup = () => {
        marker.off('click', open_popup);
        marker.bindPopup(createCoordinatePopupContent(coordinate)).openPopup();
    };
    marker.on('click', open_popup);

    coordinate_markers.push({ marker, cell_id: String(coordinate.cell_id), coordinate });
    coordinate_marker_layer.addLayer(marker);
}

function ensureCoordinateMarkerLayer() {
    if (!coordinate_marker_layer) {
        coordinate_marker_layer = L.layerGroup().addTo(map);
    }
}

function escapeHtml(value) {
    return String(value ?? '-').replace(/[&<>'"]/g, character => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
    })[character]);
}

function createCoordinatePopupContent(coordinate) {
    const latitude = getCoordinateValue(coordinate, 'lat', 'latitude');
    const longitude = getCoordinateValue(coordinate, 'lng', 'longitude');
    const cell_id = coordinate.cell_id ?? '-';
    const marker_color = getCoordinateColor(coordinate);

    return `
        <div style="min-width: 180px;">
            <strong>${escapeHtml(coordinate.text_identifier || 'Senza identificativo')}</strong><br>
            Latitude: ${escapeHtml(latitude)}<br>
            Longitude: ${escapeHtml(longitude)}<br>
            Cell ID: ${escapeHtml(cell_id)}<br>
            Power: ${escapeHtml(coordinate.power)}<br>
            MCC: ${escapeHtml(coordinate.MCC)}<br>
            MNC: ${escapeHtml(coordinate.MNC)}
        </div>
        <div class="mt-4 border-t border-slate-200 pt-3">
            <p class="mb-2 text-xs font-semibold uppercase text-slate-500">Colore Cell ID</p>
        </div>
        <form class="flex items-center gap-2" onsubmit="event.preventDefault(); changeColorByCellId(this)">
            <input type="hidden" name="cell_id" value="${escapeHtml(cell_id)}">
            <input type="color" name="color" value="${marker_color}" aria-label="Colore del Cell ID ${escapeHtml(cell_id)}" class="h-9 w-12 cursor-pointer rounded-md border border-slate-200 bg-white p-1">
            <button type="submit" class="h-9 rounded-md bg-slate-900 px-3 text-sm font-semibold text-white transition hover:bg-slate-700">Applica</button>
        </form>`;
}

function refreshCoordinates() {
    ensureCoordinateMarkerLayer();
    coordinate_marker_layer.clearLayers();
    coordinate_markers = [];

    coordinates.forEach((_, index) => updateMap(index));
    updateViewCoordinate();
    renderCellFilters();
    renderDataFilters();
    applyCellFilters();
}

function getPowerBounds() {
    const power_values = coordinates
        .map(coordinate => coordinate.power)
        .filter(value => value !== null && value !== undefined && value !== '')
        .map(Number)
        .filter(Number.isFinite);

    if (power_values.length === 0) return null;

    let minimum = Math.floor(Math.min(...power_values));
    let maximum = Math.ceil(Math.max(...power_values));
    if (minimum === maximum) {
        minimum -= 1;
        maximum += 1;
    }
    return { minimum, maximum };
}

function updatePowerFilterValue() {
    if (!powerFilterValue) return;
    powerFilterValue.textContent = power_filter_min === null || power_filter_max === null
        ? '-'
        : `${power_filter_min} - ${power_filter_max} dBm`;
}

function renderDataFilters() {
    const bounds = getPowerBounds();
    dataFilterPanel?.classList.toggle('hidden', coordinates.length === 0);

    if (!bounds || !powerFilterMin || !powerFilterMax) {
        power_filter_min = null;
        power_filter_max = null;
        power_available_min = null;
        power_available_max = null;
        powerFilterMin?.setAttribute('disabled', '');
        powerFilterMax?.setAttribute('disabled', '');
        updatePowerFilterValue();
        return;
    }

    powerFilterMin.removeAttribute('disabled');
    powerFilterMax.removeAttribute('disabled');
    powerFilterMin.min = bounds.minimum;
    powerFilterMin.max = bounds.maximum;
    powerFilterMax.min = bounds.minimum;
    powerFilterMax.max = bounds.maximum;

    const was_full_range = power_filter_min === null || power_filter_max === null || (
        power_filter_min === power_available_min && power_filter_max === power_available_max
    );
    power_available_min = bounds.minimum;
    power_available_max = bounds.maximum;

    power_filter_min = was_full_range
        ? bounds.minimum
        : Math.max(bounds.minimum, Math.min(power_filter_min, bounds.maximum));
    power_filter_max = was_full_range
        ? bounds.maximum
        : Math.max(power_filter_min, Math.min(power_filter_max, bounds.maximum));
    powerFilterMin.value = power_filter_min;
    powerFilterMax.value = power_filter_max;
    updatePowerFilterValue();
}

function getOperatorCode(mnc) {
    const numeric_mnc = Number(mnc);
    if (numeric_mnc === 1) return '01';
    if (numeric_mnc === 2) return '02';
    if (numeric_mnc === 3) return '03';
    return 'XX';
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

    cellFilterList?.replaceChildren();
    cellFilterPanel?.classList.toggle('hidden', cell_ids.length === 0);
    cellColorPanel?.classList.toggle('hidden', cell_ids.length === 0);
    clearCellFiltersButton?.classList.toggle('hidden', selected_cell_ids.size === 0);

    const previous_color_cell_id = cellColorId?.value;
    cellColorId?.replaceChildren();

    cell_ids.forEach(cell_id => {
        const marker_color = getCellIdColor(cell_id);
        const is_selected = selected_cell_ids.has(cell_id);
        const badge = document.createElement('button');

        badge.type = 'button';
        badge.className = 'cell-filter-badge';
        badge.textContent = cell_id;
        badge.setAttribute('aria-pressed', String(is_selected));
        badge.style.setProperty('--cell-color', marker_color);
        badge.style.setProperty('--cell-contrast', getContrastColor(marker_color));
        badge.addEventListener('click', () => toggleCellFilter(cell_id));
        cellFilterList?.appendChild(badge);

        const option = document.createElement('option');
        option.value = cell_id;
        option.textContent = cell_id;
        cellColorId?.appendChild(option);
    });

    if (cellColorId && cell_ids.length > 0) {
        cellColorId.value = available_cell_ids.has(previous_color_cell_id)
            ? previous_color_cell_id
            : cell_ids[0];
        cellColorValue.value = getCellIdColor(cellColorId.value);
    }
}

function toggleCellFilter(cell_id) {
    if (selected_cell_ids.has(cell_id)) {
        selected_cell_ids.delete(cell_id);
    } else {
        selected_cell_ids.add(cell_id);
    }

    renderCellFilters();
    scheduleCellFilters();
}

function scheduleCellFilters() {
    window.clearTimeout(cell_filter_timeout);
    cell_filter_timeout = window.setTimeout(() => {
        cell_filter_timeout = null;
        applyCellFilters();
    }, CELL_FILTER_DELAY);
}

function applyCellFilters() {
    window.clearTimeout(cell_filter_timeout);
    cell_filter_timeout = null;
    filtered_coordinates = [];
    ensureCoordinateMarkerLayer();

    coordinate_markers.forEach(({ marker, cell_id, coordinate }) => {
        const matches_cell_filter = selected_cell_ids.size === 0 || selected_cell_ids.has(cell_id);
        const matches_area_filter = area_filtered_coordinates === null || area_filtered_coordinates.has(coordinate);
        const power = Number(coordinate.power);
        const power_filter_is_active = power_filter_min !== null && power_filter_max !== null && (
            power_filter_min > power_available_min || power_filter_max < power_available_max
        );
        const matches_power_filter = !power_filter_is_active || (
            coordinate.power !== null && coordinate.power !== undefined && coordinate.power !== '' &&
            Number.isFinite(power) && power >= power_filter_min && power <= power_filter_max
        );
        const matches_operator_filter = selected_operator_codes.has(getOperatorCode(coordinate.MNC ?? coordinate.mnc));
        const should_be_visible = matches_cell_filter && matches_area_filter && matches_power_filter && matches_operator_filter;
        const is_visible = coordinate_marker_layer.hasLayer(marker);

        if (should_be_visible) {
            filtered_coordinates.push(coordinate);
        }

        if (should_be_visible && !is_visible) {
            coordinate_marker_layer.addLayer(marker);
        } else if (!should_be_visible && is_visible) {
            coordinate_marker_layer.removeLayer(marker);
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

function isValidHexColor(color) {
    return typeof color === 'string' && /^#[0-9a-f]{6}$/i.test(color);
}

function getCoordinateColor(coordinate) {
    return isValidHexColor(coordinate.color)
        ? coordinate.color
        : cellIdToColor(coordinate.cell_id);
}

function getCellIdColor(cell_id) {
    const coordinate = coordinates.find(item => String(item.cell_id) === String(cell_id));
    return coordinate ? getCoordinateColor(coordinate) : cellIdToColor(cell_id);
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
    coordinate_list_rendered_count = 0;

    if (coordinateList) {
        coordinateList.scrollTop = 0;
    }

    if (coordinates.length === 0) {
        coordinate_view.append(
            $('<li>', {
                class: 'px-5 py-6 text-center text-sm text-slate-400',
                text: 'Nessuna coordinata aggiunta'
            })
        );
        return;
    }

    renderNextCoordinateBatch();
}

function renderNextCoordinateBatch() {
    if (!coordinateList || coordinate_list_rendered_count >= coordinates.length) {
        return;
    }

    const fragment = document.createDocumentFragment();
    const batch_end = Math.min(
        coordinate_list_rendered_count + COORDINATE_LIST_BATCH_SIZE,
        coordinates.length
    );

    for (let index = coordinate_list_rendered_count; index < batch_end; index++) {
        fragment.appendChild(createCoordinateListItem(coordinates[index], index));
    }

    coordinateList.appendChild(fragment);
    coordinate_list_rendered_count = batch_end;
}

function createCoordinateListItem(element, index) {
        const latitude = getCoordinateValue(element, 'lat', 'latitude');
        const longitude = getCoordinateValue(element, 'lng', 'longitude');
        const identifier = element.text_identifier?.trim() || 'Senza identificativo';
        const marker_color = getCoordinateColor(element);

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
        return list_item[0];
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

    scheduleCellFilters();
}

async function changeColorByCellId(form) {
    const cell_id = String(form.elements.cell_id.value);
    const color = form.elements.color.value;

    if (!isValidHexColor(color)) return;

    const submit_button = form.querySelector('button[type="submit"]');
    submit_button?.setAttribute('disabled', '');

    try {
        const response = await fetch('/coordinates/update-color-by-cell-id', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ cell_id, color })
        });
        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(result.error || 'Errore durante il salvataggio del colore.');
        }

        let has_matching_coordinates = false;
        coordinates.forEach(coordinate => {
            if (String(coordinate.cell_id) === cell_id) {
                coordinate.color = color;
                has_matching_coordinates = true;
            }
        });

        if (has_matching_coordinates) {
            coordinate_markers.forEach(({ marker, cell_id: marker_cell_id, coordinate }) => {
                if (marker_cell_id !== cell_id) return;

                marker.setStyle({ fillColor: color });
                marker.getPopup()?.setContent(createCoordinatePopupContent(coordinate));
            });
            updateViewCoordinate();
            renderCellFilters();
        }
        showSuccessNotification('Colore salvato con successo.');
    } catch (error) {
        showErrorNotification(error.message || 'Errore durante il salvataggio del colore.');
    } finally {
        if (submit_button?.isConnected) {
            submit_button.removeAttribute('disabled');
        }
    }
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
                console.log("Coordinate Salvate con successo")
                showSuccessNotification('Coordinate salvate con successo.')
            }
        })
    }
}

async function exportFileKML(type = 0) {
    try {
        let payload_limit = 250
        let times = Math.ceil(filtered_coordinates.length / payload_limit)
        let response = ""
        let url = (type == 0) ? `/coordinates/export-file` : `/coordinates/export-file-by-cell`

        for (let i = 0; i < times; i++) {
            response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ coordinates_to_export: filtered_coordinates.slice(i * payload_limit, (i + 1) * payload_limit), status: i == (times - 1)})
            });
        }

        if (!response.ok) {
            const result = await response.json().catch(() => ({}));
            throw new Error(result.error || 'Errore durante l\'esportazione del file KML.');
        }

        const contentDisposition = response.headers.get('Content-Disposition') || '';
        const filenameMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
        const filename = filenameMatch?.[1] || 'coordinate.kml';
        const blob = await response.blob();
        const downloadUrl = URL.createObjectURL(blob);
        const downloadLink = document.createElement('a');

        downloadLink.href = downloadUrl;
        downloadLink.download = filename;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        downloadLink.remove();
        URL.revokeObjectURL(downloadUrl);
        
    } catch (error) {
        showErrorNotification(error.message || 'Errore durante l\'esportazione del file KML.');
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function cancelAll() {
    if (confirm("Sei sicuro di voler eliminare tutte le coordinate?")) {
        $.post('/coordinates/delete-coordinates-by-case-id', {}, function (res) {
            if (res.error) {
                showErrorNotification(res.error)
            } else {
                showSuccessNotification(`Coordinate eliminate con successo`)
                sleep(2000)
                window.location.reload()
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
