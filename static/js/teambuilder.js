document.addEventListener('DOMContentLoaded', async function() {
    const playerData = await getAllPlayers();
    const teamData = await getAllTeams();
    const players = getPlayers(playerData, teamData);

    const searchBar = document.querySelector('#player-search-bar');
    const results = document.querySelector('#player-search-results');
    const playerList = document.querySelector('#player-list');
    const searchContainer = document.querySelector('#player-search');
    const targetList = document.querySelector('#team-builder-list');
    const playerSelect = document.querySelector('#players');

    const search = new playerSearch(searchBar, results, playerList, searchContainer, players, targetList, 6, playerSelect);
});