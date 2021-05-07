// Mock versions of the functions that access the app's JSON responses, hardcoded to the local server. The Flask server will need to be running to get success on these tests.

/**
 * Returns an array of the player IDs associated with a fantasy team in the database
 * @param {Number} teamId The team's ID in the database
 * @returns {Promise} When fulfilled, returns an array of player IDs
 */ 
 async function getUserTeamPlayerIds(teamId) {
    response = await axios.get(`http://127.0.0.1:5000/data/teams/${teamId}/players`);
    return response.data['players']
}

/**
 * Returns the name and players associated with an opponent team ID
 * @param {Number} oppTeamId The opponent team's ID in the database
 * @returns {Promise} 
 */
async function getOpponentData(oppTeamId) {
    response = await axios.get(`http://127.0.0.1:5000/data/oppteams/${oppTeamId}`);
    return response.data
}

// Test functions
describe('getAllPlayers', function() {
    it('Returns an array on successful request', async function() {
        const playerData = await getAllPlayers();
        expect(playerData instanceof Array).toEqual(true);
    });

    it('The response objects contain some expected properties', async function() {
        const playerData = await getAllPlayers();
        expect(Object.keys(playerData[0])).toContain('personId');
        expect(Object.keys(playerData[0])).toContain('teamId');
        expect(Object.keys(playerData[0])).toContain('pos');
    });
});

describe('getAllTeams', function() {
    it('Returns an array on successful request', async function() {
        const teamData = await getAllTeams();
        expect(teamData instanceof Array).toEqual(true);
    });

    it('The response objects contain some expected properties', async function() {
        const teamData = await getAllTeams();
        expect(Object.keys(teamData[0])).toContain('teamId');
        expect(Object.keys(teamData[0])).toContain('teamSitesOnly');
    });
});

describe('getTeamSchedule', function() {
    it('Returns an array on successful request', async function() {
        const teamData = await getTeamSchedule('lakers');
        expect(teamData instanceof Array).toEqual(true);
    });

    it('The response objects contain some expected properties', async function() {
        const teamData = await getTeamSchedule('lakers');
        expect(Object.keys(teamData[0])).toContain('seasonId');
        expect(Object.keys(teamData[0])).toContain('isHomeTeam');
    });
});

describe('getPlayerSeasonStats', function() {
    it('Returns an Object on successful request', async function() {
        const playerData = await getAllPlayers();
        const firstPlayerId = playerData[0]['personId']
        const playerStats = await getPlayerSeasonStats(firstPlayerId);
        expect(playerStats instanceof Object).toEqual(true);
    });

    it('The response object contains some expected stats', async function() {
        const playerData = await getAllPlayers();
        const firstPlayerId = playerData[0]['personId']
        const playerStats = await getPlayerSeasonStats(firstPlayerId);
        expect(Object.keys(playerStats)).toContain('bpg');
        expect(Object.keys(playerStats)).toContain('ppg');
        expect(Object.keys(playerStats)).toContain('fta');
    });

    it('The response object is from the current season', async function() {
        const playerData = await getAllPlayers();
        const firstPlayerId = playerData[0]['personId']
        const playerStats = await getPlayerSeasonStats(firstPlayerId);
        const season = getCurrentSeason();
        expect(playerStats.seasonYear).toEqual(season);
    });
});

describe('getUserTeamPlayerIds', function() {
    it('Returns an array on success', async function() {
        const playerIds = await getUserTeamPlayerIds(1);
        expect(playerIds instanceof Array).toEqual(true);
    });

    it('Array items are numbers', async function() {
        const playerIds = await getUserTeamPlayerIds(1);
        console.log(playerIds[0]);
        console.log(typeof playerIds[0]);
        expect(typeof playerIds[0]).toEqual('number');
    });
});

describe('getTeamIDFromURL', function() {
    it('Returns the URL segment that comes after "teams"', function(){
        const URL = 'www.fake.com/wins/winners/teams/3/loser';
        expect(getTeamIDFromURL(URL)).toEqual('3');
    });
});

describe('getCurrentSeason', function() {
    it('Returns the current year if it is past september, and the previous year otherwise', function() {
        const today = new Date();
        if (today.getMonth() < 8) {
            expect(getCurrentSeason()).toEqual(today.getFullYear() - 1);
        } else {
            expect(getCurrentSeason()).toEqual(today.getFullYear());
        }
    })
})