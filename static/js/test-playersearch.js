//Set up the variables needed to make a search instance
const players = getPlayers(testPlayerData, testTeamData);

const searchBar = document.querySelector('#player-search-bar');
const results = document.querySelector('#player-search-results');
const playerList = document.querySelector('#player-list');
const searchContainer = document.querySelector('#player-search');
const targetList = document.querySelector('#team-builder-list');
const playerSelect = document.querySelector('#players');

const search = new playerSearch(searchBar, results, playerList, searchContainer, players, targetList, 6, playerSelect);

describe('showEmptyMessage adds a message to the list of players when there are no matches', function() {
    it('Returns a paragraph with a message and a class of lead', function() {
        const message = search.showEmptyMessage();
        expect(message.classList).toContain('lead');
        expect(message.innerText).toEqual('Choose players here');
    });

    it('Appends the paragraph to the player list', function() {
        const message = search.showEmptyMessage();
        expect(search.playerList.querySelector('p')).toBe(message);
    });
});

describe('hideResults hides the list of results', function() {
    it('Gives the hide class to the list of results', function() {
        search.results.classList.remove('hide');
        search.hideResults()
        expect(search.results.classList).toContain('hide');
    });
});

describe("getMatchedPlayers takes a search term and returns an array of player objects where the player's name contains the term", function() {
    it('Returns an array of 4 players with the name Davis', function() {
        expect(search.getMatchedPlayers('davis').length).toEqual(4);
    });

    it('Returns an empty array when no players match', function() {
        expect(search.getMatchedPlayers('abcd').length).toEqual(0);
    });
})

describe("matchPlayerName returns true if the search term is contained in the player object's name property, regardless of case", function() {
    it("Returns true if the search term is in the player's name", function() {
        const testPlayer = {name: 'LeBron James'}
        expect(search.matchPlayerName('lebron', testPlayer)).toEqual(true);
    });

    it("Returns false if the search term is not in the player's name", function() {
        const testPlayer = {name: 'Fake Player'}
        expect(search.matchPlayerName('abc', testPlayer)).toEqual(false);
    });
});

describe('populateMatchedPlayerNames adds matched players to the list of results in the search bar', function() {
    it('Adds 4 list items with class player-choice to the player list when players named Davis are matched', function() {
        const matches = search.getMatchedPlayers('davis');
        const newPlayerList = search.populateMatchedPlayerNames(matches);
        expect(newPlayerList.querySelectorAll('li').length).toEqual(4);
        expect(newPlayerList.querySelector('li').classList).toContain('player-choice');
        clearChildren(search.playerList)
    });
});

describe('populatePlayerOptions adds option elements to the selection element for each player in the data', function() {
    it('Adds 577 options using the test data', function() {
        clearChildren(search.playerSelect);
        search.populatePlayerOptions()
        expect(search.playerSelect.children.length).toEqual(577);
    });
});

describe('addPlayerChoice adds the selected attribute to the option associated with the passed ID', function() {
    it('Returns an option element with the selected attribute for a valid player ID', function() {
        const option = search.addPlayerChoice('201939');
        expect(option.tagName).toEqual('OPTION');
        expect(option.getAttribute('selected')).toEqual('true');
    });
});

describe('populateExistingPlayerChoices handles any player blocks that are present on page load', function() {
    it('Adds existing players to the selectedPlayers set', function() {
        search.selectedPlayers.clear();
        search.populateExistingPlayerChoices(search);
        expect(search.selectedPlayers.has('201939')).toEqual(true);
        expect(search.selectedPlayers.size).toBe(1);
    });

    it('Adds info to existing player blocks', function() {
        const playerBlocks = document.querySelectorAll('.team-player');
        playerBlocks.forEach(block => clearChildren(block));
        search.populateExistingPlayerChoices(search);
        playerBlocks.forEach(block => {
            expect(block.querySelector('.player-photo')).toBeTruthy();
        })
    });

    it('Selects the existing player option in the select element', function() {
        const option = document.querySelector('option[value="201939"]');
        option.removeAttribute('selected');
        search.populateExistingPlayerChoices(search);
        expect(option.hasAttribute('selected')).toEqual(true);
    })
});

//All functions not tested here are event listeners that are difficult to test