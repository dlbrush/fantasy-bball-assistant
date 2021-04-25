document.addEventListener('DOMContentLoaded', async function() {
    const playerData = await getAllPlayers();
    const teamData = await getAllTeams();
    const players = getPlayers(playerData, teamData);
    const today = new Date();

    const userSearchBar = document.querySelector('#user-player-search-bar');
    const userResults = document.querySelector('#user-player-search-results');
    const userPlayerList = document.querySelector('#user-player-list');
    const userSearchContainer = document.querySelector('#user-player-search');
    const userTradeList = document.querySelector('#user-team-trade-list');
    const userPlayerSelect = document.querySelector('#user-player-select');

    const userSearch = new playerSearch(userSearchBar, userResults, userPlayerList, userSearchContainer, players, userTradeList, 12, userPlayerSelect);

    const oppSearchBar = document.querySelector('#opp-player-search-bar');
    const oppResults = document.querySelector('#opp-player-search-results');
    const oppPlayerList = document.querySelector('#opp-player-list');
    const oppSearchContainer = document.querySelector('#opp-player-search');
    const oppTradeList = document.querySelector('#opp-team-trade-list');
    const oppPlayerSelect = document.querySelector('#opp-player-select');

    const oppSearch = new playerSearch(oppSearchBar, oppResults, oppPlayerList, oppSearchContainer, players, oppTradeList, 12, oppPlayerSelect);

    const analyzeButton = document.querySelector('#analyze-trade');
    analyzeButton.addEventListener('click', analyzeTrade);

    /**
     * 1. Get per-game stats for each player on each side of trade
     * 2. Fill stats and totals
     * 3. Show comparison
     */
    async function analyzeTrade() {
        document.querySelector('#trade-results').classList.remove('hide');
        const userOptions = Array.from(userPlayerSelect.options);
        const oppOptions = Array.from(oppPlayerSelect.options);

        const userTradeStats = await analyzeTradeSide(userOptions, 'user', today, players);
        const oppTradeStats = await analyzeTradeSide(oppOptions, 'opp', today, players);
        const tradeResults = getTradeResults(userTradeStats, oppTradeStats);
        const diffCells = Array.from(document.querySelectorAll('.cat-diff'));
        mapDifferences(diffCells, tradeResults);
    }
})