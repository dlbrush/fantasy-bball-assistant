document.addEventListener("DOMContentLoaded", async function() {
    //Get API data and convert to player objects
    const playerData = await getAllPlayers();
    const teamData = await getAllTeams();
    const players = getPlayers(playerData, teamData);

    //Get all necessary info for the user's players
    const userTeamId = getTeamIDFromURL(window.location.href);
    const userTeamPlayerIds = await getUserTeamPlayerIds(userTeamId);
    const userTeamPlayers = userTeamPlayerIds.map(id => getPlayer(id, players));

    //Get the date and populate the date in the schedule
    const today = new Date();
    populateScheduleCells(today);

    //Get projections for the user's team
    await getTeamProjections(userTeamPlayers, today, 'user', teamData);

    //Add view switch functionality
    const viewSwitch = document.querySelector('#view-switch')
    viewSwitch.addEventListener('click', switchGridView);

    //Add opponent choice functionality
    const oppSelect = document.querySelector('#opponent-team-select');
    oppSelect.addEventListener('change', onOpponentChoice);

    function switchGridView(evt) {
        //First, return nothing if the targeted view is already active
        if (evt.target.classList.contains('grid-view-active')) {
            return
        } 
        
        //Get the stat grid (user or opponent) that is currently being shown
        const visibleGridContainer = document.querySelector('.container-show');
        const grids = visibleGridContainer.children;
        for (let grid of grids) {
            grid.classList.toggle('grid-show');
            grid.classList.toggle('grid-hidden');
        }
        
        //Toggle the active tag for both children of the switch
        const choices = viewSwitch.children
        for (let choice of choices) {
            choice.classList.toggle('grid-view-active');
        }
    }

    async function onOpponentChoice(evt) {
        const oppId = parseInt(evt.target.value);
        if (oppId) {
            const oppData = await getOpponentData(oppId);

            document.querySelector('#opponent-name').innerText = oppData.name;
            document.querySelector('#edit-opp-team').setAttribute('href', `/teams/${userTeamId}/opponents/${oppId}/edit`);
            const oppTeamPlayerIds = oppData.players;
            const oppTeamPlayers = oppTeamPlayerIds.map(id => getPlayer(id, players));
            await getTeamProjections(oppTeamPlayers, today, 'opp', teamData)
        }
    }
})