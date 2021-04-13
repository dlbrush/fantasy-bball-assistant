const $searchBar = $('#player-search-bar');
const $searchResults = $('#player-search-results');
const $playerChoices = $('select[name="players"]').children('option');
const names = getPlayerNames($playerChoices)

function getPlayerNames($choices) {
    return $choices.map(function(){ return this.innerText }).get()
}

function showResults() {

}