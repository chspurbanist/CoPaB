mapboxgl.accessToken = 'pk.eyJ1IjoiY3NwYW5vcyIsImEiOiJjbHgzMjBucjYwdjMxMm1zZDVvNjBqaGh2In0.ZYBMQvQHNg2pe34dtyPwEQ';
const host = 'https://copab.onrender.com/';

const currentURL = window.location.pathname;
const currentLanguage = currentURL.split("/").pop();
const languageCode = currentLanguage.match(/-(\w{2})\./)[1];

// #region INITIALIZE MAP

    // Map Constants
    const initialLatLng = [35.143732, 33.343011]; 
    const initialZoom = 17; 
    let initialBudget = 0;
    let budget = 0;
    let currentBudget = 0;

    const map = L.map('map', {
        editable: true,
        maxZoom: 25,
        closePopupOnClick: false
    }).setView(initialLatLng, initialZoom);

    // Function to create a new Mapbox tile layer
    function createTileLayer(style) {
        return L.tileLayer(`https://api.mapbox.com/styles/v1/mapbox/${style}/tiles/{z}/{x}/{y}?access_token=${mapboxgl.accessToken}`, {
            tileSize: 512,
            zoomOffset: -1,
            maxZoom: 25,
            attribution: '© Mapbox'
        });``
    }

    // Add initial tile layer
    let currentLayer = createTileLayer('streets-v11').addTo(map);

    // Handle style change
    document.getElementById('mapStyleSelector').addEventListener('change', function(e) {
        const selectedStyle = e.target.value;
        map.removeLayer(currentLayer); // Remove the current layer
        currentLayer = createTileLayer(selectedStyle); // Create and add the new layer
        currentLayer.addTo(map);
    });

// #endregion INITIALIZE MAP