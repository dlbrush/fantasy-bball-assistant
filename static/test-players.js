const target = document.createElement('div');
target.id = 'target';

describe('addPlayerBlock adds a div as a child of an element, where player info will be added', function() {

    it('Returns a div element with an ID containing the player ID', function() {
        const block = addPlayerBlock(target, 'col-12', testPlayer);
        expect(block.tagName).toEqual('DIV');
        expect(block.id).toEqual('block-2544');
    });

    it('Appends the div to the target', function() {
        const block = addPlayerBlock(target, 'col-12', testPlayer);
        expect(target.firstChild).toEqual(block);
    });

    afterAll(function() {
        clearChildren(target);
    });

});

describe('populatePlayerInfo adds all relevant player info to the player block, and adds a remove button if specified', function() {

    it('Returns a div with the class of row', function() {
        const block = addPlayerBlock(target, 'col-12', testPlayer);
        const row = populatePlayerInfo(block, testPlayer, true);
        expect(row.tagName).toEqual('DIV');
        expect(row.classList).toContain('row');
    });

    it('Appends the row to the target block', function() {
        const block = addPlayerBlock(target, 'col-12', testPlayer);
        const row = populatePlayerInfo(block, testPlayer, true);
        expect(block.firstChild).toEqual(row);
    });

    it('Adds a div for the player photo with an img as a child', function() {
        const block = addPlayerBlock(target, 'col-12', testPlayer);
        const row = populatePlayerInfo(block, testPlayer, true);
        const photoColumn = row.querySelector('div .player-photo');
        expect(photoColumn).toBeTruthy();
        expect(photoColumn.querySelector('img')).toBeTruthy();
    });

    it('Adds a div containing the player name and details', function() {
        const block = addPlayerBlock(target, 'col-12', testPlayer);
        const row = populatePlayerInfo(block, testPlayer, true);
        const infoColumn = row.querySelector('div .player-info');
        const name = infoColumn.querySelector('div .player-name');
        const details = infoColumn.querySelector('div .player-details');
        expect(name.innerText).toEqual('LeBron James');
        expect(details.innerText).toEqual('F LAL');
    });

    it('Adds an anchor tag if the block should be removable', function(){
        const block = addPlayerBlock(target, 'col-12', testPlayer);
        const row = populatePlayerInfo(block, testPlayer, true);
        const infoColumn = row.querySelector('div .player-info');
        expect(infoColumn.querySelector('a')).toBeTruthy();
    });

    it('Does not include anchor tag if the block should not be removable', function() {
        const block = addPlayerBlock(target, 'col-12', testPlayer);
        const row = populatePlayerInfo(block, testPlayer, false);
        const infoColumn = row.querySelector('div .player-info');
        expect(infoColumn.querySelector('a')).toBeFalsy();
    })

    afterAll(function() {
        clearChildren(target);
    });
});

describe('getPlayers takes the player and team data from the API and returns an array of objects with all the info we need for the app', function() {

    it('Returns an array with an object for every player in the data', function() {
        const players = getPlayers(testPlayerData, testTeamData);
        expect(players.length).toEqual(testPlayerData.length);
    });

    it('Returns object with name, ID, team, teamId, and position keys', function() {
        const keys = ['name', 'ID', 'team', 'teamId', 'position'];
        const players = getPlayers(testPlayerData, testTeamData);
        
        for(let key of keys) {
            expect(Object.keys(players[0])).toContain(key);
        }
    });
});

describe('getPlayer takes a passed player ID and finds the player info object with that ID', function() {
    it('Returns a player info object when a player is found', function() {
        const players = getPlayers(testPlayerData, testTeamData);
        const player = getPlayer('2544', players);
        expect(player).toEqual(testPlayer);
    });

    it('Returns undefined when a player is not found', function() {
        const players = getPlayers(testPlayerData, testTeamData);
        const player = getPlayer('abc', players);
        expect(player).toBeUndefined();
    });
});

describe('getPlayerPhoto takes a passed player ID and returns a string for the URL of a photo of that player from the NBA CMS', function() {

    it('Returns URL string containing the ID passed', function() {
        expect(getPlayerPhoto('2544')).toEqual('https://ak-static.cms.nba.com/wp-content/uploads/headshots/nba/latest/260x190/2544.png')
    });

});

describe('getTeamData takes a team ID from the player info object and gets the info we need for the app', function() {
    it('Returns team initials and code from team data when passed a valid team ID.', function() {
        const teamData = getTeamData('1610612747', testTeamData);
        expect(teamData.initials).toEqual('LAL');
        expect(teamData.code).toEqual('lakers');
    });

    it('Returns empty strings in object when an invalid team ID is passed', function() {
        const teamData = getTeamData('000', testTeamData);
        expect(teamData.initials).toEqual('');
        expect(teamData.code).toEqual('');
    });
});

describe('getTeam returns the object of team data from the API array matching the teamId passed.', function() {
    it('Returns team data object when a team is found', function() {
        const team = getTeam('1610612747', testTeamData);
        expect(team).toBeDefined();
    });

    it('Returns undefined when a team is not found', function() {
        const team = getTeam('0000', testTeamData);
        expect(team).toBeUndefined();
    });
});