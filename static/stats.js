const CATEGORIES = ['gp', 'fgp', 'ftp', 'tpg', 'rpg', 'apg', 'spg', 'bpg', 'topg', 'ppg'];  

/**
 * Projects the total stats that a team will produce for the week of the date passed and maps their stats onto the tables in the projection view.
 * @param {Number[]} teamPlayers An array of player IDs for the team being projected
 * @param {Date} date The date that we should predict stats for the week of
 * @param {String} targetName The target name affixed to 
 * @param {Object} teamData Team data from the API
 * @returns {Object} An object of stat totals
 */
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
    return allPlayerTotals
}

/**
 * Gets the necessary data to project stats for an opponent's team, and then calls getTeamProjections to map them to tables on projection view
 * @param {Number} oppTeamId The ID of the opponent's team in the database
 * @param {Number} userTeamId The ID of the user team that the opponent plays against 
 * @param {Object[]} players Array of player objects from getPlayers
 * @param {Object[]} teamData Array of team data from the API
 * @param {Date} date The date for the week we should project for
 * @returns {Object} Total projected stats organized as an object literal
 */
async function getOpponentProjection(oppTeamId, userTeamId, players, teamData, date) {

    const oppData = await getOpponentData(oppTeamId);
    document.querySelector('#opponent-name').innerText = oppData.name;
    document.querySelector('#edit-opp-team').setAttribute('href', `/teams/${userTeamId}/opponents/${oppTeamId}/edit`);
    const oppTeamPlayerIds = oppData.players;
    const oppTeamPlayers = oppTeamPlayerIds.map(id => getPlayer(id, players));
    const opponentProjections = await getTeamProjections(oppTeamPlayers, date, 'opp', teamData);
    return opponentProjections
}

/**
 * Finds the list of players that the user has chosen to trade for or trade away, and gets their total projected stats.
 * @param {HTMLElement[]} playerOptions An array of the option elements in the player select input
 * @param {String} target The string representing the target name being added to the cells
 * @param {Date} date Any date - this is needed for functions called within this function, but is not used
 * @param {Object[]} players an array of player objects from getPlayers
 * @returns {Object} Returns the sum of per-game stats for all players being traded from one side
 */
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
    const totalCells = Array.from(totalRow.children);
    mapStatsToTable(totalCells, playerTotals);
    return playerTotals
}

/**
 * Takes a player being picked up or dropped and gets their per-game and weekly stats
 * @param {Number} playerId The player being picked up or dropped
 * @param {Object[]} players The array of player objects from getAllPlayers
 * @param {String} actionString 'ADDING' or 'DROPPING' depending on which player this is
 * @param {HTMLElement} perGameBody The per-game stat table for this player
 * @param {HTMLElement} weeklyBody The weekly stat table for this player
 * @param {Date} date The date that we should project total weekly stats for
 * @returns {Object} Object with two objects contained, one for per-game stat totals and one for weekly stat totals
 */
async function analyzePickupSide(playerId, players, actionString, perGameBody, weeklyBody, date) {
    const player = getPlayer(playerId, players);
    createPlayerStatRow(perGameBody, player, false, actionString);
    populatePlayerInfo(perGameBody.querySelector(`.player-${player.ID}-head`), player, false);
    const perGameStats = await getPlayerTotals(player, date, 1);
    const perGameCells = Array.from(perGameBody.querySelectorAll(`.cat-${player.ID}-total`));
    mapStatsToTable(perGameCells, perGameStats);

    const playerGamesRemaining = await getNumWeekGamesRemaining(player, date);
    const weekStats = await getPlayerTotals(player, date, playerGamesRemaining);
    createPlayerStatRow(weeklyBody, player, true, actionString);
    populatePlayerInfo(weeklyBody.querySelector(`.player-${player.ID}-head`), player, false);
    const weekCells = Array.from(weeklyBody.querySelectorAll(`.cat-${player.ID}-total`));
    mapStatsToTable(weekCells, weekStats);

    return {perGameStats, weekStats}
}

/**
 * Creates an object representing the difference between two sets of stats.
 * If one argument is not passed, it will be treated as zeroes.
 * @param {Object} givingStats Per-game stats organized in an object literal
 * @param {Object} receivingStats Per-game stats organized in an object literal
 * @returns {Object} An object where each stat given is subtracted from the stat received.
 */
function getComparison(givingStats, receivingStats) {
    const results = {};
    if (!givingStats) {
        givingStats = {};
        for (let stat in receivingStats) {
            givingStats[stat] = 0;
        }
    } else if (!receivingStats) {
        receivingStats = {};
        for (let stat in givingStats) {
            receivingStats[stat] = 0;
        }
    }
    for (let stat in givingStats) {
        results[stat] = roundToTenth(receivingStats[stat] - givingStats[stat]);
    }
    return results;
}

/**
 * Adds together all stats passed in an object with the stats in another object
 * @param {Object} stats1 Per-game stats organized in an object literal
 * @param {Object} stats2 Per-game stats organized in an object literal
 * @returns {Object} Object containing the sum of the stats in the two objects passed
 */
function addStats(stats1, stats2) {
    let results = {};
    for (let stat in stats1) {
        results[stat] = roundToTenth(stats1[stat] + stats2[stat]);
    }
    return results;
}

/**
 * Takes a list of player IDs and calculates their total stats for the week of the passed date or the number of games passed as an argument
 * @param {Object} players Player data object from getPlayers
 * @param {Date} date The date to get projections for the week of
 * @param {Number} [numGames] Optional parameter. When passed, this will override the date passed and just project for the number of games passed
 * @returns {Object} Returns total stats organized as an object
 */
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

/**
 * Projects a player's total stats in the week of the passed date or for the number of games passed as an argument
 * @param {Object} player An object of player data from getPlayers
 * @param {Date} date The date that we should project stats for the week of
 * @param {Number} [numGames] Optional parameter. When passed, this will override the date passed and just project for the number of games passed
 * @returns {Object} Object of total stats for a player in a given week
 */
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

/**
 * Adds a player's stats to a counter of total stats, multiplied by the number of games they're projected to play. Used as a callback function to get total stats for a team.
 * @param {Object} currentTotals An object representing the current total stats. Is the reducer argument in getTeamTotals
 * @param {Object} nextPlayer An object containing the player's fantasy stats and their projected games
 * @returns {Object} The new total after the next player is added.
 */
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

/**
 * @param {Number} number 
 * @returns The number passed, rounded to 1 decimal place
 */
function roundToTenth(number) {
    return Math.round(number * 10) / 10
}

/**
 * Takes an object of player stats from the API and returns only the stats relevant to fantasy basketball
 * @param {Object} seasonStats Object of data from the API JSON for a player's profile
 * @returns {Object} Object containing relevant fantasy stats 
 */
function getFantasyStats(seasonStats) {
    const {fgp, ftp, ppg, rpg, apg, spg, bpg, topg, gamesPlayed:gp} = seasonStats;
    const tpg = roundToTenth(seasonStats.tpm/gp);
    const fgmpg = roundToTenth(seasonStats.fgm/gp);
    const fgapg = roundToTenth(seasonStats.fga/gp);
    const ftmpg = roundToTenth(seasonStats.ftm/gp);
    const ftapg = roundToTenth(seasonStats.fta/gp);
    return {fgp, ftp, ppg, rpg, apg, spg, bpg, topg, gp, tpg, fgmpg, fgapg, ftmpg, ftapg}
}

/**
 * Fills a set of cells with the stats passed as the second argument where the ID of the cell contains the name of the stat
 * @param {HTMLElement[]} cells An array of the total stat cells from the projection table
 * @param {Object} stats A stat object coming from getTotalStats
 * @returns {HTMLElement[]} The cells that were filled
 */
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
    return cells
}

/**
 * Adds on a number to a total stat cell showing the difference between the old total and the new one.
 * @param {HTMLElement[]} cells An array of HTMLElements where the differences should be added
 * @param {Object} diff An object of numbers representing the difference between the previous and new totals
 * @returns {HTMLElement[]} The cells that were filled
 */
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
    return cells
}

/**
 * Maps difference numbers directly to stat total cells. 
 * Used to show total change on pickup analysis. 
 * Differs from addDiffToTable in that this makes the difference number the whole value of the cell.
 * @param {HTMLElement[]} cells An array of table cell elements where the differences should be mapped
 * @param {Object} results The results of the diff you want to map to the table
 * @returns {HTMLElement[]} The cells where the values were mapped
 */
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
    return cells
}

/**
 * Creates an empty row of cells to be filled with player info and stats in a player stat grid
 * @param {HTMLElement} table The table body element that the row should be added to
 * @param {Object} player Player info object from getPlayer
 * @param {Boolean} includeGames If true, a column will be added for the number of games play
 * @param {String} [rowTitle] Optional param that will start the row with a title if present
 */
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
    return row;
}

/**
 * Creates a table row to contain the total stats for a player grid
 * @param {HTMLElement} table The table body element that the row should be added to 
 * @param {String} target A string identifying the cells to be targeted, usually 'opp' or 'user'
 * @param {Boolean} includeGames When true, games played will be included in the row
 * @returns {HTMLElement} The row that is added to the table
 */
function createTotalStatRow(table, target, includeGames) {
    const row = document.createElement('tr');
    row.class = 'stat-total-row';

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

/**
 * Creates a row of table cells to be filled with stat differences. Used for trade and pickup analyzers.
 * @param {HTMLElement} table The table body element that the row should be added to 
 * @param {String} target A string identifying the cells to be targeted, usually 'opp' or 'user'
 * @param {Boolean} includeGames When true, include games played as a category
 * @param {Number} leadingCells The number of empty cells between the row header and the first stat category cell. Used for columns that can't be diffed, like player info
 * @returns {HTMLElement} The row created
 */
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
        leadingCell.classList.add('leading-cell');
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

// This function may be used in a future version of this app but currently is not in use.
// function renderGamesInput(target, numGames, playerId) {
//     const input = document.createElement('input');
//     input.type = 'number';
//     input.value = numGames;
//     input.min = 0;
//     input.max = 7;
//     input.className = ('form-control player-gp-input')
//     input.id = `${playerId}-gp-input`
//     target.append(input);
// }