function addPlayerBlock(target, bsColumns, player) {
    const block = document.createElement('div');
    block.id = `block-${player.ID}`
    block.classList.add('team-player', bsColumns, 'shadow-sm', 'py-2', 'border', 'border-black');
    target.append(block);
    return block;
}

//REMINDER - this used to take multiple inputs, so that might break in some places
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
        name.classList.add('lead', 'my-0');
        name.innerText = player.name;
        const info = document.createElement('p');
        info.classList.add('my-0');
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