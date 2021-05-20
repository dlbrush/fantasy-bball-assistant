$(async function() {
    const playerData = await getAllPlayers();
    const teamData = await getAllTeams();
    const players = getPlayers(playerData, teamData);

    $('.team-player').each(function() {
        const player = getPlayer(this.id, players);
        populatePlayerInfo($(this), player, false);
    })
})