document.addEventListener("DOMContentLoaded", (e) => {
    const seasonSelect = document.querySelector('#season-select');
    const races = document.querySelector('#races');
    const home = document.querySelector('#home');
    const spinner = document.querySelector('#spinner');
    let raceURL = "https://www.randyconnolly.com/funwebdev/3rd/api/f1/races.php?season="
    let resultsURL = "https://www.randyconnolly.com/funwebdev/3rd/api/f1/results.php?season="
    let qualifyingURL = "https://www.randyconnolly.com/funwebdev/3rd/api/f1/qualifying.php?season="

    seasonSelect.addEventListener('change', (event) => {
        const selectedSeason = event.target.value;

        if (selectedSeason) {
            home.classList.add('hidden');
            races.style.display = 'block';

            // Check local storage for data
            const raceData = localStorage.getItem(`${selectedSeason}-races`);
            let resultsData;
            let qualifyingData;

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
                resultsData = localStorage.getItem(`${selectedSeason}-results`);
                qualifyingData = localStorage.getItem(`${selectedSeason}-qualifying`);
                displayRaces(raceData)
            }
        }
    });

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

    function displayRaces(raceData) {
        if (Array.isArray(raceData) && raceData.length > 0) {
            console.log('Displaying races:', raceData);
            // TODO: Implement DOM manipulation to show races
        } else {
            console.warn('No race data available');
            races.innerHTML = '<p>No races found for this season.</p>';
        }
    }

    function showSpinner() {
        spinner.classList.remove('invisible')
    }

    function hideSpinner() {
        spinner.classList.add('invisible')
    }

});
