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
    document.querySelector('#pick-date').valueAsNumber = Date.now();

    //Get projections for the user's team
    await getTeamProjections(userTeamPlayers, today, 'user', teamData);

    //Add grid switch functionality
    const gridSwitch = document.querySelector('#view-switch');
    gridSwitch.addEventListener('click', switchGridView);

    //Add team switch functionality
    const teamSwitch = document.querySelector('#team-switch');
    teamSwitch.addEventListener('click', switchTeamView);

    //Add opponent choice functionality
    const oppSelect = document.querySelector('#opponent-team-select');
    oppSelect.addEventListener('change', onOpponentChoice);

    //Add date choice functionality
    const dateSelect = document.querySelector('#pick-date');
    dateSelect.addEventListener('change', projectFromDate);

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
        const choices = gridSwitch.children
        for (let choice of choices) {
            choice.classList.toggle('grid-view-active');
        }
    }

    function switchTeamView(evt) {
        //First, return nothing if the targeted view is already active
        if (evt.target.classList.contains('team-view-active')) {
            return
        } 
        
        //Toggle the container view for both containers
        const containers = document.querySelectorAll('.player-grid-container')
        for (let container of containers) {
            container.classList.toggle('container-show');
            container.classList.toggle('container-hidden');
        }

        //For the newly visible container, show the player stat view and hide the schedule
        const visibleContainer = document.querySelector('.container-show');
        visibleContainer.querySelector('.grid-stats').classList.add('grid-show');
        visibleContainer.querySelector('.grid-stats').classList.remove('grid-hidden');
        visibleContainer.querySelector('.grid-schedule').classList.add('grid-hidden');
        visibleContainer.querySelector('.grid-schedule').classList.remove('grid-show');

        //Set the grid switch so the stat view is active
        gridSwitch.querySelector('#view-stats').classList.add('grid-view-active');
        gridSwitch.querySelector('#view-schedule').classList.remove('grid-view-active');
        
        //Toggle the active tag for both children of the team switch
        const choices = teamSwitch.children
        for (let choice of choices) {
            choice.classList.toggle('team-view-active');
        }
    }

    async function onOpponentChoice(evt) {
        const oppId = parseInt(evt.target.value);
        if (oppId) {
            document.querySelector('#team-switch').classList.remove('hide');
            await getOpponentProjection(oppId, userTeamId, players, teamData, today);
            // const oppData = await getOpponentData(oppId);

            // document.querySelector('#opponent-name').innerText = oppData.name;
            // document.querySelector('#edit-opp-team').setAttribute('href', `/teams/${userTeamId}/opponents/${oppId}/edit`);
            // const oppTeamPlayerIds = oppData.players;
            // const oppTeamPlayers = oppTeamPlayerIds.map(id => getPlayer(id, players));
            // await getTeamProjections(oppTeamPlayers, today, 'opp', teamData)
        }
    }

    async function projectFromDate(evt) {
        const date = new Date(evt.target.value);
        await getTeamProjections(userTeamPlayers, date, 'user', teamData);
        if (oppSelect.value) {
            await getOpponentProjection(oppSelect.value, userTeamId, players, teamData, date);
        }
    }
})