//Mock functions that require API data to use mock data

//TODO
function getTeamProjections(teamPlayers, date, targetName, teamData) {
    //Fill totals
    const totals = getTeamTotals(teamPlayers, date);
    const totalCells = Array.from(document.querySelectorAll(`.cat-${targetName}-total`));
    mapStatsToTable(totalCells, totals);

    //Map stats for the target's players
    const playerStatsBody = document.querySelector(`#${targetName}-player-grid-stats-body`)
    const playerScheduleBody = document.querySelector(`#${targetName}-player-grid-schedule-body`)
    clearChildren(playerStatsBody);
    clearChildren(playerScheduleBody);
    teamPlayers.forEach(player => {
        createPlayerStatRow(playerStatsBody, player, true);
        createPlayerScheduleRow(playerScheduleBody, player, date);
        populatePlayerInfo(playerStatsBody.querySelector(`.player-${player.ID}-head`), player, false);
        populatePlayerInfo(playerScheduleBody.querySelector(`.player-${player.ID}-head`), player, false);
        populateGameCells(player, date, teamData, playerScheduleBody);
    });
    const allPlayerTotals = teamPlayers.map(function(player) {
        const playerTotals = getPlayerTotals(player, date);
        return playerTotals;
    });
    allPlayerTotals.forEach(playerTotals => {
        const playerTotalCells = Array.from(document.querySelectorAll(`.cat-${playerTotals.ID}-total`));
        mapStatsToTable(playerTotalCells, playerTotals);
    });
    return allPlayerTotals
}

//TODO
function getOpponentProjection(oppTeamId, userTeamId, players, teamData, date) {

    const oppData = testOpponentData;
    document.querySelector('#opponent-name').innerText = oppData.name;
    document.querySelector('#edit-opp-team').setAttribute('href', `/teams/${userTeamId}/opponents/${oppTeamId}/edit`);
    const oppTeamPlayerIds = oppData.players;
    const oppTeamPlayers = oppTeamPlayerIds.map(id => getPlayer(id, players));
    const opponentProjections = getTeamProjections(oppTeamPlayers, date, 'opp', teamData);
    return opponentProjections
}

function analyzeTradeSide(playerOptions, target, date, players) {
    const selectedOptions = playerOptions.filter(option => {
        return option.hasAttribute('selected');
    });
    const selectedPlayerIds = selectedOptions.map(option => {
        return option.value
    })
    const selectedPlayers = selectedPlayerIds.map(id => getPlayer(id, players));
    const playerStatsArray = selectedPlayers.map( function(player) {
            const playerStats = getPlayerTotals(player, date, 1);
            return playerStats;
        });
    const statsBody = document.querySelector(`#${target}-player-grid-stats-body`);
    clearChildren(statsBody);

    selectedPlayers.forEach(player => {
        createPlayerStatRow(statsBody, player, false);
        populatePlayerInfo(document.querySelector(`.player-${player.ID}-head`), player, false);
    });
    playerStatsArray.forEach(playerStats => {
        const playerStatCells = Array.from(document.querySelectorAll(`.cat-${playerStats.ID}-total`));
        mapStatsToTable(playerStatCells, playerStats);
    });

    const playerTotals = getTeamTotals(selectedPlayers, date, 1);
    const totalRow = createTotalStatRow(statsBody, target, false);
    const totalCells = Array.from(totalRow.children);
    mapStatsToTable(totalCells, playerTotals);
    return playerTotals
}

function analyzePickupSide(playerId, players, actionString, perGameBody, weeklyBody, date) {
    const player = testPlayer;
    createPlayerStatRow(perGameBody, player, false, actionString);
    populatePlayerInfo(perGameBody.querySelector(`.player-${player.ID}-head`), player, false);
    const perGameStats = getPlayerTotals(player, date, 1);
    const perGameCells = Array.from(perGameBody.querySelectorAll(`.cat-${player.ID}-total`));
    mapStatsToTable(perGameCells, perGameStats);

    const playerGamesRemaining = getNumWeekGamesRemaining(player, date);
    const weekStats = getPlayerTotals(player, date, playerGamesRemaining);
    createPlayerStatRow(weeklyBody, player, true, actionString);
    populatePlayerInfo(weeklyBody.querySelector(`.player-${player.ID}-head`), player, false);
    const weekCells = Array.from(weeklyBody.querySelectorAll(`.cat-${player.ID}-total`));
    mapStatsToTable(weekCells, weekStats);

    return {perGameStats, weekStats}
}

function getTeamTotals(players, date, numGames) {
    const playersToProject = players.map(function(player) {
        const playerToProject = getPlayerToProject(player, date, numGames);
        return playerToProject
    });
    let totals = {ppg: 0, rpg: 0, apg: 0, spg: 0, bpg: 0, topg: 0, tpg: 0, fgmpg: 0, fgapg: 0, ftmpg: 0, ftapg: 0}
    totals = playersToProject.reduce(addPlayerToTotal, totals);
    totals.fgp = roundToTenth(100* totals.fgmpg/totals.fgapg);
    totals.ftp = roundToTenth(100 * totals.ftmpg/totals.ftapg);
    totals.gp = playersToProject.reduce((total, nextPlayer) => {
        return total + nextPlayer.numProjectedGames
    }, 0);
    return totals
}

function getPlayerTotals(player, date, numGames) {
    const playerToProject = getPlayerToProject(player, date, numGames);
    const totals = {ID: player.ID}
    for (let stat in playerToProject.fantasyStats) {
        if (stat === 'gp') {
            totals[stat] = playerToProject.numProjectedGames
        } else if(stat === 'fgp' || stat === 'ftp') {
            totals[stat] = playerToProject.fantasyStats[stat]
        } else {
            totals[stat] = roundToTenth(
                playerToProject.fantasyStats[stat] * playerToProject.numProjectedGames
            );
        }
    }
    return totals
}

function getPlayerToProject(player, date, numGames) {
    const numProjectedGames = (numGames ? numGames : getNumGamesForWeek(player, date));
    const seasonStats = testPlayerProfile;
    return {numProjectedGames, fantasyStats: getFantasyStats(seasonStats)}
}