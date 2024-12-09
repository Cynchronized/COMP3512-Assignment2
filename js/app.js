document.addEventListener("DOMContentLoaded", (e) => {
    const seasonSelect = document.querySelector('#season-select');
    const races = document.querySelector('#races');
    const home = document.querySelector('#home');
    const raceResults = document.querySelector('#raceResults');
    const spinner = document.querySelector('#spinner');
    const F1Logo = document.querySelector('#f1-logo');
    let raceURL = "https://www.randyconnolly.com/funwebdev/3rd/api/f1/races.php?season="
    let resultsURL = "https://www.randyconnolly.com/funwebdev/3rd/api/f1/results.php?season="
    let qualifyingURL = "https://www.randyconnolly.com/funwebdev/3rd/api/f1/qualifying.php?season="
    const driverCloseButton = document.querySelector("#driver-dialog-close");
    const constructorCloseButton = document.querySelector("#constructor-dialog-close");
    const circuitCloseButton = document.querySelector('#circuit-dialog-close')


    // Drop-down check if user selects season
    seasonSelect.addEventListener('change', (event) => {
        const selectedSeason = event.target.value;

        if (selectedSeason) {
            home.classList.add('hidden');
            races.classList.toggle('hidden');
            // Check local storage for data
            const raceData = JSON.parse(localStorage.getItem(`${selectedSeason}-races`));

            // If not in local storage invoke fetch API call
            if(!raceData) {
                showSpinner()

                fetchSeasonData(selectedSeason)
                    .then(([races, results, qualifying]) => {
                        displayRaces(races);
                        // Store all data in local storage
                        localStorage.setItem(`${selectedSeason}-races`, JSON.stringify(races));
                        localStorage.setItem(`${selectedSeason}-results`, JSON.stringify(results));
                        localStorage.setItem(`${selectedSeason}-qualifying`, JSON.stringify(qualifying));
                    })
                    .catch(err => {
                        console.error('Error fetching season data', err)
                    })
                    .finally(() => {
                        hideSpinner();
                    })
            } else {
                displayRaces(raceData)
            }
        }
    });

    // Fetch call to get Season Data
    async function fetchSeasonData(season) {
        try {
            const [races, results, qualifying] = await Promise.all([
                fetch(raceURL + season).then(res => {
                    if (!res.ok) throw new Error(`Races fetch failed for season ${season}`);
                    return res.json();
                }),
                fetch(resultsURL + season).then(res => {
                    if (!res.ok) throw new Error(`Results fetch failed for season ${season}`);
                    return res.json();
                }),
                fetch(qualifyingURL + season).then(res => {
                    if (!res.ok) throw new Error(`Qualifying fetch failed for season ${season}`);
                    return res.json();
                })
            ]);

            return [races, results, qualifying];
        } catch (error) {
            console.error('Error in fetchSeasonData:', error);
        }
    }

    // Display Results of a season
    function displayRaces(raceData) {
        const yearDisplay = document.querySelector("#race-year-display");
        const tableBody = document.querySelector("#races-display");

        // Clear previous table content
        tableBody.innerHTML = '';

        if (Array.isArray(raceData) && raceData.length > 0) {
            const { year } = raceData[0];
            yearDisplay.textContent = year ? `${year} Season` : 'No valid year data';

            // Generate and display races
            raceData.forEach(race => {
                const tableRow = createRaceRow(race, year);
                tableBody.appendChild(tableRow);
            });
        } else {
            yearDisplay.textContent = 'No races found';
        }
    }

    // Race information when user selects race
    function displayRaceInfo(raceId, raceYear) {
        const list = document.querySelector("#race-info");
        list.innerHTML = ''; // Clear previous content
        const raceInfo = JSON.parse(localStorage.getItem(`${raceYear}-races`)).filter(r => r.id === raceId);

        const raceDetails = [
            { label: 'Round', value: raceInfo[0].round },
            { label: 'Year', value: raceInfo[0].year },
            { label: 'Circuit', value: raceInfo[0].circuit.name, underline: true, circuitId: raceInfo[0].circuit.id },
            { label: 'Date', value: raceInfo[0].date },
        ];

        raceDetails.forEach(r => {
            const li = document.createElement('li');
            li.className = 'flex items-center text-sm text-gray-700';

            const labelSpan = document.createElement('span');
            labelSpan.className = 'font-semibold mr-2 text-gray-900';
            labelSpan.textContent = `${r.label}:`;

            const valueSpan = document.createElement('span');
            valueSpan.textContent = r.value;

            // Underline the circuit value
            if (r.underline) {
                valueSpan.classList.add('underline', 'hover:cursor-pointer', 'hover:opacity-50');
                valueSpan.addEventListener('click', () => openCircuitDialog(r.circuitId))
            }

            li.appendChild(labelSpan);
            li.appendChild(valueSpan);
            list.appendChild(li);
        });

        // Add URL with a link
        if (raceInfo[0].url) {
            const urlLi = document.createElement('li');
            urlLi.className = 'flex items-center text-sm text-gray-700';

            const labelSpan = document.createElement('span');
            labelSpan.className = 'font-semibold mr-2 text-gray-900';
            labelSpan.textContent = 'URL:';

            const link = document.createElement('a');
            link.href = raceInfo[0].url;
            link.textContent = raceInfo[0].url;
            link.className = 'text-blue-600 hover:underline';
            link.target = '_blank';

            urlLi.appendChild(labelSpan);
            urlLi.appendChild(link);
            list.appendChild(urlLi);
        }

    }

    // Default race row
    function createRaceRow(race, year) {
        const tableRow = document.createElement("tr");

        const roundCell = createTableCell(race.round);
        const nameCell = createTableCell(race.name);
        const resultCell = createResultCell(race.id, year);
        const favoritesCell = createFavoritesCell(race.id, race.name, 'race', year);


        tableRow.appendChild(roundCell);
        tableRow.appendChild(nameCell);
        tableRow.appendChild(resultCell);
        tableRow.appendChild(favoritesCell);

        return tableRow;
    }

    // Create a cell for races display
    function createFavoritesCell(itemName, itemId, type, year) {
        const favoritesCell = document.createElement("td");

        const heartButton = createFavoritesButton(itemName, itemId, type, year);

        favoritesCell.appendChild(heartButton);

        return favoritesCell;
    }

    // Create a heart button with favorites logic
    function createFavoritesButton(itemName, itemId, type, year) {
        const heartButton = document.createElement('button');
        heartButton.className = 'ml-auto';  // Align the button to the right

        // Get the current list of favorites from localStorage
        const favorites = getFavorites();
        let isFavorited = favorites.find(favorite => favorite.id === itemId && favorite.type === type && favorite.year === year);

        // Set the initial heart icon based on whether the item is favorited
        updateHeartIcon(heartButton, isFavorited);

        // Add click event listener to toggle favorite state
        heartButton.addEventListener('click', () => {
            isFavorited = !isFavorited;
            updateHeartIcon(heartButton, isFavorited);

            // Update the favorites list
            if (isFavorited) {
                // Add item to favorites array
                favorites.push({ id: itemId, name: itemName, type: type, year: year });
            } else {
                // Remove item from favorites array
                const index = favorites.findIndex(favorite => favorite.id === itemId && favorite.type === type && favorite.year === year);
                if (index > -1) {
                    favorites.splice(index, 1);
                }
            }

            // Save updated favorites list to localStorage
            saveFavorites(favorites);

        });

        return heartButton;
    }

    // Default Table cell
    function createTableCell(content) {
        const cell = document.createElement('td');
        // Default cell styling
        cell.className = 'px-4 py-2 text-sm';
        cell.textContent = content;
        return cell;
    }


    // Creating Result Cell with styling
    function createResultCell(raceId, year) {
        const resultCell = document.createElement("td");
        resultCell.classList.add("px-2", "py-2");

        const resultButton = document.createElement("button");
        resultButton.textContent = "View";
        resultButton.classList.add(
            "bg-gray-100",
            "text-gray-800",
            "hover:bg-red-600",
            "hover:text-white",
            "py-1",
            "px-3",
            "rounded",
            "transition-colors",
            "duration-200"
        );
        resultButton.addEventListener("click", () => displayRaceResults(raceId, year));

        resultCell.appendChild(resultButton);
        return resultCell;
    }

    // Default driver cell
    function createDriverCell(driver, year) {
        const cell = document.createElement('td');
        cell.className = 'px-2 py-2';

        const cellContainer = document.createElement('div');
        cellContainer.className = 'flex items-center space-x-2';

        const textSpan = document.createElement('span');
        textSpan.textContent = `${driver.forename} ${driver.surname}`;
        textSpan.className = 'text-sm hover:opacity-50 hover:cursor-pointer underline';

        // Create heart button
        const heartButton = createFavoritesButton(driver.id, `${driver.forename} ${driver.surname}`, 'race', year);

        textSpan.addEventListener('click', () => openDriverDialog(driver.id, year));

        cellContainer.appendChild(textSpan);
        cellContainer.appendChild(heartButton);
        cell.appendChild(cellContainer);

        return cell;
    }

    // Default constructor cell
    function createConCell(constructor, year) {
        const cell = document.createElement('td');
        cell.className = 'px-2 py-2';

        const cellContainer = document.createElement('div');
        cellContainer.className = 'flex items-center space-x-2';

        const textSpan = document.createElement('span');
        textSpan.textContent = constructor.name;
        textSpan.className = 'text-sm hover:opacity-50 hover:cursor-pointer underline';

        // Create heart button
        const heartButton = createFavoritesButton(constructor.id, constructor.name, 'constructor', year);

        textSpan.addEventListener('click', () => openConstructorDialog(constructor.id, year));

        cellContainer.appendChild(textSpan);
        cellContainer.appendChild(heartButton);
        cell.appendChild(cellContainer);

        return cell;
    }


    // Display Race results
    function displayResults(raceId, year) {
        const resultsData = JSON.parse(localStorage.getItem(`${year}-results`));

        const Results = resultsData.filter(r => r.race.id === raceId);

        const resultsTable = document.querySelector("#race-result-data");
        resultsTable.innerHTML = '';

        Results.forEach(result => {
            const row = document.createElement("tr");

            const posCell = createTableCell(result.position);
            const driverCell = createDriverCell(result.driver, year)
            const constCell = createConCell(result.constructor, year);
            const lapCell = createTableCell(result.laps);
            const pointsCell = createTableCell(result.points);


            row.appendChild(posCell);
            row.appendChild(driverCell);
            row.appendChild(constCell);
            row.appendChild(lapCell);
            row.appendChild(pointsCell);

            resultsTable.appendChild(row);
        })
    }

    // Display the  results
    function displayRaceResults(raceId, year) {
        const resultSection = document.querySelector("#raceResults");
        if (resultSection.classList.contains('hidden')) {
            resultSection.classList.toggle('hidden');
        }
        displayQualifying(raceId, year);
        displayResults(raceId, year);
        displayRaceInfo(raceId, year);
    }



    // TODO: Sorting
    // Display the qualifying results
    function displayQualifying(raceId, year) {
        const qualifyingData = JSON.parse(localStorage.getItem(`${year}-qualifying`));

        // Filter qualifying data for the selected race
        const qualifyingResults = qualifyingData
            .filter(r => r.race.id === raceId)

        // Assuming you want to display qualifying results
        const qualifyingTable = document.querySelector("#qualifying-results");
        qualifyingTable.innerHTML = '';  // Clear previous results

        // Populate qualifying table
        qualifyingResults.forEach(result => {
            const row = document.createElement("tr");
            const posCell = createTableCell(result.position);
            const driverCell = createDriverCell(result.driver, year)
            const constCell = createConCell(result.constructor, year);
            const q1 = createTableCell(result.q1);
            const q2 = createTableCell(result.q2);
            const q3 = createTableCell(result.q3);

            row.appendChild(posCell);
            row.appendChild(driverCell);
            row.appendChild(constCell);
            row.appendChild(q1)
            row.appendChild(q2)
            row.appendChild(q3)

            qualifyingTable.appendChild(row);
        });

        document.querySelector("#race-results-title").textContent = `Results for ${qualifyingResults[0].race.name}`;
    }

    // Handles opening of Circuit Dialog
    async function openCircuitDialog(circuitId) {
        console.log(circuitId)
        const dialog = document.querySelector("#circuit-dialog");
        let circuitURL = "https://www.randyconnolly.com/funwebdev/3rd/api/f1/circuits.php?id="

        let circuitData = JSON.parse(localStorage.getItem(`circuit-${circuitId}`));

        if(!circuitData) {
            try {
                showSpinner()

                // Fetch circuit data from the server
                const response = await fetch(`${ circuitURL }${ circuitId }`);
                if (!response.ok) {
                    throw new Error(`Failed to fetch constructor data: ${ response.statusText }`);
                }

                circuitData = await response.json();

                localStorage.setItem(`circuit-${circuitId}`, JSON.stringify(circuitData));
            }
            catch (error) {
                alert("Failed to fetch circuit details. Please try again.");
                return;
            }
            finally {
                hideSpinner();
            }
        }

        populateCircuitDialog(circuitData)

        dialog.showModal()
    }

    // Handling opening of Constructor Dialog
    async function openConstructorDialog(constructorId, year) {
        const dialog = document.querySelector('#constructor-dialog')
        let constructorURL = "https://www.randyconnolly.com/funwebdev/3rd/api/f1/constructors.php?id="

        // Retrieve constructor data from localstorage
        let constructorData = JSON.parse(localStorage.getItem(`constructor-${constructorId}`))

        if(!constructorData) {
            try {
                showSpinner(); // Show spinner while fetching data

                // Fetch circuit data from the server
                const response = await fetch(`${ constructorURL }${ constructorId }`);
                if (!response.ok) {
                    throw new Error(`Failed to fetch constructor data: ${ response.statusText }`);
                }

                constructorData = await response.json();

                // Store fetched data in localStorage
                localStorage.setItem(`constructor-${constructorId}`, JSON.stringify(constructorData));
            } catch (error) {
                alert("Failed to fetch driver details. Please try again.");
                return;
            } finally {
                hideSpinner(); // Hide spinner
            }
        }

        populateConstructorDialog(constructorData, year)

        dialog.showModal();
    }
    // Handling opening of Driver Dialog
    async function openDriverDialog(driverId, year) {
        const dialog = document.querySelector("#driver-dialog");
        let driverURL = "https://www.randyconnolly.com/funwebdev/3rd/api/f1/drivers.php?id="

        // Retrieve driver data from localStorage
        let driverData = JSON.parse(localStorage.getItem(`driver-${ driverId }`));

        if (!driverData) {
            try {
                showSpinner(); // Show spinner while fetching data

                // Fetch driver data from the server
                const response = await fetch(`${ driverURL }${ driverId }`);
                if (!response.ok) {
                    throw new Error(`Failed to fetch driver data: ${ response.statusText }`);
                }

                driverData = await response.json();

                // Store fetched data in localStorage
                localStorage.setItem(`driver-${ driverId }`, JSON.stringify(driverData));
            } catch (error) {
                alert("Failed to fetch driver details. Please try again.");
                return;
            } finally {
                hideSpinner(); // Hide spinner
            }
        }

        populateDriverDialog(driverData, year)

        dialog.showModal(); // Open the dialog
    }

    // Populates the Circuit Dialog
    function populateCircuitDialog(circuitData) {
        document.querySelector('#circuit-name').textContent = `Name: ${circuitData.name}`;
        document.querySelector('#circuit-location').textContent = `Country: ${circuitData.location}`;
        document.querySelector('#circuit-country').textContent = `Country: ${circuitData.country}`;
        const URL = document.querySelector("#circuit-url")
        URL.href = circuitData.url;
        URL.textContent = circuitData.url;
    }

    // Populates the Constructor Dialog
    function populateConstructorDialog(conData, year) {
        document.querySelector("#constructor-name").textContent = `Name: ${conData.name}`
        document.querySelector("#constructor-nationality").textContent = `Nationality: ${conData.nationality}`
        const URL = document.querySelector("#constructor-url")
        URL.href = conData.url;
        URL.textContent = conData.url;

        const resultsTableBody = document.querySelector('#constructor-results-body');
        resultsTableBody.innerHTML = '';
        const resultsData = JSON.parse(localStorage.getItem(`${year}-results`)).filter(r => r.constructor.id === conData.constructorId);

        resultsData.forEach(r => {
            const row = document.createElement("tr");

            // Create cells
            const rndCell = createTableCell(r.race.round)
            const nameCell = createTableCell(r.race.name)
            const posCell = createTableCell(r.position)
            const pointsCell = createTableCell(r.points)

            row.appendChild(rndCell);
            row.appendChild(nameCell);
            row.appendChild(posCell);
            row.appendChild(pointsCell);

            resultsTableBody.appendChild(row)
        })
    }

    // Populates the Driver Dialog
    function populateDriverDialog(driverData, year) {
        const dob = new Date(driverData.dob);
        const age = calculateAge(dob);

        document.querySelector('#driver-name').textContent = `Name: ${driverData.forename} ${driverData.surname}`;
        document.querySelector('#driver-dob').textContent = `DOB: ${driverData.dob}`;
        document.querySelector('#driver-age').textContent = `Age: ${age}`;
        document.querySelector('#driver-nationality').textContent = `Nationality: ${driverData.nationality}`
        const URL = document.querySelector('#driver-url')
        URL.href = driverData.url
        URL.textContent = driverData.url;

        const resultsTableBody = document.querySelector('#driver-results-body');
        resultsTableBody.innerHTML = '';
        const raceData = JSON.parse(localStorage.getItem(`${year}-results`)).filter(r => r.driver.id === driverData.driverId);

        raceData.forEach(r => {
            const row = document.createElement("tr");

            // Create cells
            const rndCell = createTableCell(r.race.round)
            const nameCell = createTableCell(r.race.name)
            const posCell = createTableCell(r.position)
            const pointsCell = createTableCell(r.points)

            row.appendChild(rndCell);
            row.appendChild(nameCell);
            row.appendChild(posCell);
            row.appendChild(pointsCell);

            resultsTableBody.appendChild(row)
        })


    }

    // Taken from https://stackoverflow.com/questions/4060004/calculate-age-given-the-birth-date-in-the-format-yyyymmdd
    function calculateAge(dob) {
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const monthDifference = today.getMonth() - dob.getMonth();

        // Adjust age if today's date is before the birthday in the current year
        if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < dob.getDate())) {
            age--;
        }

        return age;
    }

    // Close dialog
    function closeDialog(dialogId) {
        const dialog = document.getElementById(dialogId);
        dialog.close();
    }

    // Spinner functions for loading
    function showSpinner() {
        spinner.classList.remove('invisible')
    }

    function hideSpinner() {
        spinner.classList.add('invisible')
    }

    // Favorites logic
    const updateHeartIcon = (btn, isFavorited) => {
        if (isFavorited) {
            btn.classList.add('text-red-500');
            btn.classList.remove('text-gray-500');
            btn.innerHTML = `
   <!-- Filled Heart Icon -->
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-6">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  `;
        } else {
            btn.classList.remove('text-red-500');
            btn.classList.add('text-gray-500');
            btn.innerHTML = `
   <!-- Outlined Heart Icon -->
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="size-6">
      <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
    </svg>
  `;
        }
    };

    // Function to get the list of favorites from localStorage
    function getFavorites() {
        const favorites = localStorage.getItem('favorites');
        return favorites ? JSON.parse(favorites) : [];
    }

    // Function to save the updated list of favorites to localStorage
    function saveFavorites(favorites) {
        localStorage.setItem('favorites', JSON.stringify(favorites));
    }


    // Go back to home page
    F1Logo.addEventListener('click', (e) => {
        if(home.classList.contains('hidden')) {
            home.classList.toggle('hidden');
            seasonSelect.selectedIndex = 0;
        }
        if(!races.classList.contains('hidden')) {
            races.classList.toggle('hidden');
        }
        if(!raceResults.classList.contains('hidden')) {
            raceResults.classList.toggle('hidden');
        }
    })

    // Event listeners for dialogs
    circuitCloseButton.addEventListener("click", () => closeDialog("circuit-dialog"));
    driverCloseButton.addEventListener("click", () => closeDialog("driver-dialog"));
    constructorCloseButton.addEventListener("click", () => closeDialog("constructor-dialog"));

});
