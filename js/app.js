document.addEventListener("DOMContentLoaded", (e) => {
    const seasonSelect = document.querySelector('#season-select');
    const races = document.querySelector('#races');
    const home = document.querySelector('#home');
    const spinner = document.querySelector('#spinner');
    const F1Logo = document.querySelector('#f1-logo');
    let raceURL = "https://www.randyconnolly.com/funwebdev/3rd/api/f1/races.php?season="
    let resultsURL = "https://www.randyconnolly.com/funwebdev/3rd/api/f1/results.php?season="
    let qualifyingURL = "https://www.randyconnolly.com/funwebdev/3rd/api/f1/qualifying.php?season="

    // Go back to home page
    F1Logo.addEventListener('click', (e) => {
        if(home.classList.contains('hidden')) {
            home.classList.toggle('hidden');
            races.classList.toggle('hidden');
        }
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
            { label: 'Circuit', value: raceInfo[0].circuit.name },
            { label: 'Date', value: raceInfo[0].date },
        ];

        raceDetails.forEach(detail => {
            const li = document.createElement('li');
            li.className = 'flex items-center text-sm text-gray-700';

            const labelSpan = document.createElement('span');
            labelSpan.className = 'font-semibold mr-2 text-gray-900';
            labelSpan.textContent = `${detail.label}:`;

            const valueSpan = document.createElement('span');
            valueSpan.textContent = detail.value;

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
            driverCell.classList.add('underline');
            constCell.classList.add('underline');

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
            driverCell.classList.add('underline');
            constCell.classList.add('underline');


            row.appendChild(posCell);
            row.appendChild(driverCell);
            row.appendChild(constCell);
            row.appendChild(q1)
            row.appendChild(q2)
            row.appendChild(q3)

            qualifyingTable.appendChild(row);
        });

        const headerCells = document.querySelectorAll("#qualifying-headers th");

        headerCells.forEach((headerCell, index) => {
            const sortColumns = ['position', 'driver', 'constructor', 'q1', 'q2', 'q3'];
            headerCell.addEventListener('click', () => {
                displayQualifying(raceId, year, 'driver');
            })
        })

        document.querySelector("#race-results-title").textContent = `Results for ${qualifyingResults[0].race.name}`;
    }


    // Spinner functions for loading
    function showSpinner() {
        spinner.classList.remove('invisible')
    }

    function hideSpinner() {
        spinner.classList.add('invisible')
    }

});
