document.addEventListener('DOMContentLoaded', async function() {
    const playerData = await getAllPlayers();
    const teamData = await getAllTeams();
    const players = getPlayers(playerData, teamData);
    const today = new Date();
    const thursday = new Date();
    thursday.setDate(today.getDate() - 3);

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

    async function showDroppedPlayer(evt) {
        clearChildren(dropPlayerBlock);
        const player = getPlayer(evt.target.value, players);
        populatePlayerInfo(dropPlayerBlock, player, false);
    }

    async function analyzePickup() {
        document.querySelector('#pickup-results')
        const droppedPlayerId = userPlayerSelect.value;
        const pickupPlayerId = pickupPlayerSelect.value;
        const perGameBody = document.querySelector('#per-game-player-grid-stats-body');
        const weeklyBody = document.querySelector('#weekly-player-grid-stats-body');
        let droppedPlayerPerGameStats, droppedPlayerWeekStats, pickupPlayerPerGameStats, pickupPlayerWeekStats;
        if (droppedPlayerId) {
            const droppedPlayer = getPlayer(droppedPlayerId, players);
            createPlayerStatRow(perGameBody, droppedPlayer, false, 'DROPPING');
            populatePlayerInfo(perGameBody.querySelector(`.player-${droppedPlayer.ID}-head`), droppedPlayer, false);
            droppedPlayerPerGameStats = await getPlayerTotals(droppedPlayer, today, 1);
            const droppedPlayerPerGameCells = Array.from(perGameBody.querySelectorAll(`.cat-${droppedPlayer.ID}-total`));
            mapStatsToTable(droppedPlayerPerGameCells, droppedPlayerPerGameStats);

            const droppedPlayerGamesRemaining = await getNumWeekGamesRemaining(droppedPlayer, thursday);
            console.log(droppedPlayerGamesRemaining);
            droppedPlayerWeekStats = await getPlayerTotals(droppedPlayer, today, droppedPlayerGamesRemaining);
            createPlayerStatRow(weeklyBody, droppedPlayer, true, 'DROPPING');
            populatePlayerInfo(weeklyBody.querySelector(`.player-${droppedPlayer.ID}-head`), droppedPlayer, false);
            const droppedPlayerWeekCells = Array.from(weeklyBody.querySelectorAll(`.cat-${droppedPlayer.ID}-total`));
            mapStatsToTable(droppedPlayerWeekCells, droppedPlayerWeekStats);
        }
        if (pickupPlayerId) {
            const pickupPlayer = getPlayer(pickupPlayerId, players);
            const perGameBody = document.querySelector('#per-game-player-grid-stats-body');
            createPlayerStatRow(perGameBody, pickupPlayer, false, 'ADDING');
            populatePlayerInfo(perGameBody.querySelector(`.player-${pickupPlayer.ID}-head`), pickupPlayer, false);
            pickupPlayerPerGameStats = await getPlayerTotals(pickupPlayer, today, 1);
            const pickupPlayerPerGameCells = Array.from(perGameBody.querySelectorAll(`.cat-${pickupPlayer.ID}-total`));
            mapStatsToTable(pickupPlayerPerGameCells, pickupPlayerPerGameStats);

            const pickupPlayerGamesRemaining = await getNumWeekGamesRemaining(pickupPlayer, thursday);
            console.log(pickupPlayerGamesRemaining);
            pickupPlayerWeekStats = await getPlayerTotals(pickupPlayer, today, pickupPlayerGamesRemaining);
            createPlayerStatRow(weeklyBody, pickupPlayer, true, 'ADDING');
            populatePlayerInfo(weeklyBody.querySelector(`.player-${pickupPlayer.ID}-head`), pickupPlayer, false);
            const pickupPlayerWeekCells = Array.from(weeklyBody.querySelectorAll(`.cat-${pickupPlayer.ID}-total`));
            mapStatsToTable(pickupPlayerWeekCells, pickupPlayerWeekStats);
            console.log(pickupPlayerWeekStats);
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
        //Get all necessary info for the user's players
        const userTeamId = userTeamSelect.value;
        const userTeamPlayerIds = await getUserTeamPlayerIds(userTeamId);
        const userTeamPlayers = userTeamPlayerIds.map(id => getPlayer(id, players));
        const currentTeamTotals = await getTeamTotals(userTeamPlayers, today);
        
        const restOfWeekDiff = getComparison(droppedPlayerWeekStats, pickupPlayerWeekStats);
        const newTeamTotals = addStats(currentTeamTotals, restOfWeekDiff);
        newTeamTotals.fgp = roundToTenth(100 * newTeamTotals.fgmpg / newTeamTotals.fgapg);
        newTeamTotals.ftp = roundToTenth(100 * newTeamTotals.ftmpg / newTeamTotals.ftapg);
        const totalCells = Array.from(document.querySelectorAll('.cat-user-total'));
        mapStatsToTable(totalCells, newTeamTotals);
        const totalDiff = getComparison(currentTeamTotals, newTeamTotals);
        console.log(totalDiff);
        addDiffToTable(totalCells, totalDiff);
    }
});