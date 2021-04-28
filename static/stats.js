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
        populatePlayerInfo(playerStatsBody.querySelector(`.player-${player.ID}-head`), player, false);
        populatePlayerInfo(playerScheduleBody.querySelector(`.player-${player.ID}-head`), player, false);
        populateGameCells(player, date, teamData, playerScheduleBody);
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

function getComparison(givingStats, receivingStats) {
    const results = {};
    if (!givingStats) {
        for (let stat in receivingStats) {
            receivingStats[stat] = 0;
        }
    } else if (!receivingStats) {
        for (let stat in givingStats) {
            givingStats[stat] = 0;
        }
    }
    for (let stat in givingStats) {
        results[stat] = roundToTenth(receivingStats[stat] - givingStats[stat]);
    }
    return results;
}

function addStats(stats1, stats2) {
    let results = {};
    for (let stat in stats1) {
        results[stat] = roundToTenth(stats1[stat] + stats2[stat]);
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

function addDiffToTable(cells, diff) {
    for (let stat in diff) {

        const targets = cells.filter(cell => cell.id.includes(`-${stat}`));

        targets.forEach(target => {
            const diffSpan = document.createElement('span');
            if (diff[stat] > 0) {
                diffSpan.classList.add('text-success');
                diffSpan.innerText = ` (+${diff[stat]})`
            } else {
                diffSpan.classList.add('text-danger');
                diffSpan.innerText = ` (${diff[stat]})`;
            }
            target.append(diffSpan);
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

function createPlayerStatRow(table, player, includeGames, rowTitle) {

    const row = document.createElement('tr');
    row.id = `player-${player.ID}-row`;

    if (rowTitle) {
        const title = document.createElement('th');
        title.classList.add('player-row-title', 'text-center');
        title.innerText = rowTitle;
        row.append(title);
    }

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

function createDiffStatRow(table, target, includeGames, leadingCells) {
    const row = document.createElement('tr');
    row.classList.add('stat-diff-row', 'text-center');

    const head = document.createElement('th')
    head.classList.add('stat-total-row-head');
    head.innerText = 'CHANGE';
    row.append(head);

    //Leading cells are empty, just to create space where we don't have something to diff
    for (let x = 0; x < leadingCells; x++) {
        const leadingCell = document.createElement('td');
        row.append(leadingCell);
    }

    for (let cat of CATEGORIES) {
        if (cat != 'gp' || (cat === 'gp' && includeGames)){
            const cell = document.createElement('td');
            cell.classList.add('cat-diff', 'text-center');
            cell.id = `${target}-${cat}-diff`;
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