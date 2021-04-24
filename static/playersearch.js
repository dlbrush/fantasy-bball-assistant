class playerSearch {

    constructor(searchBar, results, playerList, container, players, targetList, playerSelect) {
        this.searchBar = searchBar;
        this.results = results;
        this.playerList = playerList;
        this.container = container;
        this.elements = [this.searchBar, this.results, this.playerList, this.container];
        this.targetList = targetList;
        this.playerSelect = playerSelect;

        this.players = players;

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

        this.populatePlayerOptions(this.playerSelect, players);
        this.populateExistingPlayerChoices(this);
    }

    showEmptyMessage() {
        clearChildren(this.playerList);
        const message = document.createElement('p');
        message.classList.add('lead');
        message.innerText = 'Choose players here';
        this.playerList.append(message);
    }

    showResultsOnFocus(evt) {
        this.results.classList.remove('hide');
        //If the search bar is empty, append a message. Otherwise, continue to show the players matching the current search.
        if (!evt.target.value) {
            this.showEmptyMessage();
        }
    }

    hideResultsOnClick(evt) {
        // if the target of the click isn't an element of this search class, hide the search results
        const isSearchElement = this.elements.find(element => element.isEqualNode(evt.target));
        if (!isSearchElement) {
            this.hideResults();
        }
    }

    hideResults() {
        this.results.classList.add('hide');
    }

    handleSearch(evt) {
        const term = evt.target.value;
        if (!term) {
            this.showEmptyMessage();
        } else {
            const matches = this.getMatchedPlayers(term);
            this.populateMatchedPlayerNames(matches);
        }
    }

    getMatchedPlayers(term) {
        return this.players.filter(player => this.matchPlayerName(term, player))
    }

    matchPlayerName(term, player) {
        const regex = new RegExp(term, "i");
        return regex.test(player.name)
    }

    populateMatchedPlayerNames(matches) {
        clearChildren(this.playerList);
        for (let player of matches) {
            const li = document.createElement('li');
            li.classList.add('player-choice');
            li.id = player.ID;
            li.innerText = player.name;
            this.playerList.append(li)
        }
    }

    handlePlayerChoice(evt) {
        if (evt.target.tagName === 'LI') {
            const choiceId = evt.target.id;
            this.addPlayerChoice(choiceId);
            const player = getPlayer(choiceId, this.players);
            const block = addPlayerBlock(this.targetList, "col-6", player);
            populatePlayerInfo(block, player, true);
    
            this.searchBar.value = '';
            clearChildren(this.playerList);
            this.hideResults();
        }
    }

    addPlayerChoice(choiceId) {
        const option = document.querySelector(`option[value="${choiceId}"]`);
        option.setAttribute('selected', true);
    }

    handleRemovePlayer(evt) {
        if (evt.target.classList.contains('remove-player')) {
            const playerId = evt.target.id.substr(7);
            const playerBlock = document.querySelector(`#block-${playerId}`);
            playerBlock.remove();
            const option = document.querySelector(`option[value="${playerId}"]`);
            option.removeAttribute('selected');
        }
    }

    populatePlayerOptions(target, players) {
        for (let player of players) {
            const option = document.createElement('option');
            option.classList.add('player-choice');
            option.value = player.ID;
            option.innerText = player.name;
            target.append(option);
        }
    }

    populateExistingPlayerChoices(searchInstance) {
        const playerBlocks = document.querySelectorAll('.team-player');
        playerBlocks.forEach(function(block) {
            const playerId = block.id.substr(6);
            searchInstance.addPlayerChoice(playerId);
            const player = getPlayer(playerId, searchInstance.players);
            populatePlayerInfo(block, player, true);
        });
    }

}