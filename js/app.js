document.addEventListener("DOMContentLoaded", (e) => {
    const seasonSelect = document.querySelector('#season-select');
    const races = document.querySelector('#races');
    const home = document.querySelector('#home');
    const spinner = document.querySelector('#spinner');
    const F1Logo = document.querySelector('#f1-logo');
    let raceURL = "https://www.randyconnolly.com/funwebdev/3rd/api/f1/races.php?season="
    let resultsURL = "https://www.randyconnolly.com/funwebdev/3rd/api/f1/results.php?season="
    let qualifyingURL = "https://www.randyconnolly.com/funwebdev/3rd/api/f1/qualifying.php?season="
    const driverCloseButton = document.querySelector("#driver-dialog-close");
    const constructorCloseButton = document.querySelector("#constructor-dialog-close");
    const circuitCloseButton = document.querySelector('#circuit-dialog-close')

    // Go back to home page
    F1Logo.addEventListener('click', (e) => {
        if(home.classList.contains('hidden')) {
            home.classList.toggle('hidden');
            races.classList.toggle('hidden');
        }
    })

    circuitCloseButton.addEventListener("click", () => {
        closeCircuitDialog()
    })

    driverCloseButton.addEventListener("click", () => {
        closeDriverDialog()
    });

    constructorCloseButton.addEventListener("click", () => {
        closeConstructorDialog()
    })


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
                valueSpan.classList.add('underline', 'hover:cursor-pointer');
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

    function createRaceRow(race, year) {
        const tableRow = document.createElement("tr");

        const roundCell = createTableCell(race.round);
        const nameCell = createTableCell(race.name);
        const resultCell = createResultCell(race.id, year);

        tableRow.appendChild(roundCell);
        tableRow.appendChild(nameCell);
        tableRow.appendChild(resultCell);

        return tableRow;
    }

    function createTableCell(content) {
        const cell = document.createElement('td');
        // Default cell styling
        cell.className = 'px-4 py-2 text-sm';
        cell.textContent = content;
        return cell;
    }


    function createResultCell(raceId, year) {
        const resultCell = document.createElement("td");
        resultCell.classList.add("px-4", "py-2");

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

    function displayRaceResults(raceId, year) {
        const resultSection = document.querySelector("#raceResults");
        if (resultSection.classList.contains('hidden')) {
            resultSection.classList.toggle('hidden');
        }
        displayQualifying(raceId, year);
        displayResults(raceId, year);
        displayRaceInfo(raceId, year);
    }

    function displayResults(raceId, year) {
        const resultsData = JSON.parse(localStorage.getItem(`${year}-results`));

        const Results = resultsData.filter(r => r.race.id === raceId);

        const resultsTable = document.querySelector("#race-result-data");
        resultsTable.innerHTML = '';

        Results.forEach(result => {
            const row = document.createElement("tr");
            const posCell = createTableCell(result.position);
            const driverCell = createTableCell(`${result.driver.forename} ${result.driver.surname}`);
            const constCell = createTableCell(result.constructor.name);
            const lapCell = createTableCell(result.laps);
            const pointsCell = createTableCell(result.points);

            // Styling for Driver and Const Cells
            driverCell.classList.add('underline', 'hover:cursor-pointer');
            constCell.classList.add('underline', 'hover:cursor-pointer');

            // Event Handlers for Driver and Constructors
            driverCell.addEventListener("click", () => openDriverDialog(result.driver.id, year));
            constCell.addEventListener('click', () => openConstructorDialog(result.constructor.id, year))

            row.appendChild(posCell);
            row.appendChild(driverCell);
            row.appendChild(constCell);
            row.appendChild(lapCell);
            row.appendChild(pointsCell);

            resultsTable.appendChild(row);
        })
    }


    // TODO: Sorting
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
            const driverCell = createTableCell(`${result.driver.forename} ${result.driver.surname}`);
            const constCell = createTableCell(result.constructor.name);
            const q1 = createTableCell(result.q1);
            const q2 = createTableCell(result.q2);
            const q3 = createTableCell(result.q3);

            // Styling for Driver and Const Cells
            driverCell.classList.add('underline', 'hover:cursor-pointer');
            constCell.classList.add('underline', 'hover:cursor-pointer');

            // Event Handlers for Driver and Constructors
            driverCell.addEventListener("click", () => openDriverDialog(result.driver.id, year));
            constCell.addEventListener('click', () => openConstructorDialog(result.constructor.id, year))

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

    function populateCircuitDialog(circuitData) {
        document.querySelector('#circuit-name').textContent = `Name: ${circuitData.name}`;
        document.querySelector('#circuit-location').textContent = `Country: ${circuitData.location}`;
        document.querySelector('#circuit-country').textContent = `Country: ${circuitData.country}`;
        const URL = document.querySelector("#circuit-url")
        URL.href = circuitData.url;
        URL.textContent = circuitData.url;
    }

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

    function closeDriverDialog() {
        const dialog = document.getElementById("driver-dialog");
        dialog.close();
    }

    function closeConstructorDialog() {
        const dialog = document.getElementById("constructor-dialog");
        dialog.close();
    }

    function closeCircuitDialog() {
        const dialog = document.getElementById("circuit-dialog");
        dialog.close();
    }


    // Spinner functions for loading
    function showSpinner() {
        spinner.classList.remove('invisible')
    }

    function hideSpinner() {
        spinner.classList.add('invisible')
    }

});
