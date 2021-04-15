const $searchBar = $('#player-search-bar');
const $searchResults = $('#player-search-results');
const $playerList = $('#player-list')
const $playerChoices = $('select[name="players"]').children('option');
const players = getPlayers($playerChoices);

/**
 * Takes the player choice options from the form and returns an array with
 * the IDs and names associated.
 * @param {*} $choices = jQuery collection of option elements representing player choices from the form
 * @returns Array
 */
function getPlayers($choices) {
    return $choices.map(function(){ 
        return {name: this.innerText, ID: this.value} 
    }).get()
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
        const li = $(`<li class="searchplayer-choice" id="${player.ID}">${player.name}</li>`)
        $playerList.append(li)
    }
}

function handlePlayerChoice(evt) {
    const choice = evt.target.id;
    $(`option[value="${choice}"]`).prop('selected', true)
    $searchBar.val('')
    $playerList.empty();
    hideResults();
}

$searchBar.on('focusin', showResultsOnFocus);
$searchBar.keyup(handleSearch);
$playerList.on('click', 'li', handlePlayerChoice);
$(document).on('mouseup', hideResultsOnClick);