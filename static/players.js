function addPlayerBlock($target, bsColumns, player) {
    const $block = $(`
        <div id="${player.ID}" class="team-player ${bsColumns} shadow-sm py-2 border border-black">  
        </div>
    `);
    $target.append($block);
    return $block
}

function populatePlayerInfo($target, player, removable) {
    const remove = (removable ? '<a class="text-danger remove-player">Remove</a>' : '');
    $target.append(`
        <div class="row">
            <div class="player-photo col-3">
                <img src="${getPlayerPhoto(player.ID)}" class="img-fluid"></img>
            </div>
            <div class="player-info col-9">
                <p class="lead my-0">${player.name}</p>
                <p class="my-0">${player.position} ${player.team}</p>
                ${remove} 
            </div>
        </div>
    `);
}

/**
 * Returns an array of the player data we'll want to use on a page
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

function getPlayer(playerId, players) {
    return players.find(player => player['ID'] == playerId)
}

function getPlayerPhoto(id) {
    return `https://ak-static.cms.nba.com/wp-content/uploads/headshots/nba/latest/260x190/${id}.png`
}

function getTeamData(teamId, teamData) {
    const team = getTeam(teamId, teamData);
    return {
        initials: (team ? team['teamSitesOnly']['teamTricode'] : ""),
        code: (team ? team['teamSitesOnly']['teamTricode'] : "")
    }
}

function getTeam(teamId, teamData) {
    return teamData.find(searchTeam => searchTeam.teamId == teamId);
}