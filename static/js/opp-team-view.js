document.addEventListener("DOMContentLoaded", async function() {
    const playerData = await getAllPlayers();
    const teamData = await getAllTeams();
    const players = getPlayers(playerData, teamData);

    const playerDivs = document.querySelectorAll('.team-player') ;
    playerDivs.forEach(playerDiv => {
        const player = getPlayer(playerDiv.id, players);
        populatePlayerInfo($(playerDiv), player, false);
    });
});