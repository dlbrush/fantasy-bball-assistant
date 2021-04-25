const CATEGORIES = ['gp', 'fgp', 'ftp', 'tpg', 'rpg', 'apg', 'spg', 'bpg', 'topg', 'ppg'];  

async function getTeamProjections(teamPlayers, date, targetName, teamData) {
    //Fill totals
    const totals = await getTeamTotals(teamPlayers, date);
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
        populatePlayerInfo(document.querySelector(`.player-${player.ID}-head`), player, false);
        populateGameCells(player, date, teamData);
    });
    const allPlayerTotals = await Promise.all(teamPlayers.map(async function(player) {
        const playerTotals = await getPlayerTotals(player, date);
        return playerTotals;
    }));
    allPlayerTotals.forEach(playerTotals => {
        const playerTotalCells = Array.from(document.querySelectorAll(`.cat-${playerTotals.ID}-total`));
        mapStatsToTable(playerTotalCells, playerTotals);
    });
}

async function analyzeTradeSide(playerOptions, target, date, players) {
    const selectedOptions = playerOptions.filter(option => {
        return option.hasAttribute('selected');
    });
    const selectedPlayerIds = selectedOptions.map(option => {
        return option.value
    })
    const selectedPlayers = selectedPlayerIds.map(id => getPlayer(id, players));
    const playerStatsArray = await Promise.all(
        selectedPlayers.map(async function(player) {
            const playerStats = await getPlayerTotals(player, date, 1);
            return playerStats;
        })
    );
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

    const playerTotals = await getTeamTotals(selectedPlayers, date, 1);
    const totalRow = createTotalStatRow(statsBody, target, false);
    const totalCells = Array.from(totalRow.children)
    mapStatsToTable(totalCells, playerTotals)
    return playerTotals
}

function getTradeResults(givingStats, receivingStats) {
    const results = {};
    for (let stat in givingStats) {
        results[stat] = roundToTenth(receivingStats[stat] - givingStats[stat]);
    }
    return results;
}


async function getTeamTotals(players, date, numGames) {
    const playersToProject = await Promise.all(players.map(async function(player) {
        const playerToProject = await getPlayerToProject(player, date, numGames);
        return playerToProject
    }));
    let totals = {ppg: 0, rpg: 0, apg: 0, spg: 0, bpg: 0, topg: 0, tpg: 0, fgmpg: 0, fgapg: 0, ftmpg: 0, ftapg: 0}
    totals = playersToProject.reduce(addPlayerToTotal, totals);
    totals.fgp = roundToTenth(100* totals.fgmpg/totals.fgapg);
    totals.ftp = roundToTenth(100 * totals.ftmpg/totals.ftapg);
    totals.gp = playersToProject.reduce((total, nextPlayer) => {
        return total + nextPlayer.numProjectedGames
    }, 0);
    return totals
}

async function getPlayerTotals(player, date, numGames) {
    const playerToProject = await getPlayerToProject(player, date, numGames);
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

function addPlayerToTotal(currentTotals, nextPlayer) {
    const newTotals = {};
    for (let stat in currentTotals) {
        newTotals[stat] = roundToTenth(currentTotals[stat] + (nextPlayer.fantasyStats[stat] * nextPlayer.numProjectedGames));
    };
    return newTotals
}

async function getPlayerToProject(player, date, numGames) {
    const numProjectedGames = (numGames ? numGames : await getNumGamesForWeek(player, date));
    const seasonStats = await getPlayerSeasonStats(player.ID);
    return {numProjectedGames, fantasyStats: getFantasyStats(seasonStats)}
}

// Returns the number of threes a player makes per game, rounded to 1 decimal point
function roundToTenth(number) {
    return Math.round(number * 10) / 10
}

function getFantasyStats(seasonStats) {
    const {fgp, ftp, ppg, rpg, apg, spg, bpg, topg, gamesPlayed:gp} = seasonStats;
    const tpg = roundToTenth(seasonStats.tpm/gp);
    const fgmpg = roundToTenth(seasonStats.fgm/gp);
    const fgapg = roundToTenth(seasonStats.fga/gp);
    const ftmpg = roundToTenth(seasonStats.ftm/gp);
    const ftapg = roundToTenth(seasonStats.fta/gp);
    return {fgp, ftp, ppg, rpg, apg, spg, bpg, topg, gp, tpg, fgmpg, fgapg, ftmpg, ftapg}
}

function mapStatsToTable(cells, stats) {
    for (let stat in stats) {

        const targets = cells.filter(cell => cell.id.includes(`-${stat}`));

        targets.forEach(target => {
            // Currently removing game adjustment feature to get to MVP
            // if (stat === 'gp' && target.classList.contains('player-stat')) {
            //     renderGamesInput(target, stats[stat], stats.ID);
            // } else {
                target.innerText = stats[stat];
            // }
        });
    }
}

function mapDifferences(cells, results) {
    for (let stat in results) {
        const target = cells.find(cell => cell.id.includes(`-${stat}`));
        if (target) {
            target.innerText = results[stat];
            if (results[stat] > 0) {
                target.classList.add('text-success')
            } else if (results[stat] < 0) {
                target.classList.add('text-danger')
            }
        }
    }
}

function createPlayerStatRow(table, player, includeGames) {

    const row = document.createElement('tr');
    row.id = `player-${player.ID}-row`;

    const head = document.createElement('th');
    head.classList.add('player-row-head', `player-${player.ID}-head`);
    row.append(head);

    for (let cat of CATEGORIES) {
        if (cat != 'gp' || (cat === 'gp' && includeGames)){
            const cell = document.createElement('td');
            cell.classList.add('player-stat', `cat-${player.ID}-total`, 'text-center');
            cell.id = `${player.ID}-${cat}-total`;
            row.append(cell);
        }
    }

    table.append(row);
}

function createTotalStatRow(table, target, includeGames) {
    const row = document.createElement('tr');
    row.class = `stat-total-row`;

    const head = document.createElement('th')
    head.classList.add('stat-total-row-head');
    head.innerText = 'TOTALS';
    row.append(head);

    for (let cat of CATEGORIES) {
        if (cat != 'gp' || (cat === 'gp' && includeGames)){
            const cell = document.createElement('td');
            cell.classList.add(`${target}-total-stat`, `cat-total`, 'text-center');
            cell.id = `${target}-${cat}-total`;
            row.append(cell);
        }
    }

    table.append(row);
    return row;
}

function renderGamesInput(target, numGames, playerId) {
    const input = document.createElement('input');
    input.type = 'number';
    input.value = numGames;
    input.min = 0;
    input.max = 7;
    input.className = ('form-control player-gp-input')
    input.id = `${playerId}-gp-input`
    target.append(input);
}