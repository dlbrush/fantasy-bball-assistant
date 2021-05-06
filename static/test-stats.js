describe('getTeamProjections projects the total stats that a team will produce for the week of the date passed and maps their stats onto the tables in the projection view', function() {
    it('Adds 2 rows to the schedule and stat grids when 2 players are passed', function() {
        const date = new Date(2021, 3, 26);
        const teamPlayers = testOpponentData.players;
        const allPlayerTotals = getTeamProjections(teamPlayers, date, 'user', testTeamData);
        const scheduleBody = document.querySelector('#user-player-grid-schedule-body');
        const statBody = document.querySelector('#user-player-grid-stats-body');
        expect(scheduleBody.querySelectorAll('tr').length).toEqual(2);
        expect(statBody.querySelectorAll('tr').length).toEqual(2);
    });

    it('Returns array with an object of stats for each player', function() {
        const date = new Date(2021, 3, 26);
        const teamPlayers = testOpponentData.players;
        const allPlayerTotals = getTeamProjections(teamPlayers, date, 'user', testTeamData);
        expect(allPlayerTotals.length).toEqual(2);
    });
})

describe("getOpponentProjection gets the necessary data to project stats for an opponent's team, and then calls getTeamProjections to map them to tables on projection view", function() {
    it('Appends the opponent team name to the page', function() {
        const players = getPlayers(testPlayerData, testTeamData);
        const date = new Date(2021, 3, 26);
        const projections = getOpponentProjection(1, 1, players, testTeamData, date);
        expect(document.querySelector('#opponent-name').innerText).toEqual('The Worst');
    });

    it('Sets the href of the link to edit the opponent team', function() {
        const players = getPlayers(testPlayerData, testTeamData);
        const date = new Date(2021, 3, 26);
        const projections = getOpponentProjection(1, 1, players, testTeamData, date);
        const link = '/teams/1/opponents/1/edit'
        expect(document.querySelector('#edit-opp-team').getAttribute('href')).toEqual(link);
    });

    it('Returns an array of stat objects for each player on the team', function() {
        const players = getPlayers(testPlayerData, testTeamData);
        const date = new Date(2021, 3, 26);
        const projections = getOpponentProjection(1, 1, players, testTeamData, date);
        expect(projections.length).toEqual(2);
    });
})

describe('analyzeTradeSide finds the list of players that the user has chosen to trade for or trade away, and maps their per-game stats.', function() {
    it('Returns per-game stats for selected players', function() {
        const players = getPlayers(testPlayerData, testTeamData);
        const options = Array.from(document.querySelector('#trade-players').options);
        const date = new Date(2021, 3, 26);
        const playerTotals = getTeamTotals([testPlayer], date, 1);
        const results = analyzeTradeSide(options, 'user', date, players);
        expect(results).toEqual(playerTotals);
    });
})

describe('analyzePickupSide takes a player being picked up or dropped and maps their per-game and weekly stats', function() {
    it('Maps a row in both the per-game and weekly tables passed', function() {
        const players = getPlayers(testPlayerData, testTeamData);
        const perGameTable = document.createElement('table');
        const perGameBody = document.createElement('tbody');
        perGameTable.append(perGameBody);
        const weeklyTable = document.createElement('table');
        const weeklyBody = document.createElement('tbody');
        weeklyTable.append(weeklyBody);
        const date = new Date(2021, 3, 26);

        const results = analyzePickupSide(2544, players, 'ADDING', perGameBody, weeklyBody, date);
        expect(perGameBody.querySelector('tr')).toBeTruthy();
        expect(weeklyBody.querySelector('tr')).toBeTruthy();
    });

    it('Returns per-game and weekly stats for the player', function() {
        const players = getPlayers(testPlayerData, testTeamData);
        const perGameTable = document.createElement('table');
        const perGameBody = document.createElement('tbody');
        perGameTable.append(perGameBody);
        const weeklyTable = document.createElement('table');
        const weeklyBody = document.createElement('tbody');
        weeklyTable.append(weeklyBody);
        const date = new Date(2021, 3, 26);

        const results = analyzePickupSide(2544, players, 'ADDING', perGameBody, weeklyBody, date);
        expect(results.perGameStats).toEqual(getPlayerTotals(testPlayer, date, 1));
        //3 games will remain after the first day of the week passed
        expect(results.weekStats).toEqual(getPlayerTotals(testPlayer, date, 3));
    })
});

describe('getTeamTotals takes a list of player IDs and calculates their total stats for the week of the passed date or the number of games passed as an argument', function() {
    it('Returns the total number of games played', function() {
        const teamPlayers = testOpponentData.players;
        const date = new Date(2021, 3, 26);
        const totals = getTeamTotals(teamPlayers, date, 2);
        expect(totals.gp).toEqual(4);
    });

    it('Returns fgp and ftp based on total attempts and makes, not adding together from the playerToProject objects', function() {
        const teamPlayers = testOpponentData.players;
        const date = new Date(2021, 3, 26);
        const totals = getTeamTotals(teamPlayers, date, 1);
        expect(totals.fgp).toEqual(48.2);
        expect(totals.ftp).toEqual(83.3);
    });
})

describe("getPlayerTotals projects a player's total stats in the week of the passed date or for the number of games passed as an argument", function() {
    it('Returns the player ID as a property', function() {
        const date = new Date(2021, 3, 26);
        const totals = getPlayerTotals(testPlayer, date);
        expect(totals.ID).toEqual(testPlayer.ID);
    });

    it('Returns FGP and FTP from projection stats without any multiplication', function() {
        const date = new Date(2021, 3, 26);
        const playerToProject = getPlayerToProject(testPlayer, date);
        const totals = getPlayerTotals(testPlayer, date);
        expect(totals.fgp).toEqual(playerToProject.fantasyStats.fgp);
        expect(totals.ftp).toEqual(playerToProject.fantasyStats.ftp);
    });

    it('Returns games played equal to projected games played', function() {
        const date = new Date(2021, 3, 26);
        const playerToProject = getPlayerToProject(testPlayer, date);
        const totals = getPlayerTotals(testPlayer, date);
        expect(totals.gp).toEqual(playerToProject.numProjectedGames);
    });

    it('Returns all other stats multiplied by games played', function() {
        const date = new Date(2021, 3, 26);
        const playerToProject = getPlayerToProject(testPlayer, date);
        const totals = getPlayerTotals(testPlayer, date);
        for(let stat in totals) {
            if(stat != 'gp' && stat != 'fgp' && stat != 'ftp' && stat!= 'ID') {
                expect(totals[stat]).toEqual(playerToProject.fantasyStats[stat] * playerToProject.numProjectedGames);
            }
        }
    });
})

describe('getPlayerToProject takes a player and a date and returns the number of games they are projected to play in a week and their per-game stats', function() {
    it('Returns a number of games based on the date when no number is passed', function() {
        const date = new Date(2021, 3, 26);
        const playerToProject = getPlayerToProject(testPlayer, date);
        expect(playerToProject.numProjectedGames).toEqual(4);
    });

    it('Returns the number of games passed when there is one instead of the schedule results', function() {
        const date = new Date(2021, 3, 26);
        const playerToProject = getPlayerToProject(testPlayer, date, 2);
        expect(playerToProject.numProjectedGames).toEqual(2);
    });

    it('Returns fantasy stats from the dataset for the passed player', function() {
        const date = new Date(2021, 3, 26);
        const playerToProject = getPlayerToProject(testPlayer, date, 2);
        expect(playerToProject.fantasyStats).toEqual(getFantasyStats(testPlayerProfile));
    });
});

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