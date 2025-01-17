mapboxgl.accessToken = 'pk.eyJ1IjoiY3NwYW5vcyIsImEiOiJjbHgzMjBucjYwdjMxMm1zZDVvNjBqaGh2In0.ZYBMQvQHNg2pe34dtyPwEQ';
// const host = 'https://copab.onrender.com/';
const host = 'http://localhost:5501/';

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

// #region BUTTONS

    // #region INFO BUTTON

        // Get elements
        const openInfoPopup = document.getElementById('openPopup');
        const colseInfoPopup = document.getElementById('closePopup');
        const infoPopup = document.getElementById('popup');
        const overlay = document.getElementById('overlay');

        // Open popup event
        openInfoPopup.addEventListener('click', () => {
            infoPopup.style.display = 'block';
            overlay.style.display = 'block';
        });

        // Close popup event
        colseInfoPopup.addEventListener('click', () => {
            infoPopup.style.display = 'none';
            overlay.style.display = 'none';
        });

        // Close popup when clicking on the overlay
        overlay.addEventListener('click', () => {
            infoPopup.style.display = 'none';
            overlay.style.display = 'none';
        });

    // #endregion INFO BUTTON

    // #region OPENCATALOGUE

        let pdfDoc = null,
        currentPage = 1,
        totalPages = 0,
        pdfCanvas = document.getElementById('pdf-canvas'),
        ctx = pdfCanvas.getContext('2d');

        // Open and close modal
        const openPdfViewerBtn = document.getElementById('open-pdf-viewer');
        const closePdfViewerBtn = document.getElementById('close-pdf-viewer');
        const pdfViewerModal = document.getElementById('pdf-viewer-modal');

        openPdfViewerBtn.addEventListener('click', function() {
            pdfViewerModal.style.display = 'flex';  // Show the modal
            loadPDF(`images/catalogues/NBScards-${languageCode}.pdf`);   // Load the PDF
        });

        closePdfViewerBtn.addEventListener('click', function() {
            pdfViewerModal.style.display = 'none';  // Hide the modal
        });

        // Load the PDF document
        function loadPDF(pdfUrl) {
            pdfjsLib.getDocument(pdfUrl).promise.then(function(pdfDoc_) {
                pdfDoc = pdfDoc_;
                totalPages = pdfDoc.numPages;
                renderPage(currentPage);
            });
        }

        // Render a specific page of the PDF
        function renderPage(pageNumber) {
            pdfDoc.getPage(pageNumber).then(function(page) {
                const viewport = page.getViewport({ scale: 1.5 });  // Adjust scale as needed
                pdfCanvas.width = viewport.width;
                pdfCanvas.height = viewport.height;

                const renderContext = {
                    canvasContext: ctx,
                    viewport: viewport
                };
                page.render(renderContext);
            });
        }

        // Next and Previous page buttons
        document.getElementById('next-page').addEventListener('click', function() {
            if (currentPage < totalPages) {
                currentPage++;
                renderPage(currentPage);
            }
        });

        document.getElementById('prev-page').addEventListener('click', function() {
            if (currentPage > 1) {
                currentPage--;
                renderPage(currentPage);
            }
        });

    // #endregion OPENCATALOGUE

    // #region HOME BUTTON

        function homeBtn() {   
            var confirmMessage; 
            if (languageCode === 'en') {
                confirmMessage = "Going to homepage will erase your scenario. Are you sure you want to proceed?";
            } else if (languageCode === 'el') {
                confirmMessage = "Για να πάτε στη αρχική σελίδα το σενάριο σας θα διαγραφεί. Είστε σίγουροι ότι θέλετε να προχωρήσετε;";
            }

            var confirmChange = window.confirm(confirmMessage);
            
            if (confirmChange) {
                window.location.href = 'index.html';
            } 
        }

    // #endregion HOME BUTTON

    // #region RESET BUTTON
        function resetGame() {
            
            var confirmMessage; 
            if (languageCode === 'en') {
                confirmMessage = "Are you sure, you want to reset the game? All changes will be discarded.";
            } else if (languageCode === 'el') {
                confirmMessage = "Είστε σίγουροι ότι θέλετε να επανεκκινήσετε το παιχνίδι; Όλες οι αλλαγές σας θα διαγραφούν.";
            }

            var confirmChange = window.confirm(confirmMessage);
            
            if (confirmChange) {
                location.reload();          
            }
    
        }

    // #endregion RESET BUTTON

    // #region IMPORT CSV

        // Function to handle the import process
        
        function setInitialBudget() {

            const budgetInput = document.getElementById('initial-budget-input').value;
            const submitBtn = document.getElementById('submitBtn');
            
            // Validate the budget input
            if (isNaN(budgetInput) || budgetInput < 20000 || budgetInput > 100000) {
                alert("Please enter a valid budget!");
            } else {
                initialBudget = Number(budgetInput);
                document.getElementById('budget').innerText = `${initialBudget}`;

                document.getElementById('initial-budget-input').disabled = true;
                submitBtn.disabled = true;
                submitBtn.style.cursor = "not-allowed";
                submitBtn.style.backgroundColor = "#ccc";
                submitBtn.style.color = "#666";
                submitBtn.innerText = 'Submitted';      
            }

            budget = initialBudget;
            currentBudget = budget;
        }
        
        async function importScenario() {
            try {
                const [fileHandle] = await window.showOpenFilePicker({
                    types: [{
                        description: 'ZIP File',
                        accept: { 'application/zip': ['.zip'] }
                    }],
                    multiple: false
                });
        
                const file = await fileHandle.getFile();
                const zip = new JSZip();
                const reader = new FileReader();
        
                reader.onload = async function(event) {
                    try {
                        const arrayBuffer = event.target.result;
                        const zipContent = await zip.loadAsync(arrayBuffer);
        
                        if (zipContent.files['initialBudget.json']) {
                            const initialBudgetFile = zipContent.files['initialBudget.json'];
                            const initialBudgetData = await initialBudgetFile.async("string");
                            const importedBudget = JSON.parse(initialBudgetData);
                            initialBudget = Number(importedBudget.initialBudget);
                            const budgetInputElement = document.getElementById('initial-budget-input');
                            budgetInputElement.value = initialBudget;
                            setInitialBudget();
                        }
        
                        if (zipContent.files['polygons.json']) {
                            const polygonsFile = zipContent.files['polygons.json'];
                            const polygonsData = await polygonsFile.async("string");
                            processPolygonData(JSON.parse(polygonsData));
                        }
        
                        if (zipContent.files['locations.json']) {
                            const locationsFile = zipContent.files['locations.json'];
                            const locationsData = await locationsFile.async("string");
                            processLocationData(JSON.parse(locationsData));
                        }
        
                    } catch (error) {
                        console.error("Error processing zip file:", error);
                    }
                };
        
                // Error handling for reading the file as ArrayBuffer
                reader.onerror = function(event) {
                    console.error("File could not be read! Error:", event.target.error);
                };
        
                reader.readAsArrayBuffer(file); // Read as ArrayBuffer
        
            } catch (error) {
                console.error("Error reading ZIP file:", error);
            }
        }
        
              
        function processPolygonData(polygons) {
            console.log("Processing polygon data:", polygons);
            polygons.forEach(polygon => {

                const polCoords = polygon.coordinates[0];

                console.log('PolCoords: ', polCoords);
                const NewPolCoords = polCoords.map(coord => [coord[1], coord[0]]);
                const layer = L.polygon(NewPolCoords);

                console.log('Layer: ', layer);
                drawnItems.addLayer(layer);

                layer.polygonID = polygon.id;
                drawPolygon(layer);

                const polygonData = polygonsArray.find(p => p.id === polygon.id)
                polygonData.title = polygon.title;
                polygonData.description = polygon.description;

                const objs = polygon.objects;
                objs.forEach(obj => {
                    updatePolygonData(obj, true, polygon.area, polygon.id, null);
                })
            })
        }

        function processLocationData(locations) {
            locations.forEach(location => {
                savedLocations.push({
                    name: location.name,
                    lat: location.lat,
                    lng: location.lng,
                    zoom: location.zoom,
                });     
            })
            updateSavedLocationsDropdown();
        }

    // #endregion IMPORT CSV   

    // #region EXPORT CSV

        async function saveScenario() {
            const zip = new JSZip();
    
            // Save polygon data as JSON
            const polygonsData = JSON.stringify(polygonsArray); 
            zip.file('polygons.json', polygonsData);
            
            // Save locations data if any
            const locationsData = JSON.stringify(savedLocations); 
            zip.file('locations.json', locationsData);

            const initialBudgetData = JSON.stringify({ initialBudget }); 
            zip.file('initialBudget.json', initialBudgetData);
          
            // Generate the zip file and download it
            const content = await zip.generateAsync({ type: 'blob' });
            saveAs(content, 'CoPaB-scenario.zip');
        }

    // #endregion EXPORT CSV

// #endregion BUTTONS

// #region INITIALIZE NBS DATA

   // #region READ XLSX Data

        const allObjects = {};

        function fetchAndProcessExcel() {
            const filePath = `assets/NBS-files/NBSList-${languageCode}.xlsx`; // Path to your Excel file

            return fetch(filePath)
                .then((response) => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                    return response.arrayBuffer(); // Read file as ArrayBuffer
                })
                .then((data) => {
                    // Parse the Excel data
                    const workbook = XLSX.read(data, { type: 'array' });

                    // Get the first sheet's name and data
                    const sheetName = workbook.SheetNames[0];
                    const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
                    allObjects[sheetName] = sheetData;

                    // Log the parsed data for debugging
                    console.log('Parsed Excel Data:', allObjects);

                    return allObjects; // Return the parsed data
                })
                .catch((error) => {
                    console.error('Error fetching or processing Excel file:', error);
                });
        }

    // #endregion READ XLSX Data

    // #region CREATE NBS CHECKLIST

        // List of categories that are visible in the UI
        const categories = {
            Participatory: { en: 'Participatory', el: 'Συμμετοχικές' },
            Technological: { en: 'Technological', el: 'Τεχνολογικές' },
            Territorial: { en: 'Territorial', el: 'Χωρικές' },
        };

        function createObjectMenu(objects) {
            const menuContainer = document.getElementById('object-menu');
            console.log('Creating Objects Menu');

            for (const category in categories) {
                const categoryValue = categories[category][languageCode];

                // Create a container for the category heading and icon
                const categoryHeading = document.createElement('h4');
                categoryHeading.classList.add('category-heading');

                const img = document.createElement('img');
                img.setAttribute('src', `images/categories/${category}.png`);
                img.classList.add('category-icon');

                // Append the icon and category text to the heading
                categoryHeading.appendChild(img);
                categoryHeading.appendChild(document.createTextNode(categoryValue));

                // Append the category heading to the menu container
                menuContainer.appendChild(categoryHeading);

                // Iterate over the objects and create a checkbox for each
                for (const objectKey in objects) {
                    console.log(objects[objectKey][category]);
                    if (objects[objectKey].category === category) {
                        const objectName = objects[objectKey][languageCode];

                        // Create a div to contain each checkbox and label for inline alignment
                        const optionContainer = document.createElement('div');
                        optionContainer.classList.add('checkbox-container');

                        // Create the checkbox input
                        const checkbox = document.createElement('input');
                        checkbox.type = 'checkbox';
                        checkbox.name = 'objects';
                        checkbox.value = objectKey;
                        checkbox.classList.add('object-checkbox');
                        let displayText = '';

                        // Create the display text for the checkbox option
                        if (objects[objectKey].surface === true) {
                            displayText = `${objectKey}: ${objectName} (€${objects[objectKey].cost} /m2)`;
                        } else {
                            if (objects[objectKey].cost > 999) {
                                displayText = `${objectKey}: ${objectName} (€${(objects[objectKey].cost) / 1000} k/p.)`;
                            } else {
                                displayText = `${objectKey}: ${objectName} (€${objects[objectKey].cost} /p.)`;
                            }
                        }

                        // Append checkbox and text to the container, then add to menuContainer
                        optionContainer.appendChild(checkbox);
                        optionContainer.appendChild(document.createTextNode(displayText));
                        menuContainer.appendChild(optionContainer);
                    }
                }

                // Add space between categories
                menuContainer.appendChild(document.createElement('br'));
            }
        }

        // Fetch data and create the menu after the data is loaded
        document.addEventListener('DOMContentLoaded', () => {
            fetchAndProcessExcel().then(() => {
                const objects = allObjects["NBS_List"];
                if (objects) {
                    createObjectMenu(objects);
                } else {
                    console.error('NBS_List data not found in the Excel file.');
                }
            });
        });

    // #endregion CREATE NBS CHECKLIST



// #endregion INITIALIZE NBS DATA