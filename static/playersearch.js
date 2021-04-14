const $searchBar = $('#player-search-bar');
const $searchResults = $('#player-search-results');
const $playerList = $('#player-list')
const $playerChoices = $('select[name="players"]').children('option');
const names = getPlayerNames($playerChoices);

//TODO: Need objects or something to track both names and IDs. Maybe this just collects the option objects and I derive names and IDs later on?
function getPlayerNames($choices) {
    return $choices.map(function(){ return this.innerText }).get()
}

function showResultsOnFocus() {
    $playerList.append('<p class="lead">Choose players here</p>');
    $searchResults.attr('hidden', false);
}

function hideResultsOnFocusOut() {
    $playerList.empty();
    $searchResults.attr('hidden', true);
}

function suggestPlayerName(evt) {
    const term = $(evt.target).value();
    matched = names.map(name => {
        const regex = new Regex(term)
        return regex.test(name)
    });
    populatePlayerNames(matched);
}

//TODO: This should not just handle names - ID or data needs to contain ID number
function populatePlayerNames(list) {
    for (let player of list) {
        const li = $(`<li class="player-choice">`)
    }
}

$searchBar.focusin(showResultsOnFocus);
$searchBar.focusout(hideResultsOnFocusOut);