$(async function() {
    const playerData = await getAllPlayers();
    const teamData = await getAllTeams();
    const players = getPlayers(playerData);
    const $searchBar = $('#player-search-bar');
    const $searchResults = $('#player-search-results');
    const $playerList = $('#player-list')
    const $playerChoices = $('select[name="players"]').children('option');

    $searchBar.on('focusin', showResultsOnFocus);
    $searchBar.keyup(handleSearch);
    $playerList.on('click', 'li', handlePlayerChoice);
    $(document).on('mouseup', hideResultsOnClick);
    populatePlayerOptions($('#players'), players);
    $('#team-builder-list').on('click', '.remove-player', handleRemovePlayer);

    /**
     * Returns an array of the player data we'll want to use on a page
     */
    function getPlayers(playerData) {
        return playerData.map(player => ({
            name: `${player.firstName} ${player.lastName}`,
            ID: player.personId,
            team: getTeamInitials(player.teamId),
            position: player.pos
        }))
    }

    function getTeamInitials(teamId) {
        const team = teamData.find(searchTeam => searchTeam.teamId == teamId);
        if (team) {
            return team['tricode']
        }
        else {
            return ""
        }
    }

    function getPlayer(playerId) {
        return players.find(player => player['ID'] === playerId)
    }

    function showEmptyMessage() {
        $playerList.empty();
        $playerList.append('<p class="lead">Choose players here</p>');
    }

    function showResultsOnFocus(evt) {
        $searchResults.attr('hidden', false);
        //If the search bar is empty, append a message. Otherwise, continue to show the players matching the current search.
        if (!evt.target.value) {
            showEmptyMessage();
        }
    }

    function hideResultsOnClick(evt) {
        const container = $("#player-search");
        // if the target of the click isn't the container of the search nor a descendant of the container, hide the search results
        if (!container.is(evt.target) && container.has(evt.target).length === 0) 
        {
            hideResults();
        }
    }

    function hideResults() {
        $searchResults.attr('hidden', true);
    }

    function handleSearch(evt) {
        const term = $(evt.target).val();
        if (!term) {
            showEmptyMessage();
        } else {
            matches = getMatchedPlayers(term);
            populateMatchedPlayerNames(matches);
        }
    }

    function getMatchedPlayers(term) {
        return players.filter(player => matchPlayerName(term, player))
    }

    function matchPlayerName(term, player) {
        const regex = new RegExp(term, "i")
        return regex.test(player.name)
    }

    function populateMatchedPlayerNames(matches) {
        $playerList.empty();
        for (let player of matches) {
            const li = $(`<li class="player-choice" id="${player.ID}">${player.name}</li>`)
            $playerList.append(li)
        }
    }

    function handlePlayerChoice(evt) {
        const choiceId = evt.target.id;
        $(`option[value="${choiceId}"]`).prop('selected', true)

        const player = getPlayer(choiceId);
        addPlayerToList($('#team-builder-list'), 6, player);

        $searchBar.val('')
        $playerList.empty();
        hideResults();
    }

    function addPlayerToList($target, columns, player) {
        $target.append(`
            <div id="${player.ID}" class="team-player col-${columns} shadow-sm py-2 border border-black">
                <div class="row">
                    <div class="player-photo col-3">
                        <img src="${getPlayerPhoto(player.ID)}" class="img-fluid"></img>
                    </div>
                    <div class="player-info col-9">
                        <p class="lead my-0">${player.name}</p>
                        <p class="my-0">${player.position} ${player.team}</p>
                        <a class="text-danger remove-player">Remove</a> 
                    </div>
                </div>
            </div>
        `)
    }

    function handleRemovePlayer(evt) {
        const $teamPlayer = $(evt.target).parents('.team-player')
        const playerId = $teamPlayer.attr('id');
        $(`option[value="${playerId}"]`).prop('selected', false);
        $teamPlayer.remove();
    }

    function getPlayerPhoto(id) {
        return `https://ak-static.cms.nba.com/wp-content/uploads/headshots/nba/latest/260x190/${id}.png`
    }

    function populatePlayerOptions($target, players) {
        for (let player of players) {
            $target.append(
                `<option class="player-choice" value="${player.ID}">
                    ${player.name}
                </option>`
            );
        }
    }
});









