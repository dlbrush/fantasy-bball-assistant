/**
 * Adds a div as a child of an element, where player info will be added
 * @param {HTMLElement} target The element that the new div will be appended to
 * @param {String} bsColumns A string formatted as col-{number} to be added as a class to fit into bootstrap columns
 * @param {Object} player Player info object from getPlayers
 * @returns {HTMLElement} The block being appended
 */
function addPlayerBlock(target, bsColumns, player) {
    const block = document.createElement('div');
    block.id = `block-${player.ID}`
    block.classList.add('team-player', bsColumns, 'shadow-sm', 'py-2', 'border', 'border-black');
    target.append(block);
    return block;
}

/**
 * Add all relevant player info to a player block. Also, give it a remove button if specified.
 * @param {HTMLElement} target The element that the new div will be appended to
 * @param {Object} player Player info object from getPlayers
 * @param {Boolean} removable Should we add a button allowing the user to remove the player from the list
 */
function populatePlayerInfo(target, player, removable) {
        const row = document.createElement('div');
        row.classList.add('row');

        const photoColumn = document.createElement('div');
        photoColumn.classList.add('player-photo', 'col-3');

        const photo = document.createElement('img');
        photo.classList.add('img-fluid');
        photo.src = this.getPlayerPhoto(player.ID);
        photoColumn.append(photo);

        const infoColumn = document.createElement('div');
        infoColumn.classList.add('player-info', 'col-9');
        const name = document.createElement('p');
        name.classList.add('lead', 'my-0', 'player-name');
        name.innerText = player.name;
        const info = document.createElement('p');
        info.classList.add('my-0', 'player-details');
        info.innerText = `${player.position} ${player.team}`;
        infoColumn.append(name, info);
        if (removable) {
            const remove = document.createElement('a');
            remove.classList.add('text-danger', 'remove-player');
            remove.id = `remove-${player.ID}`;
            remove.innerText = 'Remove';
            infoColumn.append(remove);
        }

        row.append(photoColumn, infoColumn);
        target.append(row);
        return row
}

/**
 * Takes the player and team data from the API and returns an array of objects with all the info we need for the app.
 * @param {Array} playerData Array of player data returned from the NBA API
 * @param {Array} teamData Array of team data returned from the NBA API
 * @returns {Array} Array of object literals containing only the relevant info for the app
 */
function getPlayers(playerData, teamData) {
    return playerData.map(player => ({
        name: `${player.firstName} ${player.lastName}`,
        ID: player.personId,
        team: getTeamData(player.teamId, teamData).initials,
        teamId: player.teamId,
        position: player.pos
    }))
}

/**
 * Finds the player matching the passed ID in an array of player objects
 * @param {String} playerId 
 * @param {Array} players Array of player info objects
 * @returns {Object} Player info object
 */
function getPlayer(playerId, players) {
    return players.find(player => player['ID'] == playerId)
}

/**
 * Gets a string matching the URL structure to get a photo of the player from the NBA CMS
 * @param {String} id Player's personId from the API
 * @returns String URL of the player's photo
 */
function getPlayerPhoto(id) {
    return `https://ak-static.cms.nba.com/wp-content/uploads/headshots/nba/latest/260x190/${id}.png`
}

/**
 * Takes a team ID from the player info object and gets the info we need for the app
 * @param {String} teamId Comes from player API data
 * @param {Array} teamData Array of team data objects from API
 * @returns {Object} Object with team initials and code
 */
function getTeamData(teamId, teamData) {
    const team = getTeam(teamId, teamData);
    return {
        initials: (team ? team['teamSitesOnly']['teamTricode'] : ""),
        code: (team ? team['teamSitesOnly']['teamCode'] : "")
    }
}

/**
 * Returns the object of team data from the API array matching the teamId passed.
 * @param {*} teamId teamID from the NBA API
 * @param {*} teamData Array of team objects from the API
 * @returns Object of data from the API for the team matching the teamId passed
 */
function getTeam(teamId, teamData) {
    return teamData.find(searchTeam => searchTeam.teamId == teamId);
}