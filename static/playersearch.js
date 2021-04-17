$(async function() {
    const playerData = await getAllPlayers();
    const teamData = await getAllTeams();
    const players = getPlayers(playerData, teamData);
    const $searchBar = $('#player-search-bar');
    const $searchResults = $('#player-search-results');
    const $playerList = $('#player-list')

    $searchBar.on('focusin', showResultsOnFocus);
    $searchBar.keyup(handleSearch);
    $playerList.on('click', 'li', handlePlayerChoice);
    $(document).on('mouseup', hideResultsOnClick);
    populatePlayerOptions($('#players'), players);
    populateExistingPlayerChoices();
    $('#team-builder-list').on('click', '.remove-player', handleRemovePlayer);

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
        addPlayerChoice(choiceId);
        const player = getPlayer(choiceId, players);
        const $block = addPlayerBlock($('#team-builder-list'), "col-6", player);
        populatePlayerInfo($block, player, true);

        $searchBar.val('')
        $playerList.empty();
        hideResults();
    }

    function addPlayerChoice(choiceId) {
        $(`option[value="${choiceId}"]`).prop('selected', true);
    }

    function handleRemovePlayer(evt) {
        const $teamPlayer = $(evt.target).parents('.team-player')
        const playerId = $teamPlayer.attr('id');
        $(`option[value="${playerId}"]`).prop('selected', false);
        $teamPlayer.remove();
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

    function populateExistingPlayerChoices() {
        $('.team-player').each(function() {
            addPlayerChoice(this.id)
            const player = getPlayer(this.id, players);
            populatePlayerInfo($(this), player, true);
        })
    }
});









