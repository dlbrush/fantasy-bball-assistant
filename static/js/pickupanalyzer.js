document.addEventListener('DOMContentLoaded', async function() {
    const playerData = await getAllPlayers();
    const teamData = await getAllTeams();
    const players = getPlayers(playerData, teamData);

    // Set the default value of the date input to today's date. 
    //Because Date.now() returns  the UTC date, to get the user's local date first we need to calculate the timezone offset in MS
    const today = new Date();
    const todayMS = Date.now();
    const timeZoneOffsetMS = today.getTimezoneOffset() * 60000;
    const dateAsNumber = todayMS - timeZoneOffsetMS;
    document.querySelector('#pick-date').valueAsNumber = dateAsNumber;

    const pickupSearchBar = document.querySelector('#pickup-player-search-bar');
    const pickupResults = document.querySelector('#pickup-player-search-results');
    const pickupPlayerList = document.querySelector('#pickup-player-list');
    const pickupSearchContainer = document.querySelector('#pickup-player-search');
    const pickupDisplayList = document.querySelector('#pickup-player-display-list');
    const pickupPlayerSelect = document.querySelector('#pickup-player-select');

    const pickupSearch = new singleChoicePlayerSearch(pickupSearchBar, pickupResults, pickupPlayerList, pickupSearchContainer, players, pickupDisplayList, pickupPlayerSelect);

    const userTeamSelect = document.querySelector('#player-team-select');
    userTeamSelect.addEventListener('change', populateTeamOptions);

    const userPlayerSelect = document.querySelector('#drop-player-select')
    userPlayerSelect.addEventListener('change', showDroppedPlayer);

    const dropPlayerBlock = document.querySelector('#drop-player-block')

    const analyzePickupButton = document.querySelector('#analyze-pickup')
    analyzePickupButton.addEventListener('click', analyzePickup);

    async function populateTeamOptions(evt) {
        clearChildren(userPlayerSelect);
        clearChildren(dropPlayerBlock);
        const dummyTopOption = {ID: 0, name: '--Choose Player--'};
        createTeamOption(dummyTopOption, userPlayerSelect)
        const teamId = evt.target.value;
        const teamPlayerIds = await getUserTeamPlayerIds(teamId);
        const teamPlayers = teamPlayerIds.map(id => getPlayer(id, players));
        teamPlayers.forEach(player => createTeamOption(player, userPlayerSelect));
    }

    function createTeamOption(player, select) {
        const option = document.createElement('option');
        option.value = player.ID;
        option.innerText = player.name;
        select.append(option);
    }

    function showDroppedPlayer(evt) {
        clearChildren(dropPlayerBlock);
        const player = getPlayer(evt.target.value, players);
        populatePlayerInfo(dropPlayerBlock, player, false);
    }

    async function analyzePickup() {
        //Show the results tables
        document.querySelector('#pickup-results').classList.remove('hide')

        //Get the IDs of the selected players
        const droppedPlayerId = userPlayerSelect.value;
        const pickupPlayerId = pickupPlayerSelect.value;

        // Get the date value from the date input
        const dateValue = document.querySelector('#pick-date').value;
        const date = new Date(dateValue);

        //Clear the tables if there is anything in them currently
        const perGameBody = document.querySelector('#per-game-player-grid-stats-body');
        const weeklyBody = document.querySelector('#weekly-player-grid-stats-body');
        clearChildren(perGameBody);
        clearChildren(weeklyBody);

        //Declare the statistics variables outside of the condition blocks so we can use them later
        let droppedPlayerPerGameStats, droppedPlayerWeekStats, pickupPlayerPerGameStats, pickupPlayerWeekStats;

        if (droppedPlayerId) {
            const droppedResults = await analyzePickupSide(droppedPlayerId, players, 'DROPPING', perGameBody, weeklyBody, date);
            droppedPlayerPerGameStats = droppedResults.perGameStats;
            droppedPlayerWeekStats = droppedResults.weekStats;
        }
        if (pickupPlayerId) {
            const pickupResults = await analyzePickupSide(pickupPlayerId, players, 'ADDING', perGameBody, weeklyBody, date);
            pickupPlayerPerGameStats = pickupResults.perGameStats;
            pickupPlayerWeekStats = pickupResults.weekStats;
        }
        if (droppedPlayerId && pickupPlayerId) {
            const perGameDiffRow = createDiffStatRow(perGameBody, 'per-game', false, 1);
            const perGameDiffCells = Array.from(perGameDiffRow.children);
            const perGameDiff = getComparison(droppedPlayerPerGameStats, pickupPlayerPerGameStats);
            mapDifferences(perGameDiffCells, perGameDiff);
            const weekDiffRow = createDiffStatRow(weeklyBody, 'weekly', true, 1);
            const weekDiffCells = Array.from(weekDiffRow.children);
            const weekDiff = getComparison(droppedPlayerWeekStats, pickupPlayerWeekStats);
            mapDifferences(weekDiffCells, weekDiff);
        }
        if (userTeamSelect.value) {
            //Show team projection div
            document.querySelector('#team-projection-container').classList.remove('hide');
            
            //Get all necessary info for the user's players to get total projections
            const userTeamId = userTeamSelect.value;
            const userTeamPlayerIds = await getUserTeamPlayerIds(userTeamId);
            const userTeamPlayers = userTeamPlayerIds.map(id => getPlayer(id, players));
            const currentTeamTotals = await getTeamTotals(userTeamPlayers, date);
            
            const restOfWeekDiff = getComparison(droppedPlayerWeekStats, pickupPlayerWeekStats);
            const newTeamTotals = addStats(currentTeamTotals, restOfWeekDiff);
            newTeamTotals.fgp = roundToTenth(100 * newTeamTotals.fgmpg / newTeamTotals.fgapg);
            newTeamTotals.ftp = roundToTenth(100 * newTeamTotals.ftmpg / newTeamTotals.ftapg);
            const totalCells = Array.from(document.querySelectorAll('.cat-user-total'));
            mapStatsToTable(totalCells, newTeamTotals);
            const totalDiff = getComparison(currentTeamTotals, newTeamTotals);
            addDiffToTable(totalCells, totalDiff);
        }
    }
});