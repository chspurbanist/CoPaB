mapboxgl.accessToken = 'pk.eyJ1IjoiY3NwYW5vcyIsImEiOiJjbHgzMjBucjYwdjMxMm1zZDVvNjBqaGh2In0.ZYBMQvQHNg2pe34dtyPwEQ';
const host = 'https://copab.onrender.com/';
//const host = 'http://localhost:5501/';

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
        let objects = {};

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
                    if (objects[objectKey].Category === category) {
                        const objectName = objects[objectKey].Title;

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
                        if (objects[objectKey].Surface === "true") {
                            displayText = `${objects[objectKey].ID}: ${objectName} (€${objects[objectKey].Cost} /m2)`;
                        } else {
                            if (objects[objectKey].Cost > 999) {
                                displayText = `${objects[objectKey].ID}: ${objectName} (€${(objects[objectKey].Cost)/1000} k)`;
                            } else {
                                displayText = `${objects[objectKey].ID}: ${objectName} (€${objects[objectKey].Cost})`;
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
                objects = allObjects["NBS_List"];
                console.log('Parsed Excel Data:', objects);
                for (objectKey in objects) {
                    const textNum = objects[objectKey].Cost;
                    const processedTextNum = textNum.replace(/\./g, '').replace(/,/g, '.');
                    objects[objectKey].Cost = parseInt(processedTextNum,10);
                }

                if (objects) {
                    createObjectMenu(objects);
                } else {
                    console.error('NBS_List data not found in the Excel file.');
                }
            });
        });

    // #endregion CREATE NBS CHECKLIST
    
// #endregion INITIALIZE NBS DATA

// #region FUNCTIONS
    // #region APP FUNCTIONS
        // Function to update pop-up in real-time
        async function updatePolygonPopup(layer, polygonID) {
            const polygonData = polygonsArray.find(p => p.id === polygonID);
            const title = polygonData.title || 'Untitled';
            const cost = polygonData.cost || 0;
            const areaInSqKm = (polygonData.area / 1e6).toFixed(2);
            const iconsTable = await popupContent(polygonID); // Wait for the table to be generated
        
            const updatedContent = `
                <strong>Polygon ID:</strong> ${polygonID} <br>
                <strong>Title:</strong> ${title} <br>
                <strong>Cost: €</strong> ${Math.round(cost)} <br>
                <strong>Area:</strong> ${polygonData.area.toFixed(0)} m² (${areaInSqKm} km²) <br><br>
                ${iconsTable}
            `;
        
            // Update the popup content
            layer.setPopupContent(updatedContent).openPopup();
        }       

        // Function to update polygon's data
        function updatePolygonData(objectID, isChecked, area, polygonID, checkboxElement = null) {
            const polygonData = polygonsArray.find(p => p.id === polygonID);
            let areaTemp = area;
            if (objects[objectID].Surface === "false"){
                areaTemp = 1;
            }

            if (!polygonData.objects) {
                polygonData.objects = []; 
            }
        
            if (isChecked) {
                if (!polygonData.objects.includes(objectID)) {

                    const cost = (objects[objectID].Cost*areaTemp);

                    if (cost < currentBudget) {
                        polygonData.objects.push(objectID);
                    } else {
                        alert("Budget exceeded. This item will be deselected.");
                        checkboxElement.checked = false;
                        return;
                    }
                }
            } else {
                polygonData.objects = polygonData.objects.filter(obj => obj !== objectID);
            }
            polygonData.cost = 0;
            let polyCost = 0;
            let polyEco = 0, polyCity = 0, polyNat = 0, polySoc = 0;

        
            polygonData.objects.forEach(objID => {
                const objData = objects[objID];

                if (objData.Surface === "true") {
                    areaTemp = area;
                } else { 
                    areaTemp=1; 
                }
                  
                if (objData) {
                    polyCost += objData.Cost * areaTemp;
                    polyEco += objData.Economy;
                    polyCity += objData.City;
                    polyNat += objData.Nature;
                    polySoc += objData.Society  
                }
            });
        
            // Assign the recalculated cost
            polygonData.cost = polyCost;
            polygonData.economy = polyEco;
            polygonData.city = polyCity;
            polygonData.nature = polyNat;
            polygonData.society = polySoc;

        
            // Update the polygon cost display
            document.getElementById('polygonCost').innerText = `${Math.round(polygonData.cost) || 0}`;
            updateBudgetAndScore();                       
            updateGallery(objectID, isChecked);
        }
        
        // Function to update the budget and scores
        function updateBudgetAndScore() {

            let budget = initialBudget;
            let economyImpact = 0;
            let cityImpact = 0;
            let natureImpact = 0;
            let societyImpact = 0;
            
            polygonsArray.forEach(pol => {
                budget -= pol.cost;
                economyImpact += pol.economy;
                cityImpact += pol.city;
                natureImpact += pol.nature;
                societyImpact += pol.society;
            })

            currentBudget = budget;
        
            // Update the displayed budget and score values in the UI
            document.getElementById('budget').innerText = `${Math.round(budget) || 0}`;
            document.getElementById('economy').innerText = `${economyImpact || 0}`;
            document.getElementById('city').innerText = `${cityImpact || 0}`;
            document.getElementById('nature').innerText = `${natureImpact || 0}`;
            document.getElementById('society').innerText = `${societyImpact || 0}`;
        }
        

        // #region Gallery Functions
            let galleryArray = [];

            // Function to update gallery array and container
            const loadImage = (src) => {
                return new Promise((resolve, reject) => {
                    const img = new Image();
                    img.src = src;
            
                    // Event: Successfully loaded
                    img.onload = () => {
                        resolve(img); // Resolve with the loaded image
                    };
            
                    // Event: Failed to load
                    img.onerror = () => {
                        console.error(`Failed to load image: ${src}`);
                        reject(new Error(`Image failed to load: ${src}`)); // Reject with an error
                    };
                });
            };
            
            async function imgGallery(objectID) {
                console.log('Starting gallery generation for:', objectID);
            
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
            
                // Load images
                try {
                    const mainImg = await loadImage(`images/photos/${objects[objectID].Image}`);
                    const catIcon = await loadImage(`images/categories/${objects[objectID].Category}.png`);
                    const imgIcon = await loadImage(`images/icons/${objects[objectID].Icon}`);
            
                    // Set canvas dimensions and draw images
                    canvas.width = 80;
                    canvas.height = 80;
            
                    ctx.drawImage(mainImg, 0, 0, canvas.width, canvas.height);
            
                    const smallWidth = canvas.width / 3;
                    const smallHeight = canvas.height / 3;
            
                    ctx.drawImage(catIcon, 0, 0, smallWidth, smallHeight);
                    ctx.drawImage(imgIcon, 0, 0, smallWidth, smallHeight);
            
                    // Convert canvas to an image
                    const collageImage = new Image();
                    collageImage.src = canvas.toDataURL('image/png');
            
                    console.log('Generated collage image:', collageImage);
                    return collageImage;
                } catch (err) {
                    console.error('Error loading images or generating collage:', err);
                    throw err;
                }
            }
            

            async function updateGallery(objectID, isChecked) {
                console.log(galleryArray);
                const existingItem = galleryArray.find(item => item.objectID === objectID);
                console.log('existing Item: ',existingItem);
                const objectData = objects[objectID];

                if (isChecked) {
                    if (existingItem) {
                        existingItem.count += 1;
                    } else {
                        galleryArray.push({
                            objectID: objectID,
                            imageURL: `images/icons/${objectData.Icon}`, 
                            count: 1
                        });

                        try {
                            const collageImage = await imgGallery(objectID);
                            collageImage.id = `gallery-item-${objectID}`;

                            console.log('Generated collage image:', collageImage); // Debugging
                    
                            // Validate if the result is an instance of Node
                            if (collageImage instanceof Node) {
                                document.getElementById('gallery').appendChild(collageImage);
                            } else {
                                console.error('collageImage is not a valid DOM Node:', collageImage);
                            }
                        } catch (err) {
                            console.error('Error in updateGallery:', err);
                        }

                        // img.src = objectData.picture;
                        // img.alt = objectData.en; 
                        // img.id = `gallery-item-${objectID}`;
                        // img.classList.add('gallery-img');
                        // document.getElementById('gallery').appendChild(img);
                    }
                } else {
                    if (existingItem) {
                        existingItem.count -= 1;
                        if (existingItem.count === 0) {
                            galleryArray = galleryArray.filter(item => item.objectID !== objectID);
                            const img = document.getElementById(`gallery-item-${objectID}`);
                            if (img) {
                                img.remove();
                            }
                        }
                    }
                }
            }
        // #endregion Gallery Functions

    // #endregion APP FUNCTIONS

    // #region POLYGON FUNCTIONS
        //remove clear all option from delete mode
        L.EditToolbar.Delete.include({
            removeAllLayers: false
        });

        const drawnItems = new L.FeatureGroup().addTo(map);

        const drawControl = new L.Control.Draw({
        draw: {
            polyline: false,
            circle: false,
            rectangle: false,
            marker: false,
            circlemarker: false,
            polygon: {
                allowIntersection: false,
                showArea: true
            }
        },
        edit: {
            featureGroup: drawnItems 
        }
        });
        map.addControl(drawControl);

        function generateUniqueID() {
            return Math.floor(1000 + Math.random() * 9000);
        }

        // SHOW POLYGON FORM
        function showFormForPolygon(polygonID, layer) {
            const formContainer = document.getElementById('polygon-info');
            formContainer.style.display = 'block';
        
            const polygonData = polygonsArray.find(p => p.id === polygonID);
        
            if (polygonData) {
                // Show form
                document.getElementById('polygonID').innerText = polygonData.id;
                document.getElementById('area').innerText = Math.round(polygonData.area);
        
                // Clone the title field to remove old listeners
                const titleField = document.getElementById('area-title');
                const clonedTitleField = titleField.cloneNode(true);
                titleField.parentNode.replaceChild(clonedTitleField, titleField);
                clonedTitleField.value = polygonData.title || ''; // Set existing title or empty string
        
                // Clone the description field to remove old listeners
                const descriptionField = document.getElementById('description');
                const clonedDescriptionField = descriptionField.cloneNode(true);
                descriptionField.parentNode.replaceChild(clonedDescriptionField, descriptionField);
                clonedDescriptionField.value = polygonData.description || ''; // Set existing description or empty string
        
                // Clone the object menu to remove old listeners
                const objectMenu = document.getElementById('object-menu');
                const clonedObjectMenu = objectMenu.cloneNode(true);
                objectMenu.parentNode.replaceChild(clonedObjectMenu, objectMenu);
        
                // Pre-check boxes based on previously selected objects
                const checkboxes = clonedObjectMenu.querySelectorAll('input[name="objects"]');
                checkboxes.forEach(checkbox => {
                    checkbox.checked = polygonData.objects && polygonData.objects.includes(checkbox.value);
        
                    // Add a change event listener to update budget and score in real-time
                    checkbox.addEventListener('change', function() {
                        updatePolygonData(checkbox.value, checkbox.checked, polygonData.area, polygonData.id, checkbox);
                        updatePolygonPopup(layer, polygonID);
                    });
                });
        
                // Add event listeners for title and description
                clonedTitleField.addEventListener('input', function() {
                    polygonData.title = this.value;
                    updatePolygonPopup(layer, polygonID);
                });
        
                clonedDescriptionField.addEventListener('input', function() {
                    polygonData.description = this.value;
                    updatePolygonPopup(layer, polygonID);
                });
            }
        }
        

        // POLYGON POPUP CONTENT
        async function loadIcon(objectID) {        
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
        
            try {
                // Load images dynamically
                const catIcon = await loadImage(`images/categories/${objects[objectID].Category}.png`);
                const imgIcon = await loadImage(`images/icons/${objects[objectID].Icon}`);
        
                // Set canvas dimensions
                canvas.width = 30;
                canvas.height = 30;
        
                // Draw images
                ctx.drawImage(catIcon, 0, 0, canvas.width, canvas.height);
                ctx.drawImage(imgIcon, 0, 0, canvas.width, canvas.height);
        
                // Convert canvas to an Image object
                const collageImage = new Image();
                collageImage.src = canvas.toDataURL('image/png');
        
                return collageImage; // Return the Image object
            } catch (err) {
                console.error('Error loading icons for objectID:', objectID, err);
                throw err;
            }
        }     
        
        async function popupContent(polygonID) {
            const polygonData = polygonsArray.find(p => p.id === polygonID);
            const objectsList = polygonData.objects;
            let objectsTable = '<table>';
        
            if (objectsList && objectsList.length > 0) {
                try {
                    // Resolve all icon promises
                    const icons = await Promise.all(
                        objectsList.map(async objID => {
                            try {
                                const iconImg = await loadIcon(objID); // Wait for the image
                                return `<td><img src="${iconImg.src}" width="30" height="30" alt="${objID}"></td>`;
                            } catch (err) {
                                console.error(`Error generating icon for object ${objID}:`, err);
                                return '<td>Error</td>';
                            }
                        })
                    );
        
                    // Build the table
                    icons.forEach((icon, index) => {
                        if (index % 5 === 0) objectsTable += '<tr>'; // New row every 5 items
                        objectsTable += icon; // Add resolved icon
                        if (index % 5 === 4 || index === icons.length - 1) objectsTable += '</tr>';
                    });
                } catch (err) {
                    console.error('Error resolving icons:', err);
                    objectsTable += '<tr><td>Error loading icons</td></tr>';
                }
            } else {
                objectsTable += '<tr><td>No objects selected</td></tr>';
            }
        
            objectsTable += '</table>';
            return objectsTable; // Return the generated table
        }        
        
        // #region LEAFLET CONTROLS

            let polygonsArray = [];
        
            // DRAW POLYGON

            function drawPolygon(layer) {
                drawnItems.addLayer(layer);

                const polygon = layer.toGeoJSON();        
                const area = turf.area(polygon);
                const areaInSqKm = (area / 1e6).toFixed(2); // Convert from sq. meters to sq. kilometers for display

                let polygonID;
                
                if (layer.polygonID){
                    polygonID = layer.polygonID;
                } else {
                    polygonID = generateUniqueID();
                    layer.polygonID = polygonID;
                }         
                
                // Assign the polygonID to the layer for easy reference later
                polygonsArray.push({
                    id: polygonID,
                    title: null,
                    description: null,
                    coordinates: polygon.geometry.coordinates, 
                    area: area,
                    cost: 0,
                    economy: 0,
                    city: 0,
                    nature: 0,
                    society: 0,
                    objects: []                               
                });

                // Add a tooltip that displays the polygon ID
                layer.bindTooltip(`${polygonID}`, {
                    permanent: true,      // Always show the label
                    direction: "center",  // Position in the center
                    className: "polygon-label" // Custom class for styling
                }).openTooltip();

                // Initially bind a basic popup
                layer.bindPopup(`
                    <strong>Polygon ID:</strong> ${polygonID} <br> 
                    <strong>Area:</strong> ${area.toFixed(0)} m² (${areaInSqKm} km²)
                `);
            
                layer.on('click', function () {
                    handlePolygonClick(layer, polygonID);                     
                });

                layer.on('popupclose', function(){
                    const formContainer = document.getElementById('polygon-info');
                    formContainer.style.display='none';
                })

                console.log(polygonsArray);
            }

            map.on(L.Draw.Event.CREATED, function (event) {
                const layer = event.layer;
                drawPolygon(layer);
            });

            // DELETE POLYGON
            let isDeletionMode = false;
            let deletedPolygons = [];

            // Event: When deletion mode starts
            map.on(L.Draw.Event.DELETESTART, function () {
                isDeletionMode = true;
                deletedPolygons = [];
            });

            // Event: When deletion mode stops (SAVED OR CANCELED)
            map.on(L.Draw.Event.DELETESTOP, function () {
                if (isDeletionMode) {  //enters only if canceled
                    deletedPolygons.forEach(pol => {
                        tempPolygonDelete(pol[0], true);
                    })
                }
                isDeletionMode = false;
            });

            map.on(L.Draw.Event.DELETED, function (event) {
                const layers = event.layers;  // 'event.layers' is a collection of layers
            
                // Iterate over each layer (polygon) that was deleted
                layers.eachLayer(function (layer) {
                    const polygonID = layer.polygonID;  // Get the polygon ID associated with this layer
            
                    if (polygonID) {
                        deletePolygons(deletedPolygons, layer);
                    }
                });
            
                isDeletionMode = false;
            });

            // Function to handle polygon clicks
            function handlePolygonClick(layer, polygonID) {
                if (isDeletionMode) {
                    const polygonData = polygonsArray.find(p => p.id === polygonID);
                    deletedPolygons.push([polygonID, polygonData.area, polygonData.objects]);
                    tempPolygonDelete(polygonID, false);
                } else {
                    showFormForPolygon(polygonID, layer);
                    updatePolygonPopup(layer, polygonID);
                }
            }

            // Function to illustrate the results of deleted polygon before finalizing
            function tempPolygonDelete(polygonID, isCanceled) {
                const tempPolygonData = deletedPolygons.find(p => p[0] === polygonID);
                tempPolygonData[2].forEach(obj => {
                    updatePolygonData(obj, isCanceled, tempPolygonData[1], tempPolygonData[0], null);
                })
            }
            
            // Function to delete a polygon (called when deletion is confirmed)
            function deletePolygons(deletedPolygons, layer) {
                for (let i = 0; i < deletedPolygons.length; i++) {
                    const polygonID = deletedPolygons[i][0];
                    const polygonData = polygonsArray.find(p => p.id === polygonID);
                    if (polygonData) {
                        // Remove the polygon data from polygonsArray
                        polygonsArray = polygonsArray.filter(p => p.id !== polygonID);
    
                        // Update budget, scores, and gallery
                        polygonData.objects.forEach(obj => {
                            updatePolygonData(obj, false, polygonData.area, polygonID, null);
                        });
    
                        // Remove the layer (polygon) from the map
                        map.removeLayer(layer);
                    }
                }
            }

            // EDIT POLYGON
            // Override the deprecated _flat method with the new isFlat method
            if (L.Polyline._flat) {
                L.Polyline._flat = L.LineUtil.isFlat;
            }

            // Log all shapes in drawnItems
            function updateGameStats() {
                drawnItems.eachLayer(function (layer) {
                    if (layer instanceof L.Polygon || layer instanceof L.Polyline || layer instanceof L.Circle) {
                        const shapeType = layer instanceof L.Polygon ? 'Polygon' : layer instanceof L.Circle ? 'Circle' : 'Polyline';

                        const polygonID = layer.polygonID;  // Assuming you stored polygonID in the layer
                        const shapeGeoJSON = layer.toGeoJSON();  // Get the GeoJSON representation of the layer
                        const newArea = turf.area(shapeGeoJSON);
                        const polygonData = polygonsArray.find(p => p.id === polygonID);
                        polygonData.area = newArea;
                        const objs = polygonData.objects;
                        objs.forEach(obj => {
                            updatePolygonData(obj, true, polygonData.area, polygonID, null);
                        })
                    }
                });
            }

            // When editing is completed (and save is clicked)
            map.on(L.Draw.Event.EDITED, function (event) {
                updateGameStats();
                if (currentBudget < 0) {
                    window.alert("ATTENTION: The budget is below zero!");
                } 
            });

        // #endregion LEAFLET CONTROLS

    // #endregion POLYGON FORM

    // #region MAP DATA

        // 360 image data with coordinates and image URLs
        const imageLocations = [
            { coordinates: [35.141958, 33.337419], imageUrl: 'Strovolos/Pedieos-1.png'},

            { coordinates: [35.142603, 33.338808], imageUrl: 'Strovolos/Pedieos-2.png'},  //strovolos park (path)
            { coordinates: [35.142894, 33.339485], imageUrl: 'Strovolos/Pedieos-2a.png'}, //strovolos park (path)
            { coordinates: [35.142865, 33.338722], imageUrl: 'Strovolos/Pedieos-2b.png'}, //strovolos park (street)
            { coordinates: [35.143153, 33.339364], imageUrl: 'trovolos/Pedieos-2c.png'}, //strovolos park (street)
            { coordinates: [35.142904, 33.339095], imageUrl: 'Strovolos/Pedieos-2d.png'}, //strovolos park (middle)
        
            { coordinates: [35.143217, 33.340265], imageUrl: 'Strovolos/Pedieos-3.png'}, //alexandroupoleos left path
            { coordinates: [35.143313, 33.339984], imageUrl: 'Strovolos/Pedieos-3a.png'}, //alexandroupoleos left street
            { coordinates: [35.143454, 33.340344], imageUrl: 'Strovolos/Pedieos-3b.png'}, //alexandroupoleos left park
            { coordinates: [35.143415, 33.339660], imageUrl: 'Strovolos/Pedieos-3c.png'}, //alexandroupoleos left top street

            { coordinates: [35.143607, 33.341372], imageUrl: 'Strovolos/Pedieos-4.png'},
            { coordinates: [35.143715, 33.340680], imageUrl: 'Strovolos/Pedieos-4a.png'}, //alexandroupoleos right street

            { coordinates: [35.144195, 33.342549], imageUrl: 'Strovolos/Pedieos-5.png'}, //passage
            { coordinates: [35.144121, 33.341306], imageUrl: 'Strovolos/Pedieos-5a.png'}, //passage left
            { coordinates: [35.144360, 33.341847], imageUrl: 'Strovolos/Pedieos-5b.png'}, //passage middle
            { coordinates: [35.144540, 33.342242], imageUrl: 'Strovolos/Pedieos-5c.png'}, //passage right
            
            { coordinates: [35.144601, 33.343712], imageUrl: 'Strovolos/Pedieos-6.png'}, // bridge left
            { coordinates: [35.144444, 33.343154], imageUrl: 'Strovolos/Pedieos-6a.png'}, // bridge left +
            { coordinates: [35.144651, 33.343376], imageUrl: 'Strovolos/Pedieos-6b.png'}, // bridge left middle
            { coordinates: [35.144804, 33.343647], imageUrl: 'Strovolos/Pedieos-6c.png'}, // bridge left under

            { coordinates: [35.144848, 33.344086], imageUrl: 'Strovolos/Pedieos-7.png'}, // bridge right
            { coordinates: [35.144926, 33.343931], imageUrl: 'Strovolos/Pedieos-7a.png'}, // bridge right middle
            { coordinates: [35.145189, 33.344120], imageUrl: 'Strovolos/Pedieos-7b.png'}, // bridge right middle    

            { coordinates: [35.145247, 33.344387], imageUrl: 'Strovolos/Pedieos-8.png'},
            { coordinates: [35.146067, 33.344751], imageUrl: 'Strovolos/Pedieos-9.png'},
            { coordinates: [35.147247, 33.344928], imageUrl: 'Strovolos/Pedieos-10.png'},
            { coordinates: [35.148347, 33.345354], imageUrl: 'Strovolos/Pedieos-11.png'},
            { coordinates: [35.148854, 33.345584], imageUrl: 'Strovolos/Pedieos-12.png'},
        ];

        // Function to add circle markers for 360 images
        imageLocations.forEach(location => {
            const marker = L.circleMarker(location.coordinates, {
                color: '#ff7800',
                radius: 5
            }).addTo(map);

            marker.on('click', function () {
                // Create the popup content
                // map.off('click',objectPlacing);
                const popupContent = `
                    <div class="popup-content">
                        <div id="panorama"></div>
                    </div>
                `;

                marker.bindPopup(popupContent, {
                    maxWidth: 600,   
                    minWidth: 400,   
                    maxHeight: 400   
                }).openPopup();
            });

            marker.on('popupopen', function () {       
                const imageHurl = `${host}assets/360photos/${location.imageUrl}`;   

                setTimeout(function () {
                    const panoElement = document.getElementById('panorama');
                    if (panoElement) {
                        const viewer = pannellum.viewer('panorama', {
                            "type": "equirectangular",
                            "panorama": imageHurl,
                            "autoLoad": true
                        });
                        marker.viewerInstance = viewer;
                    } else {
                        console.error('Panorama container not found.');
                    }
                }, 100); 
            });

            marker.on('popupclose', function () {
                if (marker.viewerInstance) {
                    marker.viewerInstance.destroy();  
                    marker.viewerInstance = null;     
                }
            })
        });

        // Function to fetch and load the CSV automatically on page load
        const sourceProj = "+proj=utm +zone=36 +datum=WGS84 +units=m +no_defs";  // UTM Zone 36N
        const destProj = "EPSG:4326";  // Latitude/Longitude projection (EPSG:4326)

        function convertToLatLng(utmCoords) {
            // Use proj4 to convert UTM to Lat/Lng
            return proj4(sourceProj, destProj, utmCoords);
        }
        
        function parseWktPolygon(wkt) {
            // Strip the "POLYGON ((" and "))" parts
            let coordinatesString = wkt.replace("POLYGON ((", "").replace("))", "");
        
            // Split the coordinates string into individual coordinate pairs
            let coordinates = coordinatesString.split(",").map(function(pair) {
                let coords = pair.trim().split(" ");
                let utmCoords = [parseFloat(coords[0]), parseFloat(coords[1])];  // UTM coordinates
        
                // Convert UTM to Lat/Lng
                let latLng = convertToLatLng(utmCoords);
                return [latLng[1], latLng[0]];  // Lat/Lng format for Leaflet (Lat, Lng)
            });
        
            // Return an array of coordinates as a Leaflet-compatible Polygon
            return L.polygon([coordinates], {
                color: 'orange',
                weight: 1.5,  
                fillOpacity: 0.05,
                interactive: false 
            });
        }

        window.onload = function() {
            const csvFileUrl = 'assets/intervention_area.csv'; // Path to your CSV file
        
            fetch(csvFileUrl)
                .then(response => response.text())
                .then(data => {
                    Papa.parse(data, {
                        header: true,
                        complete: function(results) {
                            const data = results.data;
                            data.forEach(function(row) {
                                const wkt = row.WKT;
                                const fid = row.fid;
                                const aa = row["A/A"]; // Assuming this is an additional column
        
                                if (wkt && wkt.startsWith("POLYGON")) {
                                    try {
                                        // Manually parse WKT and convert it to Leaflet Polygon
                                        const areaLeafletPolygon = parseWktPolygon(wkt);
                                        // Add polygon to the map 
                                        areaLeafletPolygon.addTo(map);
                                    } catch (error) {
                                        console.error(`Error processing WKT for FID ${fid}:`, error);
                                    }
                                }
                            });
                        }
                    });
                })
                .catch(error => {
                    console.error("Error loading the CSV file:", error);
                });
        };

    //#endregion MAP DATA

// #endregion FUNCTIONS

// #region LOCATION

    // Globaly define marker (not in the function)
    let LocMarker = null;

    // Function to handle location search
    async function searchLocation() {
        const query = document.getElementById('location-search').value;
        if (query.length < 3) return;

        const response = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?access_token=${mapboxgl.accessToken}`);
        const data = await response.json();

        const suggestions = document.getElementById('suggestions');
        suggestions.innerHTML = '';
        data.features.forEach(feature => {
            const li = document.createElement('li');
            li.textContent = feature.place_name;
            li.onclick = () => {
                const latlng = [feature.geometry.coordinates[1], feature.geometry.coordinates[0]];
                map.setView(latlng, 17); // Adjusted zoom level

            // Remove existing marker if present
            if (LocMarker) {
                map.removeLayer(LocMarker);
            }
            
            // Add a new marker at the selected location
                LocMarker = L.marker(latlng).addTo(map).bindPopup(feature.place_name).openPopup();
                
                suggestions.innerHTML = '';
                document.getElementById('location-search').value = '';
            };
            suggestions.appendChild(li);
        });
    }

    // Function to move to a specific location from the suggestions
    function moveToLocation(value) {
        const [lat, lng] = value.split(',').map(Number);
        map.setView([lat, lng], 15); // Adjusted zoom level
    }

    let savedLocations = [];

    function saveLocation() {
        const currentView = map.getCenter();
        const currentZoom = map.getZoom();
        const locationName = prompt("Enter a name for this location:");
        
        if (locationName) {
            const location = {
                name: locationName,
                lat: currentView.lat,
                lng: currentView.lng,
                zoom: currentZoom
            };
            savedLocations.push(location);
            updateSavedLocationsDropdown();
        }
    }

    function updateSavedLocationsDropdown() {
        const savedLocationsDropdown = document.getElementById('saved-locations');
        savedLocations.forEach((location, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = location.name;
            savedLocationsDropdown.appendChild(option);
        });
    }

    // Function to go to a saved location
    function goToSavedLocation() {
        const dropdown = document.getElementById('saved-locations');
        const selectedLocation = dropdown.value;
        if (selectedLocation) {
            const location = savedLocations[selectedLocation];
            map.setView([location.lat, location.lng], location.zoom);
            // Reset the dropdown label to 'Select location'
            dropdown.selectedIndex = 0;
        }
    }

// #endregion LOCATION


