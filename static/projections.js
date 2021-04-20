document.addEventListener("DOMContentLoaded", async function() {
    const playerData = await getAllPlayers();
    const teamData = await getAllTeams();
    const players = getPlayers(playerData, teamData);
    const userTeamId = getTeamIDFromURL(window.location.href);
    const userTeamPlayerIds = await getUserTeamPlayerIds(userTeamId);
    const userTeamPlayers = userTeamPlayerIds.map(id => getPlayer(id, players));
    console.log(players);
    console.log(userTeamPlayerIds);
    console.log(userTeamPlayers);
    const today = new Date();
    const userTotals = await getTeamTotals(userTeamPlayers, today);
    console.log(userTotals);
    const userTotalCells = Array.from(document.querySelectorAll('.cat-user-total'));
    console.log(userTotalCells);
    mapStatsToTable(userTotalCells, userTotals);
    players.forEach(player => {
        populatePlayerInfo($(`#player-${player.ID}-head`), player, false)
    })
    const allPlayerTotals = await Promise.all(userTeamPlayers.map(async function(player) {
        const playerTotals = await getPlayerTotals(player, today);
        return playerTotals;
    }));
    allPlayerTotals.forEach(playerTotals => {
        const playerTotalCells = Array.from(document.querySelectorAll(`.cat-${playerTotals.ID}-total`));
        console.log(playerTotalCells);
        mapStatsToTable(playerTotalCells, playerTotals);
    });
    console.log(allPlayerTotals);
})