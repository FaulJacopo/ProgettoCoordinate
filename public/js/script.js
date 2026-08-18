
let coordinates = [];
let coordinate_view = $('#coordinate-list')

function addCoordinate(form) {
    const lat = form.latitude.value;
    const lng = form.longitude.value;

    if (lat && lng) {
        const coordinate = { lat: parseFloat(lat), lng: parseFloat(lng) };
        coordinates.push(coordinate);
        updateMap();
        updateViewCoordinate();
        form.reset();
    }
}

function updateMap() {
    console.log(coordinates[coordinates.length - 1])
    L.marker([coordinates[coordinates.length - 1].lat, coordinates[coordinates.length - 1].lng]).addTo(map)
}

function updateViewCoordinate() {
    let list_to_add = "<ul class='p-4'>"
    coordinates.forEach((element, index) => {
        list_to_add += `<li>${index + 1}. Latitude: ${element.lat} - Longitude: ${element.lng}</li>`
    });
    list_to_add += "</ul>"

    coordinate_view.html(list_to_add)
}

function loadFromCSV() {
    
}

function saveCaseCoordinates() {
    coordinates.forEach((element, index) => {
        $.post('/coordinates/save-coordinate', { lat: element.lat, lng: element.lng }, async function(res) {
            if (res.error) {
                showErrorNotification(res.error)
            } else {
                console.log(`Coordinate ${index + 1} salvata con successo!`)
            }
        })
    })
}