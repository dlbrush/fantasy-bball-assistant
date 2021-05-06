//Mock functions that require API data to use mock data

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

function getOpponentProjection(oppTeamId, userTeamId, players, teamData, date) {

    const oppData = testOpponentData;
    document.querySelector('#opponent-name').innerText = oppData.name;
    document.querySelector('#edit-opp-team').setAttribute('href', `/teams/${userTeamId}/opponents/${oppTeamId}/edit`);
    const oppTeamPlayerIds = oppData.players;
    const oppTeamPlayers = oppTeamPlayerIds.map(id => getPlayer(id, players));
    getTeamProjections(oppTeamPlayers, date, 'opp', teamData);
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
    const player = getPlayer(playerId, players);
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

describe('getComparison returns an object with the differences between the first object passed and the second one', function() {
    it('Returns the differences between two objects with all stats', function() {
        const results = {
            ID: 1627115,
            fgp: -10,
            ftp: 0,
            ppg: -10,
            rpg: -5,
            apg: 5,
            spg: 1,
            bpg: -1,
            topg: -4,
            gp: 0,
            tpg: -1,
            fgmpg: -6,
            fgapg: -10,
            ftmpg: -4,
            ftapg: -5
        }
        expect(getComparison(testStats1, testStats2)).toEqual(results);
    });

    it('Returns all stats subtracted from zero when only the first argument is defined', function() {
        const results = {
            ID: -2544,
            fgp: -50,
            ftp: -80,
            ppg: -20,
            rpg: -8.5,
            apg: -5,
            spg: -1,
            bpg: -1,
            topg: -5,
            gp: -1,
            tpg: -2,
            fgmpg: -10,
            fgapg: -20,
            ftmpg: -8,
            ftapg: -10
        }
        expect(getComparison(testStats1, undefined)).toEqual(results);
    });

    it('Returns all stats unchanged when only the second argument is defined', function() {
        expect(getComparison(undefined, testStats2)).toEqual(testStats2);
    });
});

describe('addStats adds together all stats passed in an object with the stats in another object', function() {
    it('Returns the sum of the stats stored in the two objects passed', function() {
        const results = {
            ID: 1632203,
            fgp: 90,
            ftp: 160,
            ppg: 30,
            rpg: 12,
            apg: 15,
            spg: 3,
            bpg: 1,
            topg: 6,
            gp: 2,
            tpg: 3,
            fgmpg: 14,
            fgapg: 30,
            ftmpg: 12,
            ftapg: 15
        };
            expect(addStats(testStats1, testStats2)).toEqual(results);
    });
});

describe("addPlayerToTotal adds the passed player's fantasy stats to the existing total stat object, multiplied by the number of games they're projected to play", function() {
    it('Adds stats for the next player to the total', function() {
        const results = {
            fgp: 150,
            ftp: 240,
            ppg: 140,
            rpg: 77,
            apg: 60,
            spg: 22,
            bpg: 12,
            topg: 30,
            gp: 7,
            tpg: 24,
            fgmpg: 70,
            fgapg: 140,
            ftmpg: 36,
            ftapg: 60
        }
        expect(addPlayerToTotal(testTeamTotals, testPlayerToProject1)).toEqual(results);
    })
});

describe('roundToTenth takes a number and rounds it to one decimal place', function() {
    it('Rounds the number to one decimal place when there are more than one', function() {
        expect(roundToTenth(10.3456)).toEqual(10.3);
    });

    it('Rounds the number to one decimal place when there is exactly one', function() {
        expect(roundToTenth(10.3)).toEqual(10.3);
    });

    it('Keeps the number the same when there is no decimal', function() {
        expect(roundToTenth(10)).toEqual(10);
    });
});

describe('getFantasyStats takes an object of player stats from the API and returns only the stats relevant to fantasy basketball', function() {
    it('Returns per-game stats for all relevant categories for fantasy basketball', function() {
        const cats = ['fgp', 'ftp', 'ppg', 'rpg', 'apg', 'spg', 'bpg', 'topg', 'gp', 'tpg', 'fgmpg', 'fgapg', 'ftmpg', 'ftapg'];
        const stats = getFantasyStats(testPlayerProfile);
        for (let stat in stats) {
            expect(cats).toContain(stat);
        }
    });

    it('Returns threes per game, field goals made and attempted per game, and free throws made and attempted per game calculated against games played', function() {
        const stats = getFantasyStats(testPlayerProfile);
        expect(stats.tpg).toEqual(roundToTenth(164/64));
        expect(stats.fgmpg).toEqual(roundToTenth(617/64));
        expect(stats.fgapg).toEqual(roundToTenth(1274/64));
        expect(stats.ftmpg).toEqual(roundToTenth(127/64));
        expect(stats.ftapg).toEqual(roundToTenth(152/64));
    });
});

describe('mapStatsToTable fills a set of cells (passed as an array) with the stats passed as the second argument', function() {
    it('Fills all cells passed with a stat name in their ID', function() {
        const table = document.querySelector('#user-totals');
        const cells = Array.from(table.querySelectorAll('td'));
        mapStatsToTable(cells, testTeamTotals);
        expect(table.querySelector('#user-gp-total').innerText).toEqual('5');
        expect(table.querySelector('#user-dummy-total').innerText).toEqual('');
    });
});

describe('addDiffToTable adds on a number to a cell showing the difference between the old total and the new one', function() {
    it('Adds a span to a stat cell containing the diff', function() {
        const table = document.querySelector('#user-totals');
        const cells = Array.from(table.querySelectorAll('.cat-user-total'));
        const diffedCells = addDiffToTable(cells, testTotalDiff);
        const gpCell = diffedCells.find(cell => cell.id === 'user-gp-total');
        expect(gpCell.querySelector('span')).toBeTruthy();
        expect(gpCell.querySelector('span').innerText).toContain('(+2)');
    });

    it('Adds text-success class to positive diffs, and text-danger to negative diffs', function() {
        const table = document.querySelector('#user-totals');
        const cells = Array.from(table.querySelectorAll('.cat-user-total'));
        const diffedCells = addDiffToTable(cells, testTotalDiff);
        for (let diffStat in testTotalDiff) {
            const cell = diffedCells.find(cell => cell.id === `user-${diffStat}-total`);
            if (cell) {
                const span = cell.querySelector('span');
                if (testTotalDiff[diffStat] > 0) {
                    expect(span.classList).toContain('text-success');
                } else {
                    expect(span.classList).toContain('text-danger');
                }
            }
        }
    });
});

describe('mapDifferences maps difference numbers directly to stat total cells', function() {
    it('Maps the difference as the value of a cell with an ID containing the name of the stat', function() {
        const table = document.querySelector('#user-totals');
        const cells = Array.from(table.querySelectorAll('.cat-user-total'));
        const mappedCells = mapDifferences(cells, testTotalDiff);
        const fgpCell = mappedCells.find(cell => cell.id === 'user-fgp-total');
        expect(fgpCell.innerText).toEqual(String(testTotalDiff['fgp']));
    });

    it('Adds the text-success class to positive differentials, and adds text-danger to negatives', function() {
        const table = document.querySelector('#user-totals');
        const cells = Array.from(table.querySelectorAll('.cat-user-total'));
        const mappedCells = mapDifferences(cells, testTotalDiff);
        for (let diffStat in testTotalDiff) {
            const cell = mappedCells.find(cell => cell.id === `user-${diffStat}-total`);
            if (cell) {
                if (testTotalDiff[diffStat] > 0) {
                    expect(cell.classList).toContain('text-success');
                } else {
                    expect(cell.classList).toContain('text-danger');
                }
            }
        }
    });
});

describe('createPlayerStatRow creates a row of cells to be filled with player info and stats', function() {
    it('Appends a row to a table body', function() {
        const table = document.createElement('table');
        const body = document.createElement('tbody');
        table.append(body);
        const row = createPlayerStatRow(body, testPlayer, true);
        expect(row.tagName).toEqual('TR');
        expect(body.firstChild).toBe(row);
    });

    it('Adds 10 category cells when includeGames is true, and adds 9 when it is false', function() {
        const table = document.createElement('table');
        const body = document.createElement('tbody');
        table.append(body);
        const row1 = createPlayerStatRow(body, testPlayer, true);
        const catCells1 = row1.querySelectorAll('.player-stat');
        expect(catCells1.length).toEqual(10);

        clearChildren(body);
        const row2 = createPlayerStatRow(body, testPlayer, false);
        const catCells2 = row2.querySelectorAll('.player-stat');
        expect(catCells2.length).toEqual(9);
    });

    it('Appends a header cell with the passed row title as the first cell if a row title is passed', function() {
        const table = document.createElement('table');
        const body = document.createElement('tbody');
        table.append(body);
        const row = createPlayerStatRow(body, testPlayer, true, 'ADDING');
        const firstCell = row.firstChild;
        expect(firstCell.innerText).toEqual('ADDING');
        expect(firstCell.classList).toContain('player-row-title');
    });
});

describe('createTotalStatRow creates a table row to contain the total stats for a player grid', function() {
    it('Appends a row to the passed table body', function() {
        const table = document.createElement('table');
        const body = document.createElement('tbody');
        table.append(body);
        const row = createTotalStatRow(body, 'user', true);
        expect(row.tagName).toEqual('TR');
        expect(body.firstChild).toBe(row);
    });

    it('Adds 10 category cells when includeGames is true, and adds 9 when it is false', function() {
        const table = document.createElement('table');
        const body = document.createElement('tbody');
        table.append(body);
        const row1 = createTotalStatRow(body, 'user', true);
        const catCells1 = row1.querySelectorAll('.cat-total');
        expect(catCells1.length).toEqual(10);

        clearChildren(body);
        const row2 = createTotalStatRow(body, 'user', false);
        const catCells2 = row2.querySelectorAll('.cat-total');
        expect(catCells2.length).toEqual(9);
    });

    it('Adds a header cell as the first cell in the row', function() {
        const table = document.createElement('table');
        const body = document.createElement('tbody');
        table.append(body);
        const row = createTotalStatRow(body, 'user', true);
        expect(row.firstChild.innerText).toEqual('TOTALS');
        expect(row.firstChild.tagName).toEqual('TH');
    });
});

describe('createDiffStatRow creates a row of table cells to be filled with stat differences. Used for trade and pickup analyzers.', function() {
    it('Appends a row to the passed table body', function() {
        const table = document.createElement('table');
        const body = document.createElement('tbody');
        table.append(body);
        const row = createDiffStatRow(body, 'user', true, 1);
        expect(row.tagName).toEqual('TR');
        expect(body.firstChild).toBe(row);
    });

    it('Adds 10 category cells when includeGames is true, and adds 9 when it is false', function() {
        const table = document.createElement('table');
        const body = document.createElement('tbody');
        table.append(body);
        const row1 = createDiffStatRow(body, 'user', true, 1);
        const catCells1 = row1.querySelectorAll('.cat-diff');
        expect(catCells1.length).toEqual(10);

        clearChildren(body);
        const row2 = createDiffStatRow(body, 'user', false, 1);
        const catCells2 = row2.querySelectorAll('.cat-diff');
        expect(catCells2.length).toEqual(9);
    });

    it('Adds a header cell as the first cell in the row', function() {
        const table = document.createElement('table');
        const body = document.createElement('tbody');
        table.append(body);
        const row = createDiffStatRow(body, 'user', false, 1);
        expect(row.firstChild.innerText).toEqual('CHANGE');
        expect(row.firstChild.tagName).toEqual('TH');
    });

    it('Adds leading cells equal in number to the number passed', function() {
        const table = document.createElement('table');
        const body = document.createElement('tbody');
        table.append(body);
        const row1 = createDiffStatRow(body, 'user', true, 3);
        const leadCells1 = row1.querySelectorAll('.leading-cell');
        expect(leadCells1.length).toEqual(3);

        clearChildren(body);
        const row2 = createDiffStatRow(body, 'user', true, 0);
        const leadCells2 = row2.querySelectorAll('.leading-cell');
        expect(leadCells2.length).toEqual(0);
    });
});

describe('getTeamProjections takes a list of players and projects their stats for the week of the date passed', function() {

});