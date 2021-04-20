const CATEGORIES = ['ppg', 'rpg', 'apg', 'spg', 'bpg', 'topg', 'tpg', 'fgmpg', 'fgapg', 'ftmpg', 'ftapg', 'fgp', 'ftp'];  

async function getTeamTotals(players, date) {
    const playersToProject = await Promise.all(players.map(async function(player) {
        const playerToProject = await getPlayerToProject(player, date);
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
    const playerToProject = await getPlayerToProject(player, date);
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
        const target = cells.find(cell => cell.id.includes(`-${stat}`));
        if (target) {
            target.innerText = stats[stat];
        }
    }
}