class playerSearch {

    constructor(searchBar, results, playerList, container, players, targetList, targetColumns, playerSelect) {
        this.searchBar = searchBar;
        this.results = results;
        this.playerList = playerList;
        this.container = container;
        this.elements = [this.searchBar, this.results, this.playerList, this.container];
        this.targetList = targetList;
        this.playerSelect = playerSelect;
        this.targetColumns = targetColumns;

        this.players = players;
        this.selectedPlayers = new Set();

        this.showResultsOnFocus = this.showResultsOnFocus.bind(this);
        this.handleSearch = this.handleSearch.bind(this);
        this.handlePlayerChoice = this.handlePlayerChoice.bind(this);
        this.hideResultsOnClick = this.hideResultsOnClick.bind(this);
        this.handleRemovePlayer = this.handleRemovePlayer.bind(this);

        this.searchBar.addEventListener('focus', this.showResultsOnFocus);
        this.searchBar.addEventListener('keyup', this.handleSearch);
        this.playerList.addEventListener('click', this.handlePlayerChoice);
        this.targetList.addEventListener('click', this.handleRemovePlayer);
        document.addEventListener('mouseup', this.hideResultsOnClick);

        this.populatePlayerOptions();
        this.populateExistingPlayerChoices(this);
    }

    /**
     * Add a message to the player list when it is visible but there are no players showing.
     * Returns the appended HTML element.
     */
    showEmptyMessage() {
        clearChildren(this.playerList);
        const message = document.createElement('p');
        message.classList.add('lead');
        message.innerText = 'Choose players here';
        this.playerList.append(message);
        return message
    }

    /**
     * Show the search results when the search bar receives focus.
     * @param {Event} evt Event that triggers this function
     */
    showResultsOnFocus(evt) {
        this.results.classList.remove('hide');
        //If the search bar is empty, append a message. Otherwise, continue to show the players matching the current search.
        if (!evt.target.value) {
            this.showEmptyMessage();
        }
    }

    /**
     * Hides the list of results when the search container is clicked away from.
     * @param {Event} evt Event that triggers this function
     */
    hideResultsOnClick(evt) {
        // if the target of the click isn't an element of this search class, hide the search results
        const isSearchElement = this.elements.find(element => element.isEqualNode(evt.target));
        if (!isSearchElement) {
            this.hideResults();
        }
    }

    /**
     * Hide the list of results by giving it the hide class.
     */
    hideResults() {
        this.results.classList.add('hide');
    }

    /**
     * When the user changes the value of the search bar, either get the players matching the current value or show the empty message.
     * @param {Event} evt The event that triggers this function
     */
    handleSearch(evt) {
        const term = evt.target.value;
        if (!term) {
            this.showEmptyMessage();
        } else {
            const matches = this.getMatchedPlayers(term);
            this.populateMatchedPlayerNames(matches);
        }
    }

    /**
     * Takes a search term and returns an array of player objects where the player's name contains the term.
     * @param {string} term 
     * @returns {array} Array of player objects where the player's name contains the string passed
     */
    getMatchedPlayers(term) {
        return this.players.filter(player => {
            return this.matchPlayerName(term, player) && !this.selectedPlayers.has(player.ID);
        })
    }

    /**
     * Returns true if the search term is contained in the player object's name property, regardless of case.
     * @param {string} term 
     * @param {object} player 
     * @returns Boolean
     */
    matchPlayerName(term, player) {
        const regex = new RegExp(term, "i");
        return regex.test(player.name)
    }

    /**
     * Adds matched players to the list of results
     * @param {array} matches Array of matched player objects from getMatchedPlayers
     * @returns HTMLElement (ul of player choices)
     */
    populateMatchedPlayerNames(matches) {
        clearChildren(this.playerList);
        for (let player of matches) {
            const li = document.createElement('li');
            li.classList.add('player-choice');
            li.id = player.ID;
            li.innerText = player.name;
            this.playerList.append(li)
        }
        return this.playerList
    }

    /**
     * If the user clicks on one of the player choice list items,
     * add the player's ID to the list of selected players and display their info onscreen.
     * @param {Event} evt 
     */
    handlePlayerChoice(evt) {
        if (evt.target.tagName === 'LI') {
            const choiceId = evt.target.id;
            //If the user has already selected the player with this ID, return and do nothing else
            if (this.selectedPlayers.has(choiceId)) {
                return
            }
            this.selectedPlayers.add(choiceId)
            this.addPlayerChoice(choiceId);
            const player = getPlayer(choiceId, this.players);
            const block = addPlayerBlock(this.targetList, `col-${this.targetColumns}`, player);
            populatePlayerInfo(block, player, true);
    
            this.searchBar.value = '';
            clearChildren(this.playerList);
            this.hideResults();
        }
    }

    /**
     * When a remove player button is clicked, remove that player's block from the display list and deselect their option from the multiselect.
     * @param {Event} evt The event that triggers this function
     */
    handleRemovePlayer(evt) {
        if (evt.target.classList.contains('remove-player')) {
            const playerId = evt.target.id.substr(7);
            const playerBlock = document.querySelector(`#block-${playerId}`);
            playerBlock.remove();
            const option = document.querySelector(`option[value="${playerId}"]`);
            option.removeAttribute('selected');
            this.selectedPlayers.delete(playerId);
        }
    }

    /**
     * Adds an option element for each player to the selection element.
     */
    populatePlayerOptions() {
        for (let player of this.players) {
            const option = document.createElement('option');
            option.classList.add('player-choice');
            option.value = player.ID;
            option.innerText = player.name;
            this.playerSelect.append(option);
        }
    }

    /**
     * Adds the selected attribute to the option associated with the passed ID.
     * @param {Integer} choiceId Player ID of chosen player
     * @returns HTMLElement of selected option
     */
    addPlayerChoice(choiceId) {
        const option = this.playerSelect.querySelector(`option[value="${choiceId}"]`);
        if(option) {
            option.setAttribute('selected', true);
        }
        return option
    }

    /**
     * If there are any player blocks in the list of chosen players when the page loads (coming from the server), add them to the selections and populate player info
     * @param {playerSearch} searchInstance The callback function changes the scope of 'this', so we pass the search class instance in as a parameter
     */
    populateExistingPlayerChoices(searchInstance) {
        const playerBlocks = document.querySelectorAll('.team-player');
        playerBlocks.forEach(function(block) {
            const playerId = block.id.substr(6);
            searchInstance.addPlayerChoice(playerId);
            searchInstance.selectedPlayers.add(playerId);
            const player = getPlayer(playerId, searchInstance.players);
            populatePlayerInfo(block, player, true);
        });
    }

}

class singleChoicePlayerSearch extends playerSearch {
    constructor(searchBar, results, playerList, container, players, targetList, playerSelect) {
        super(searchBar, results, playerList, container, players, targetList, 12, playerSelect)
    }

    handlePlayerChoice(evt) {
        if (evt.target.tagName === 'LI') {
            const choiceId = evt.target.id;
            this.selectedPlayers.clear();
            this.selectedPlayers.add(choiceId);
            this.playerSelect.value = choiceId;
            const player = getPlayer(choiceId, this.players);
            const block = this.targetList.querySelector('.player-block');
            clearChildren(block);
            populatePlayerInfo(block, player, false);
    
            this.searchBar.value = '';
            clearChildren(this.playerList);
            this.hideResults();
        }
    }
}